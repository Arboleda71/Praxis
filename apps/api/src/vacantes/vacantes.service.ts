import {
  ConflictException,
  Injectable,
  NotFoundException,
  type OnModuleInit,
  type OnModuleDestroy,
} from '@nestjs/common';
import {
  evaluarElegibilidad,
  hoyBogota,
  leerNit,
  type Busqueda,
  type VacanteDatos,
} from '@praxis/contracts';
import { randomUUID } from 'node:crypto';
import type { Prisma, Vacante } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma.service.js';
import { Archivos } from '../perfil/archivos.js';

const TAMANO = 20;
type Perfil = Prisma.EstudianteGetPayload<{
  include: { idiomas: true; archivos: true };
}>;
export const sumarMeses = (fecha: Date, meses: number) => {
  const d = new Date(fecha);
  const dia = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + meses);
  const ultimo = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0),
  ).getUTCDate();
  d.setUTCDate(Math.min(dia, ultimo));
  return d;
};
export const periodoGratis = (creada: Date, ahora = new Date()) => {
  let meses = 0;
  while (sumarMeses(creada, meses + 6) <= ahora) meses += 6;
  return sumarMeses(creada, meses);
};
export const datosVacante = (v: Vacante): VacanteDatos => ({
  ...v,
  fechaInicio: v.fechaInicio.toISOString().slice(0, 10),
  vigencia: v.vigencia.toISOString().slice(0, 10),
  avances: v.avances as VacanteDatos['avances'],
  idiomas: v.idiomas as VacanteDatos['idiomas'],
});
const perfilElegible = (p: Perfil) => ({
  ...p,
  hojaDeVida: p.archivos.some((a) => a.tipo === 'HOJA_DE_VIDA'),
  disponibleDesde: p.disponibleDesde?.toISOString().slice(0, 10) ?? null,
});

@Injectable()
export class VacantesService implements OnModuleInit, OnModuleDestroy {
  private reloj?: ReturnType<typeof setInterval>;
  constructor(
    private readonly prisma: PrismaService,
    private readonly archivos: Archivos,
  ) {}
  onModuleInit() {
    this.reloj = setInterval(() => {
      void this.cerrarVencidas().catch(() => {});
    }, 60_000);
    this.reloj.unref();
  }
  onModuleDestroy() {
    if (this.reloj) clearInterval(this.reloj);
  }
  cerrarVencidas() {
    return this.prisma.vacante.updateMany({
      where: { estado: 'Abierta', vigencia: { lt: new Date(hoyBogota()) } },
      data: { estado: 'Cerrada', motivoCierre: 'venció' },
    });
  }
  async propias(empresaId: string, b: Busqueda) {
    await this.cerrarVencidas();
    const where = { empresaId };
    const [items, total, cuenta] = await Promise.all([
      this.prisma.vacante.findMany({
        where,
        orderBy: [{ creadaEn: 'desc' }, { id: 'desc' }],
        skip: (b.pagina - 1) * TAMANO,
        take: TAMANO,
      }),
      this.prisma.vacante.count({ where }),
      this.prisma.cuenta.findUniqueOrThrow({ where: { id: empresaId } }),
    ]);
    const periodo = periodoGratis(cuenta.creadaEn);
    const usadas = await this.prisma.vacante.count({
      where: { empresaId, cupoTipo: 'gratis', cupoPeriodo: periodo },
    });
    return {
      items,
      total,
      pagina: b.pagina,
      cuposGratis: Math.max(0, 2 - usadas),
      periodoHasta: sumarMeses(periodo, 6),
    };
  }
  crear(empresaId: string, d: VacanteDatos) {
    return this.prisma.vacante.create({
      data: {
        ...d,
        empresaId,
        fechaInicio: new Date(d.fechaInicio),
        vigencia: new Date(d.vigencia),
      },
    });
  }
  async propia(empresaId: string, id: string) {
    const v = await this.prisma.vacante.findFirst({ where: { id, empresaId } });
    if (!v)
      throw new NotFoundException({ mensaje: 'No encontramos esta vacante.' });
    return v;
  }
  async editar(
    empresaId: string,
    id: string,
    d: VacanteDatos | { descripcion: string },
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Vacante" WHERE id = ${id}::uuid FOR UPDATE`;
      const v = await tx.vacante.findFirst({ where: { id, empresaId } });
      if (!v) throw new NotFoundException();
      if (
        v.estado === 'Cerrada' ||
        (v.estado === 'Abierta' && Object.keys(d).length !== 1)
      )
        throw new ConflictException({
          mensaje:
            'Los requisitos publicados no se pueden cambiar. Solo puedes editar la descripción de una vacante abierta.',
        });
      const data =
        'fechaInicio' in d
          ? {
              ...d,
              fechaInicio: new Date(d.fechaInicio),
              vigencia: new Date(d.vigencia),
            }
          : d;
      return tx.vacante.update({ where: { id }, data });
    });
  }
  async publicar(empresaId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Cuenta" WHERE id = ${empresaId}::uuid FOR UPDATE`;
      await tx.$queryRaw`SELECT id FROM "Vacante" WHERE id = ${id}::uuid FOR UPDATE`;
      const cuenta = await tx.cuenta.findUniqueOrThrow({
        where: { id: empresaId },
        include: { empresa: true },
      });
      const v = await tx.vacante.findFirst({ where: { id, empresaId } });
      if (!v) throw new NotFoundException();
      if (v.estado !== 'Borrador' || v.vigencia <= new Date(hoyBogota()))
        throw new ConflictException({
          mensaje:
            'Solo puedes publicar un borrador con vigencia posterior a hoy.',
        });
      if (
        !cuenta.correoConfirmadoEn ||
        !cuenta.empresa ||
        !leerNit(`${cuenta.empresa.nit}-${cuenta.empresa.dv}`).ok
      )
        throw new ConflictException({
          mensaje: 'Confirma tu correo y corrige el NIT antes de publicar.',
        });
      const periodo = periodoGratis(cuenta.creadaEn);
      const usadas = await tx.vacante.count({
        where: { empresaId, cupoTipo: 'gratis', cupoPeriodo: periodo },
      });
      let cupoTipo = 'gratis';
      let cupoPeriodo = periodo;
      if (usadas >= 2) {
        const e = cuenta.empresa;
        if (
          !e.plan ||
          !e.planInicioEn ||
          !e.planVenceEn ||
          e.planVenceEn <= new Date()
        )
          throw new ConflictException({
            mensaje:
              'Ya usaste las dos publicaciones gratis de este semestre. Consulta los planes.',
          });
        cupoTipo = e.plan;
        cupoPeriodo = e.planInicioEn;
        if (
          e.plan === 'basico' &&
          (await tx.vacante.count({
            where: { empresaId, cupoTipo, cupoPeriodo },
          })) >= 4
        )
          throw new ConflictException({
            mensaje:
              'Ya usaste las cuatro publicaciones adicionales de tu plan Básico.',
          });
        if (!['basico', 'ilimitado'].includes(e.plan))
          throw new ConflictException({
            mensaje: 'El plan no está habilitado.',
          });
      }
      return tx.vacante.update({
        where: { id },
        data: {
          estado: 'Abierta',
          publicadaEn: new Date(),
          cupoTipo,
          cupoPeriodo,
        },
      });
    });
  }
  async cerrar(empresaId: string, id: string) {
    const r = await this.prisma.vacante.updateMany({
      where: { id, empresaId, estado: 'Abierta' },
      data: { estado: 'Cerrada', motivoCierre: 'cerrada por la empresa' },
    });
    if (!r.count)
      throw new ConflictException({
        mensaje:
          'Solo puedes cerrar una vacante abierta propia. No se puede reabrir.',
      });
    return this.propia(empresaId, id);
  }
  async eliminar(empresaId: string, id: string) {
    const r = await this.prisma.vacante.deleteMany({
      where: { id, empresaId, estado: 'Borrador' },
    });
    if (!r.count)
      throw new ConflictException({
        mensaje: 'Solo se pueden eliminar borradores propios.',
      });
  }
  async recientes() {
    await this.cerrarVencidas();
    return this.prisma.vacante.findMany({
      where: { estado: 'Abierta' },
      orderBy: [{ publicadaEn: 'desc' }, { id: 'desc' }],
      take: 5,
      select: {
        id: true,
        titulo: true,
        modalidad: true,
        ciudad: true,
        vigencia: true,
        empresa: { select: { razonSocial: true } },
      },
    });
  }
  async buscar(b: Busqueda) {
    await this.cerrarVencidas();
    const where: Prisma.VacanteWhereInput = {
      estado: 'Abierta',
      ...(b.q ? { titulo: { contains: b.q, mode: 'insensitive' } } : {}),
      ...(b.nivel ? { niveles: { has: b.nivel } } : {}),
      ...(b.modalidad ? { modalidad: b.modalidad } : {}),
      ...(b.ciudad
        ? { ciudad: { equals: b.ciudad, mode: 'insensitive' } }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.vacante.findMany({
        where,
        skip: (b.pagina - 1) * TAMANO,
        take: TAMANO,
        orderBy: [{ publicadaEn: 'desc' }, { id: 'desc' }],
        select: {
          id: true,
          titulo: true,
          modalidad: true,
          ciudad: true,
          vigencia: true,
          empresa: { select: { razonSocial: true } },
        },
      }),
      this.prisma.vacante.count({ where }),
    ]);
    return { items, total, pagina: b.pagina };
  }
  private async perfil(tx: Prisma.TransactionClient, estudianteId: string) {
    return tx.estudiante.findUniqueOrThrow({
      where: { cuentaId: estudianteId },
      include: { idiomas: true, archivos: true },
    });
  }
  async detalle(id: string, estudianteId: string) {
    await this.cerrarVencidas();
    const v = await this.prisma.vacante.findFirst({
      where: { id, estado: { not: 'Borrador' } },
      include: { empresa: true },
    });
    if (!v) throw new NotFoundException();
    const p = await this.perfil(this.prisma, estudianteId);
    const anterior = await this.prisma.postulacion.findUnique({
      where: { vacanteId_estudianteId: { vacanteId: id, estudianteId } },
      select: { id: true, estado: true },
    });
    return {
      ...v,
      evaluacion: evaluarElegibilidad(datosVacante(v), perfilElegible(p)),
      postulación: anterior,
    };
  }
  async postular(id: string, estudianteId: string) {
    const copias: string[] = [];
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          await tx.$queryRaw`SELECT id FROM "Vacante" WHERE id = ${id}::uuid FOR UPDATE`;
          await tx.$queryRaw`SELECT "cuentaId" FROM "Estudiante" WHERE "cuentaId" = ${estudianteId}::uuid FOR UPDATE`;
          const v = await tx.vacante.findUnique({ where: { id } });
          if (
            !v ||
            v.estado !== 'Abierta' ||
            v.vigencia < new Date(hoyBogota())
          )
            throw new ConflictException({
              mensaje: 'Esta vacante ya no recibe postulaciones.',
            });
          if (
            await tx.postulacion.findUnique({
              where: {
                vacanteId_estudianteId: { vacanteId: id, estudianteId },
              },
            })
          )
            throw new ConflictException({
              mensaje:
                'Ya te postulaste a esta vacante, aunque hayas retirado tu postulación.',
            });
          const p = await this.perfil(tx, estudianteId);
          const evaluacion = evaluarElegibilidad(
            datosVacante(v),
            perfilElegible(p),
          );
          if (!evaluacion.puedePostular)
            throw new ConflictException({
              mensaje: evaluacion.perfilMinimo.completo
                ? 'Tu nivel de formación no está entre los aceptados.'
                : 'Completa nivel de formación, programa y hoja de vida antes de postularte.',
              evaluacion,
            });
          const perfil = {
            nombreCompleto: p.nombreCompleto,
            nivelFormacion: p.nivelFormacion,
            programa: p.programa,
            institucion: p.institucion,
            avance: p.avance,
            disponibleDesde: p.disponibleDesde?.toISOString() ?? null,
            jornada: p.jornada,
            aval: p.aval,
            idiomas: p.idiomas.map((i) => ({
              idioma: i.idioma,
              nivel: i.nivel,
            })),
          };
          const postulacion = await tx.postulacion.create({
            data: {
              vacanteId: id,
              estudianteId,
              perfil,
              evaluacion,
              historial: { create: { estado: 'Enviada' } },
            },
          });
          for (const a of p.archivos) {
            const clave = `${randomUUID()}.${a.clave.split('.').at(-1)}`;
            copias.push(clave);
            await this.archivos.copiar(a.clave, clave);
            await tx.archivoPostulacion.create({
              data: {
                postulacionId: postulacion.id,
                tipo: a.tipo,
                clave,
                nombre: a.nombre,
                bytes: a.bytes,
              },
            });
          }
          await tx.notificacion.createMany({
            data: [
              {
                cuentaId: estudianteId,
                postulacionId: postulacion.id,
                texto: `Tu postulación a ${v.titulo} fue enviada.`,
              },
              {
                cuentaId: v.empresaId,
                postulacionId: postulacion.id,
                texto: `Recibiste una postulación a ${v.titulo}.`,
              },
            ],
          });
          return postulacion;
        },
        { timeout: 20_000 },
      );
    } catch (error) {
      await Promise.allSettled(copias.map((c) => this.archivos.borrar(c)));
      throw error;
    }
  }
}
