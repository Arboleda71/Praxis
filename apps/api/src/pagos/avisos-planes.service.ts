import {
  Injectable,
  Logger,
  type OnModuleInit,
  type OnModuleDestroy,
} from '@nestjs/common';
import { PLANES, type Plan } from '@praxis/contracts';
import { PrismaService } from '../prisma.service.js';

export const ANTICIPACION_PLAN_MS = 7 * 86400000;

export function avisoVencimiento(
  plan: string | null,
  vence: Date | null,
  ahora = new Date(),
) {
  if (
    !plan ||
    !Object.hasOwn(PLANES, plan) ||
    !vence ||
    vence <= ahora ||
    vence.getTime() - ahora.getTime() > ANTICIPACION_PLAN_MS
  )
    return null;
  const fecha = vence.toLocaleDateString('es-CO', {
    timeZone: 'America/Bogota',
  });
  return `Tu plan ${PLANES[plan as Plan].nombre} vence el ${fecha}. Puedes renovar manualmente al vencer en Planes y pagos. No hay cobro automático.`;
}

export function avisoPlan(
  plan: string | null,
  vence: Date | null,
  ahora = new Date(),
) {
  if (!plan || !Object.hasOwn(PLANES, plan) || !vence) return null;
  if (vence > ahora) return avisoVencimiento(plan, vence, ahora);
  return `Tu plan ${PLANES[plan as Plan].nombre} venció el ${vence.toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })}. Puedes renovar manualmente en Planes y pagos. Vuelves al cupo gratuito de dos publicaciones cada seis meses. Tus vacantes abiertas no se cierran y no hay cobro automático.`;
}

@Injectable()
export class AvisosPlanesService implements OnModuleInit, OnModuleDestroy {
  private temporizador?: ReturnType<typeof setInterval>;
  private readonly log = new Logger(AvisosPlanesService.name);
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const comprobar = () => {
      void this.generar().catch(() =>
        this.log.error('No se pudieron generar los avisos de planes.'),
      );
    };
    await this.generar();
    this.temporizador = setInterval(comprobar, 3600000);
    this.temporizador.unref();
  }

  onModuleDestroy() {
    clearInterval(this.temporizador);
  }

  async generar(cuentaId?: string) {
    const ahora = new Date();
    const empresas = await this.prisma.empresa.findMany({
      where: {
        cuentaId,
        plan: { in: ['basico', 'ilimitado'] },
        cuenta: { eliminadaEn: null, accesoRevocadoEn: null },
        planVenceEn: {
          lte: new Date(ahora.getTime() + ANTICIPACION_PLAN_MS),
        },
      },
      select: { cuentaId: true, plan: true, planVenceEn: true },
    });
    const data = empresas.flatMap((e) => {
      const texto = avisoPlan(e.plan, e.planVenceEn, ahora);
      return texto && e.planVenceEn
        ? [
            {
              cuentaId: e.cuentaId,
              texto,
              clave: `plan${e.planVenceEn <= ahora ? '-vencido' : ''}:${e.cuentaId}:${e.planVenceEn.toISOString()}`,
            },
          ]
        : [];
    });
    if (data.length)
      await this.prisma.notificacion.createMany({ data, skipDuplicates: true });
  }
}
