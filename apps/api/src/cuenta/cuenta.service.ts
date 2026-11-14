import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';
import { createHash, randomBytes } from 'node:crypto';
import {
  TAMANO_PAGINA,
  type BusquedaCuentas,
  type CambioAcceso,
  type Supresion,
} from '@praxis/contracts';
import { PrismaService } from '../prisma.service.js';
import { cuentaActiva } from '../auth/sesion.js';
import { LimpiezaService } from './limpieza.service.js';

export const huellaNit = (nit: string) =>
  createHash('sha256').update(`praxis:nit:${nit}`).digest('hex');
const CUENTA_ADMIN = {
  id: true,
  correo: true,
  rol: true,
  creadaEn: true,
  correoConfirmadoEn: true,
  accesoRevocadoEn: true,
  eliminadaEn: true,
  empresa: { select: { razonSocial: true, nit: true, dv: true } },
} as const;

@Injectable()
export class CuentaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly limpieza: LimpiezaService,
  ) {}
  async cuentas(b: BusquedaCuentas) {
    const q = b.q?.replace(/[\\%_]/g, '\\$&');
    const where = {
      rol: b.rol ?? {
        in: ['ESTUDIANTE', 'EMPRESA'] as ('ESTUDIANTE' | 'EMPRESA')[],
      },
      ...(b.acceso === 'eliminado'
        ? { eliminadaEn: { not: null } }
        : b.acceso === 'revocado'
          ? { eliminadaEn: null, accesoRevocadoEn: { not: null } }
          : b.acceso === 'activo'
            ? { eliminadaEn: null, accesoRevocadoEn: null }
            : {}),
      ...(q
        ? {
            OR: [
              { correo: { contains: q, mode: 'insensitive' as const } },
              {
                empresa: {
                  razonSocial: { contains: q, mode: 'insensitive' as const },
                },
              },
              { empresa: { nit: { contains: q.replace(/[.\s-]/g, '') } } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.cuenta.findMany({
        where,
        select: CUENTA_ADMIN,
        orderBy: [{ creadaEn: 'desc' }, { id: 'desc' }],
        skip: (b.pagina - 1) * TAMANO_PAGINA,
        take: TAMANO_PAGINA,
      }),
      this.prisma.cuenta.count({ where }),
    ]);
    return { items, total, pagina: b.pagina };
  }
  async detalle(id: string) {
    const c = await this.prisma.cuenta.findFirst({
      where: { id, rol: { not: 'ADMIN' } },
      select: {
        ...CUENTA_ADMIN,
        cambiosAcceso: {
          orderBy: [{ fecha: 'asc' }, { id: 'asc' }],
          select: {
            id: true,
            accion: true,
            motivo: true,
            fecha: true,
            responsable: { select: { correo: true } },
          },
        },
      },
    });
    if (!c) throw new NotFoundException();
    return c;
  }
  async acceso(adminId: string, id: string, d: CambioAcceso) {
    await this.prisma.$transaction(async (tx) => {
      // Orden estable si dos administradores actúan a la vez.
      for (const cuentaId of [adminId, id].sort())
        await tx.$queryRaw`SELECT id FROM "Cuenta" WHERE id = ${cuentaId}::uuid FOR NO KEY UPDATE`;
      const responsable = await cuentaActiva(tx, adminId);
      if (responsable.rol !== 'ADMIN') throw new ForbiddenException();
      const c = await tx.cuenta.findUnique({ where: { id } });
      if (!c) throw new NotFoundException();
      if (c.rol === 'ADMIN' || c.eliminadaEn)
        throw new ConflictException({
          mensaje: 'No se puede modificar el acceso de esta cuenta.',
        });
      if ((d.accion === 'revocar') === !!c.accesoRevocadoEn)
        throw new ConflictException({
          mensaje: 'La cuenta ya tiene ese estado de acceso.',
        });
      await tx.cuenta.update({
        where: { id },
        data: { accesoRevocadoEn: d.accion === 'revocar' ? new Date() : null },
      });
      await tx.historialAcceso.create({
        data: { cuentaId: id, responsableId: adminId, ...d },
      });
      if (d.accion === 'revocar')
        await tx.sesion.deleteMany({ where: { cuentaId: id } });
    });
    return this.detalle(id);
  }
  async suprimir(id: string, d: Supresion) {
    const hashAnonimo = await hash(randomBytes(48).toString('hex'));
    const archivosPropios: string[] = [];
    await this.prisma.$transaction(
      async (tx) => {
        const c = await cuentaActiva(tx, id);
        if (c.rol === 'ADMIN')
          throw new ForbiddenException({
            mensaje:
              'La supresión de administradores requiere otro responsable.',
          });
        if (!(await verify(c.contrasenaHash, d.contrasena)))
          throw new UnauthorizedException({
            mensaje: 'La contraseña actual no es correcta.',
          });
        const claves: string[] = [];
        if (c.rol === 'ESTUDIANTE') {
          await tx.$queryRaw`SELECT "cuentaId" FROM "Estudiante" WHERE "cuentaId" = ${id}::uuid FOR UPDATE`;
          const postulaciones = await tx.postulacion.findMany({
            where: { estudianteId: id },
            include: {
              archivos: true,
              vacante: { select: { empresaId: true, titulo: true } },
            },
          });
          for (const p0 of postulaciones) {
            await tx.$queryRaw`SELECT id FROM "Postulacion" WHERE id = ${p0.id}::uuid FOR UPDATE`;
            const p = await tx.postulacion.findUniqueOrThrow({
              where: { id: p0.id },
            });
            claves.push(...p0.archivos.map((a) => a.clave));
            if (['Enviada', 'En revisión', 'Entrevista'].includes(p.estado)) {
              await tx.historialPostulacion.create({
                data: {
                  postulacionId: p.id,
                  estado: 'Retirada',
                  detalle: 'cuenta eliminada',
                },
              });
              await tx.notificacion.create({
                data: {
                  cuentaId: p0.vacante.empresaId,
                  postulacionId: p.id,
                  texto: `Una postulación a ${p0.vacante.titulo} fue retirada: cuenta eliminada.`,
                },
              });
            }
            await tx.postulacion.update({
              where: { id: p.id },
              data: {
                estado: ['Enviada', 'En revisión', 'Entrevista'].includes(
                  p.estado,
                )
                  ? 'Retirada'
                  : p.estado,
                perfil: {
                  nombreCompleto: 'Estudiante que eliminó su cuenta',
                  programa: null,
                  nivelFormacion: null,
                  institucion: null,
                  avance: null,
                  jornada: null,
                  aval: null,
                  disponibleDesde: null,
                  idiomas: [],
                },
                evaluacion: {
                  requisitos: [],
                  programas: { solicitados: [], declarado: null },
                },
              },
            });
          }
          claves.push(
            ...(
              await tx.archivoPerfil.findMany({
                where: { cuentaId: id },
                select: { clave: true },
              })
            ).map((a) => a.clave),
          );
          await tx.archivoPostulacion.deleteMany({
            where: { postulacion: { estudianteId: id } },
          });
          await tx.archivoPerfil.deleteMany({ where: { cuentaId: id } });
          await tx.idiomaDeclarado.deleteMany({ where: { cuentaId: id } });
          await tx.estudiante.update({
            where: { cuentaId: id },
            data: {
              nombreCompleto: 'Estudiante que eliminó su cuenta',
              nivelFormacion: null,
              programa: null,
              institucion: null,
              avance: null,
              disponibleDesde: null,
              jornada: null,
              aval: null,
              perfilActualizadoEn: null,
            },
          });
        } else {
          const e = await tx.empresa.findUniqueOrThrow({
            where: { cuentaId: id },
          });
          await tx.$queryRaw`SELECT 1 AS bloqueado FROM pg_advisory_xact_lock(hashtextextended(${e.nit}, 0))`;
          if (e.logoClave) claves.push(e.logoClave);
          await tx.nitReservado.upsert({
            where: { huella: huellaNit(e.nit) },
            create: { huella: huellaNit(e.nit) },
            update: {},
          });
          const vacantes = await tx.vacante.updateManyAndReturn({
            where: { empresaId: id, estado: 'Abierta' },
            data: { estado: 'Cerrada', motivoCierre: 'cuenta eliminada' },
            select: { id: true, titulo: true },
          });
          for (const v of vacantes) {
            const ps = await tx.postulacion.findMany({
              where: { vacanteId: v.id },
              select: { id: true, estudianteId: true },
            });
            if (ps.length)
              await tx.notificacion.createMany({
                data: ps.map((p) => ({
                  cuentaId: p.estudianteId,
                  postulacionId: p.id,
                  texto: `La vacante ${v.titulo} está cerrada: cuenta eliminada. El historial se conserva.`,
                })),
              });
          }
          await tx.vacante.deleteMany({
            where: { empresaId: id, estado: 'Borrador' },
          });
          await tx.vacante.updateMany({
            where: { empresaId: id },
            data: { descripcion: 'Empresa que eliminó su cuenta' },
          });
          await tx.empresa.update({
            where: { cuentaId: id },
            data: {
              razonSocial: 'Empresa que eliminó su cuenta',
              nit: `eliminada:${id}`,
              dv: 0,
              sector: null,
              ciudad: null,
              sitioWeb: null,
              descripcion: null,
              correoContacto: null,
              telefono: null,
              logoClave: null,
              logoNombre: null,
              logoBytes: null,
              plan: null,
              planInicioEn: null,
              planVenceEn: null,
            },
          });
        }
        if (claves.length)
          await tx.archivoPorBorrar.createMany({
            data: claves.map((clave) => ({ clave })),
            skipDuplicates: true,
          });
        archivosPropios.push(...claves);
        await tx.sesion.deleteMany({ where: { cuentaId: id } });
        await tx.enlaceConfirmacion.deleteMany({ where: { cuentaId: id } });
        await tx.enlaceRestablecer.deleteMany({ where: { cuentaId: id } });
        await tx.notificacion.deleteMany({ where: { cuentaId: id } });
        await tx.historialAcceso.updateMany({
          where: { cuentaId: id },
          data: { motivo: 'Cuenta eliminada; motivo anonimizado.' },
        });
        await tx.cuenta.update({
          where: { id },
          data: {
            eliminadaEn: new Date(),
            correo: `${id}@cuenta-eliminada.invalid`,
            contrasenaHash: hashAnonimo,
            correoConfirmadoEn: null,
          },
        });
      },
      { timeout: 20000 },
    );
    await this.limpieza.procesar();
    return {
      eliminada: true,
      archivosPendientes:
        (await this.prisma.archivoPorBorrar.count({
          where: { clave: { in: archivosPropios } },
        })) > 0,
    };
  }
}
