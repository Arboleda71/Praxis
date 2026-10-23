import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  IDIOMAS,
  LIMITES_ARCHIVO,
  errorArchivo,
  perfilMinimo,
  tipoPorContenido,
  type Disponibilidad,
  type Formacion,
  type Formato,
  type TipoArchivo,
} from '@praxis/contracts';
import { randomUUID } from 'node:crypto';
import type { TipoArchivo as TipoArchivoDb } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma.service.js';
import { Archivos } from './archivos.js';

const EN_DB: Record<TipoArchivo, TipoArchivoDb> = {
  'hoja-de-vida': 'HOJA_DE_VIDA',
  'soporte-aval': 'SOPORTE_AVAL',
  foto: 'FOTO',
};

export type ArchivoSubido = {
  buffer: Buffer;
  originalname: string;
  size: number;
};

@Injectable()
export class PerfilService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly archivos: Archivos,
  ) {}

  async obtener(cuentaId: string) {
    const e = await this.prisma.estudiante.findUniqueOrThrow({
      where: { cuentaId },
      include: { idiomas: true, archivos: true },
    });
    const archivo = (tipo: TipoArchivoDb) => {
      const a = e.archivos.find((x) => x.tipo === tipo);
      return a
        ? { nombre: a.nombre, bytes: a.bytes, subidoEn: a.subidoEn }
        : null;
    };
    const orden = (id: string) => IDIOMAS.findIndex((i) => i.id === id);
    const hojaDeVida = archivo('HOJA_DE_VIDA');
    return {
      nombre: e.nombreCompleto,
      formacion: {
        nivelFormacion: e.nivelFormacion,
        programa: e.programa,
        institucion: e.institucion,
        avance: e.avance,
      },
      disponibilidad: {
        disponibleDesde: e.disponibleDesde?.toISOString().slice(0, 10) ?? null,
        jornada: e.jornada,
        idiomas: e.idiomas
          .sort((a, b) => orden(a.idioma) - orden(b.idioma))
          .map(({ idioma, nivel }) => ({ idioma, nivel })),
      },
      aval: e.aval,
      archivos: {
        hojaDeVida,
        soporteAval: archivo('SOPORTE_AVAL'),
        foto: archivo('FOTO'),
      },
      perfilMinimo: perfilMinimo({
        nivelFormacion: e.nivelFormacion,
        programa: e.programa,
        hojaDeVida: !!hojaDeVida,
      }),
    };
  }

  async guardarFormacion(cuentaId: string, d: Formacion) {
    await this.prisma.estudiante.update({
      where: { cuentaId },
      data: { ...d, perfilActualizadoEn: new Date() },
    });
    return this.obtener(cuentaId);
  }

  async guardarDisponibilidad(cuentaId: string, d: Disponibilidad) {
    await this.prisma.$transaction([
      this.prisma.estudiante.update({
        where: { cuentaId },
        data: {
          disponibleDesde: d.disponibleDesde
            ? new Date(d.disponibleDesde)
            : null,
          jornada: d.jornada,
          perfilActualizadoEn: new Date(),
        },
      }),
      this.prisma.idiomaDeclarado.deleteMany({ where: { cuentaId } }),
      this.prisma.idiomaDeclarado.createMany({
        data: d.idiomas.map((i) => ({ cuentaId, ...i })),
      }),
    ]);
    return this.obtener(cuentaId);
  }

  /** «No» o sin responder quita el soporte: no hay aval que soportar. */
  async guardarAval(cuentaId: string, aval: boolean | null) {
    const anterior = await this.prisma.$transaction(async (tx) => {
      await tx.estudiante.update({
        where: { cuentaId },
        data: { aval, perfilActualizadoEn: new Date() },
      });
      if (aval === true) return null;
      const a = await tx.archivoPerfil.findUnique({
        where: { cuentaId_tipo: { cuentaId, tipo: 'SOPORTE_AVAL' } },
      });
      if (a) await tx.archivoPerfil.delete({ where: { id: a.id } });
      return a;
    });
    if (anterior) await this.archivos.borrar(anterior.clave);
    return this.obtener(cuentaId);
  }

  async subir(cuentaId: string, tipo: TipoArchivo, archivo: ArchivoSubido) {
    const formato = tipoPorContenido(archivo.buffer.subarray(0, 8));
    const error = errorArchivo(tipo, { formato, bytes: archivo.size });
    if (error) {
      const formatoValido = (
        LIMITES_ARCHIVO[tipo].formatos as readonly Formato[]
      ).includes(formato!);
      throw new HttpException(
        { errores: { archivo: error } },
        formatoValido ? HttpStatus.PAYLOAD_TOO_LARGE : HttpStatus.BAD_REQUEST,
      );
    }
    if (tipo === 'soporte-aval') {
      const { aval } = await this.prisma.estudiante.findUniqueOrThrow({
        where: { cuentaId },
        select: { aval: true },
      });
      if (aval !== true)
        throw new BadRequestException({
          errores: {
            archivo:
              'Primero responde «Sí» a «¿Tienes aval de tu institución?».',
          },
        });
    }

    const clave = `${randomUUID()}.${formato}`;
    // multer entrega el nombre en latin1; el navegador lo envía en UTF-8.
    const nombre = Buffer.from(archivo.originalname, 'latin1')
      .toString('utf8')
      .slice(0, 200);
    await this.archivos.guardar(clave, archivo.buffer);
    const where = { cuentaId_tipo: { cuentaId, tipo: EN_DB[tipo] } };
    const datos = { clave, nombre, bytes: archivo.size, subidoEn: new Date() };
    let anterior;
    try {
      anterior = await this.prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT "cuentaId" FROM "Estudiante" WHERE "cuentaId" = ${cuentaId}::uuid FOR UPDATE`;
        if (
          tipo === 'soporte-aval' &&
          !(await tx.estudiante.findUniqueOrThrow({ where: { cuentaId } })).aval
        )
          throw new BadRequestException({
            errores: { archivo: 'Primero declara el aval.' },
          });
        const previo = await tx.archivoPerfil.findUnique({ where });
        await tx.archivoPerfil.upsert({
          where,
          create: { cuentaId, tipo: EN_DB[tipo], ...datos },
          update: datos,
        });
        return previo;
      });
    } catch (e) {
      await this.archivos.borrar(clave);
      throw e;
    }
    // El anterior se borra al final: si algo falla antes, el perfil conserva su archivo (FR-013).
    if (anterior) await this.archivos.borrar(anterior.clave);
    return this.obtener(cuentaId);
  }

  async quitar(cuentaId: string, tipo: TipoArchivo) {
    if (tipo === 'hoja-de-vida')
      throw new BadRequestException({
        mensaje: 'La hoja de vida se puede reemplazar, pero no quitar.',
      });
    await this.borrar(cuentaId, EN_DB[tipo]);
    return this.obtener(cuentaId);
  }

  async enlace(cuentaId: string, tipo: TipoArchivo) {
    const a = await this.prisma.archivoPerfil.findUnique({
      where: { cuentaId_tipo: { cuentaId, tipo: EN_DB[tipo] } },
    });
    if (!a)
      throw new NotFoundException({
        mensaje: 'Todavía no has subido este archivo.',
      });
    return this.archivos.enlace(a.clave);
  }

  private async borrar(cuentaId: string, tipo: TipoArchivoDb) {
    const a = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "cuentaId" FROM "Estudiante" WHERE "cuentaId" = ${cuentaId}::uuid FOR UPDATE`;
      const actual = await tx.archivoPerfil.findUnique({
        where: { cuentaId_tipo: { cuentaId, tipo } },
      });
      if (actual) await tx.archivoPerfil.delete({ where: { id: actual.id } });
      return actual;
    });
    if (a) await this.archivos.borrar(a.clave);
  }
}
