import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  idSchema,
  PLANES,
  type EventoWompi,
  type Plan,
} from '@praxis/contracts';
import { PrismaService } from '../prisma.service.js';
import { sumarMeses } from '../vacantes/vacantes.service.js';
import {
  configuracionSandbox,
  firmarIntegridad,
  validarFirmaEvento,
  WompiClient,
} from './wompi.js';

@Injectable()
export class PagosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wompi: WompiClient,
  ) {}
  async planes(empresaId: string) {
    const empresa = await this.prisma.empresa.findUniqueOrThrow({
      where: { cuentaId: empresaId },
    });
    let disponible = true;
    try {
      configuracionSandbox();
    } catch {
      disponible = false;
    }
    return {
      planes: PLANES,
      modo: 'sandbox',
      disponible,
      plan: empresa.plan,
      planVenceEn: empresa.planVenceEn,
      activo: !!empresa.planVenceEn && empresa.planVenceEn > new Date(),
    };
  }
  async crear(empresaId: string, plan: Plan) {
    const c = configuracionSandbox();
    const pago = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Cuenta" WHERE id = ${empresaId}::uuid FOR UPDATE`;
      const e = await tx.empresa.findUniqueOrThrow({
        where: { cuentaId: empresaId },
      });
      if (e.planVenceEn && e.planVenceEn > new Date())
        throw new ConflictException({
          mensaje:
            'Tu plan sigue activo. La renovación manual estará disponible cuando venza.',
        });
      const pendiente = await tx.pago.findFirst({
        where: { empresaId, estado: 'Pendiente' },
      });
      if (pendiente) {
        if (pendiente.plan !== plan)
          throw new ConflictException({
            mensaje:
              'Ya tienes un pago pendiente de otro plan. Revisa su estado antes de continuar.',
          });
        return pendiente;
      }
      return tx.pago.create({
        data: { empresaId, plan, montoCentavos: PLANES[plan].centavos },
      });
    });
    const url = new URL('https://checkout.wompi.co/p/');
    url.search = new URLSearchParams({
      'public-key': c.publica,
      currency: 'COP',
      'amount-in-cents': String(pago.montoCentavos),
      reference: pago.id,
      'signature:integrity': firmarIntegridad(
        pago.id,
        pago.montoCentavos,
        c.integridad,
      ),
      'redirect-url': `${process.env.WEB_URL || 'http://localhost:3000'}/empresa/planes`,
    }).toString();
    return { pagoId: pago.id, url: url.toString(), modo: 'sandbox' };
  }
  async evento(e: EventoWompi) {
    const c = configuracionSandbox();
    if (!validarFirmaEvento(e, c.eventos))
      throw new UnauthorizedException({
        mensaje: 'Firma de evento no válida.',
      });
    const transaccion = await this.wompi.consultar(e.data.transaction.id);
    if (
      transaccion.id !== e.data.transaction.id ||
      !idSchema.safeParse(transaccion.reference).success
    )
      throw new BadRequestException({
        mensaje: 'La transacción no corresponde a una referencia de Praxis.',
      });
    const original = await this.prisma.pago.findUnique({
      where: { id: transaccion.reference },
    });
    if (!original) throw new NotFoundException();
    if (
      transaccion.amount_in_cents !== original.montoCentavos ||
      transaccion.currency !== 'COP' ||
      (original.wompiId && original.wompiId !== transaccion.id)
    )
      throw new BadRequestException({
        mensaje:
          'El importe, moneda o transacción no coincide con el pago registrado.',
      });
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Cuenta" WHERE id = ${original.empresaId}::uuid FOR UPDATE`;
      const pago = await tx.pago.findUniqueOrThrow({
        where: { id: original.id },
      });
      if (pago.estado === 'Aprobado') return { recibido: true };
      const ahora = new Date();
      if (transaccion.status === 'APPROVED') {
        await tx.pago.update({
          where: { id: pago.id },
          data: {
            estado: 'Aprobado',
            wompiId: transaccion.id,
            aprobadaEn: ahora,
          },
        });
        await tx.empresa.update({
          where: { cuentaId: pago.empresaId },
          data: {
            plan: pago.plan,
            planInicioEn: ahora,
            planVenceEn: sumarMeses(ahora, 6),
          },
        });
      } else {
        await tx.pago.update({
          where: { id: pago.id },
          data: {
            wompiId: transaccion.id,
            estado: ['DECLINED', 'VOIDED', 'ERROR'].includes(transaccion.status)
              ? 'Rechazado'
              : 'Pendiente',
          },
        });
      }
      return { recibido: true };
    });
  }
}
