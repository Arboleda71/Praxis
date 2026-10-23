import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { puedeRetirar, TRANSICIONES } from '@praxis/contracts';
import { PrismaService } from '../prisma.service.js';

@Injectable()
export class SeguimientoService {
  constructor(private readonly prisma: PrismaService) {}
  async cambiar(
    cuentaId: string,
    rol: 'ESTUDIANTE' | 'EMPRESA',
    id: string,
    estado: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Postulacion" WHERE id = ${id}::uuid FOR UPDATE`;
      const p = await tx.postulacion.findUnique({
        where: { id },
        include: { vacante: true },
      });
      if (
        !p ||
        (rol === 'ESTUDIANTE'
          ? p.estudianteId !== cuentaId
          : p.vacante.empresaId !== cuentaId)
      )
        throw new NotFoundException();
      const permitido =
        rol === 'ESTUDIANTE'
          ? estado === 'Retirada' && puedeRetirar(p.estado)
          : (TRANSICIONES[p.estado] ?? []).includes(estado);
      if (!permitido)
        throw new ConflictException({
          mensaje:
            'Este cambio de estado no está permitido. Los estados finales no se reabren.',
        });
      await tx.historialPostulacion.create({
        data: { postulacionId: id, estado },
      });
      await tx.notificacion.createMany({
        data: [p.estudianteId, p.vacante.empresaId].map((cuentaId) => ({
          cuentaId,
          postulacionId: id,
          texto: `Postulación a ${p.vacante.titulo}: ${estado}.`,
        })),
      });
      return tx.postulacion.update({ where: { id }, data: { estado } });
    });
  }
}
