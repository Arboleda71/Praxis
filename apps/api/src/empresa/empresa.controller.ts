import {
  Body,
  BadRequestException,
  ConflictException,
  Controller,
  Get,
  Delete,
  HttpCode,
  UseInterceptors,
  UploadedFile,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  empresaSchema,
  leerNit,
  errorArchivo,
  tipoPorContenido,
  type FichaEmpresa,
} from '@praxis/contracts';
import {
  SoloEmpresaGuard,
  cuentaActiva,
  type RequestConSesion,
} from '../auth/sesion.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import { Archivos } from '../perfil/archivos.js';
import type { ArchivoSubido } from '../perfil/perfil.service.js';
import { LimpiezaService } from '../cuenta/limpieza.service.js';
import { huellaNit } from '../cuenta/cuenta.service.js';
import { ZodPipe } from '../auth/zod.pipe.js';
import { PrismaService } from '../prisma.service.js';

@Controller('empresa')
@UseGuards(SoloEmpresaGuard)
export class EmpresaController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly archivos: Archivos,
    private readonly limpieza: LimpiezaService,
  ) {}
  @Get('perfil')
  async obtener(@Req() req: RequestConSesion) {
    const ficha = await this.prisma.empresa.findUniqueOrThrow({
      where: { cuentaId: req.sesion.cuentaId },
    });
    const nitValido = leerNit(`${ficha.nit}-${ficha.dv}`).ok;
    const { logoClave, ...publica } = ficha;
    return {
      ...publica,
      logoUrl: logoClave ? (await this.archivos.enlace(logoClave)).url : null,
      correoConfirmado: !!req.sesion.cuenta.correoConfirmadoEn,
      nitValido,
      puedePublicar: !!req.sesion.cuenta.correoConfirmadoEn && nitValido,
      declaracion: 'Datos declarados por la empresa',
    };
  }
  @Put('perfil')
  async guardar(
    @Req() req: RequestConSesion,
    @Body(new ZodPipe(empresaSchema)) d: FichaEmpresa,
  ) {
    try {
      await this.prisma.$transaction(async (tx) => {
        await cuentaActiva(tx, req.sesion.cuentaId);
        await tx.$queryRaw`SELECT 1 AS bloqueado FROM pg_advisory_xact_lock(hashtextextended(${d.nit}, 0))`;
        if (
          await tx.nitReservado.findUnique({
            where: { huella: huellaNit(d.nit) },
          })
        )
          throw new ConflictException({
            errores: { nit: 'Ya existe una cuenta para este NIT.' },
          });
        await tx.empresa.update({
          where: { cuentaId: req.sesion.cuentaId },
          data: d,
        });
      });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002')
        throw new ConflictException({
          errores: { nit: 'Ya existe una cuenta para este NIT.' },
        });
      throw error;
    }
    return this.obtener(req);
  }
  @Put('logo')
  @UseInterceptors(
    FileInterceptor('archivo', {
      limits: { fileSize: 2 * 1024 * 1024, files: 1 },
    }),
  )
  async logo(@Req() req: RequestConSesion, @UploadedFile() a?: ArchivoSubido) {
    if (!a)
      throw new BadRequestException({
        mensaje: 'Elige un logo en JPG o PNG de máximo 2 MB.',
      });
    const formato = tipoPorContenido(a.buffer.subarray(0, 8));
    const error = errorArchivo('foto', { formato, bytes: a.size });
    if (error) throw new BadRequestException({ mensaje: error });
    const clave = `${randomUUID()}.${formato}`;
    await this.archivos.guardar(clave, a.buffer);
    try {
      await this.prisma.$transaction(async (tx) => {
        await cuentaActiva(tx, req.sesion.cuentaId);
        const anterior = await tx.empresa.findUniqueOrThrow({
          where: { cuentaId: req.sesion.cuentaId },
        });
        await tx.empresa.update({
          where: { cuentaId: req.sesion.cuentaId },
          data: {
            logoClave: clave,
            logoNombre: Buffer.from(a.originalname, 'latin1')
              .toString('utf8')
              .slice(0, 200),
            logoBytes: a.size,
          },
        });
        if (anterior.logoClave)
          await tx.archivoPorBorrar.create({
            data: { clave: anterior.logoClave },
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
    return this.obtener(req);
  }
  @Delete('logo')
  @HttpCode(204)
  async quitarLogo(@Req() req: RequestConSesion) {
    await this.prisma.$transaction(async (tx) => {
      await cuentaActiva(tx, req.sesion.cuentaId);
      const e = await tx.empresa.findUniqueOrThrow({
        where: { cuentaId: req.sesion.cuentaId },
      });
      await tx.empresa.update({
        where: { cuentaId: e.cuentaId },
        data: { logoClave: null, logoNombre: null, logoBytes: null },
      });
      if (e.logoClave)
        await tx.archivoPorBorrar.create({ data: { clave: e.logoClave } });
    });
    await this.limpieza.procesar();
  }
}
