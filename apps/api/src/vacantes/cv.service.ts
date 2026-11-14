import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { errorArchivo, tipoPorContenido } from '@praxis/contracts';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma.service.js';
import { Archivos } from '../perfil/archivos.js';
import type { ArchivoSubido } from '../perfil/perfil.service.js';
import { cuentaActiva } from '../auth/sesion.js';
import { LimpiezaService } from '../cuenta/limpieza.service.js';

@Injectable()
export class CvService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly archivos: Archivos,
    private readonly limpieza: LimpiezaService,
  ) {}
  async reemplazar(cuentaId: string, id: string, archivo?: ArchivoSubido) {
    if (!archivo)
      throw new BadRequestException({
        mensaje: 'Elige un PDF de máximo 5 MB.',
      });
    const formato = tipoPorContenido(archivo.buffer.subarray(0, 8));
    const error = errorArchivo('hoja-de-vida', {
      formato,
      bytes: archivo.size,
    });
    if (error)
      throw archivo.size > 5 * 1024 * 1024
        ? new PayloadTooLargeException({ mensaje: error })
        : new BadRequestException({ mensaje: error });
    const clave = `${randomUUID()}.pdf`;
    await this.archivos.guardar(clave, archivo.buffer);
    try {
      await this.prisma.$transaction(async (tx) => {
        await cuentaActiva(tx, cuentaId);
        await tx.$queryRaw`SELECT "cuentaId" FROM "Estudiante" WHERE "cuentaId" = ${cuentaId}::uuid FOR UPDATE`;
        await tx.$queryRaw`SELECT id FROM "Postulacion" WHERE id = ${id}::uuid FOR UPDATE`;
        const p = await tx.postulacion.findFirst({
          where: { id, estudianteId: cuentaId },
          include: { vacante: { select: { empresaId: true, titulo: true } } },
        });
        if (!p) throw new NotFoundException();
        if (p.estado !== 'Enviada')
          throw new ConflictException({
            mensaje:
              'La empresa ya empezó a revisarla o la postulación terminó. El CV no se puede cambiar.',
          });
        const anterior = await tx.archivoPostulacion.findUniqueOrThrow({
          where: {
            postulacionId_tipo: { postulacionId: id, tipo: 'HOJA_DE_VIDA' },
          },
        });
        await tx.archivoPostulacion.update({
          where: { id: anterior.id },
          data: {
            clave,
            nombre: Buffer.from(archivo.originalname, 'latin1')
              .toString('utf8')
              .slice(0, 200),
            bytes: archivo.size,
          },
        });
        await tx.archivoPorBorrar.create({ data: { clave: anterior.clave } });
        await tx.postulacion.update({
          where: { id },
          data: { cvReemplazadoEn: new Date() },
        });
        await tx.historialPostulacion.create({
          data: { postulacionId: id, estado: 'CV reemplazado' },
        });
        await tx.notificacion.create({
          data: {
            cuentaId: p.vacante.empresaId,
            postulacionId: id,
            texto: `El estudiante reemplazó el CV de su postulación a ${p.vacante.titulo}.`,
          },
        });
      });
    } catch (e) {
      await this.prisma.archivoPorBorrar.upsert({
        where: { clave },
        create: { clave },
        update: {},
      });
      await this.limpieza.procesar();
      throw e;
    }
    await this.limpieza.procesar();
    return { actualizado: true };
  }
}
