import {
  ArgumentsHost,
  BadRequestException,
  Body,
  Catch,
  Controller,
  Delete,
  ExceptionFilter,
  Get,
  NotFoundException,
  Param,
  PayloadTooLargeException,
  Put,
  Req,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  LIMITES_ARCHIVO,
  TIPOS_ARCHIVO,
  avalSchema,
  disponibilidadSchema,
  formacionSchema,
  type Disponibilidad,
  type Formacion,
  type TipoArchivo,
} from '@praxis/contracts';
import type { Request, Response } from 'express';
import { SoloEstudianteGuard, type RequestConSesion } from '../auth/sesion.js';
import { ZodPipe } from '../auth/zod.pipe.js';
import { PerfilService, type ArchivoSubido } from './perfil.service.js';

const MB = 1024 * 1024;
/** Tope de lectura. El límite real por tipo (5 o 2 MB) lo aplica el servicio, que así puede decir cuánto pesa. */
const MAX_SUBIDA = 10 * MB;

/** Más allá del tope, multer corta la lectura y no se sabe el tamaño exacto. */
@Catch(PayloadTooLargeException)
class ArchivoGrandeFilter implements ExceptionFilter {
  catch(_: PayloadTooLargeException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const max = LIMITES_ARCHIVO[ctx.getRequest<Request>().params.tipo as TipoArchivo]?.maxBytes ?? 5 * MB;
    ctx
      .getResponse<Response>()
      .status(413)
      .json({ errores: { archivo: `Pesa más de ${MAX_SUBIDA / MB} MB y el máximo es ${max / MB} MB.` } });
  }
}

function tipoValido(tipo: string): TipoArchivo {
  if (!(TIPOS_ARCHIVO as string[]).includes(tipo)) throw new NotFoundException({ mensaje: 'Ese tipo de archivo no existe.' });
  return tipo as TipoArchivo;
}

@Controller('perfil')
@UseGuards(SoloEstudianteGuard)
export class PerfilController {
  constructor(private readonly perfil: PerfilService) {}

  @Get()
  obtener(@Req() req: RequestConSesion) {
    return this.perfil.obtener(req.sesion.cuentaId);
  }

  @Put('formacion')
  formacion(@Req() req: RequestConSesion, @Body(new ZodPipe(formacionSchema)) d: Formacion) {
    return this.perfil.guardarFormacion(req.sesion.cuentaId, d);
  }

  @Put('disponibilidad')
  disponibilidad(@Req() req: RequestConSesion, @Body(new ZodPipe(disponibilidadSchema)) d: Disponibilidad) {
    return this.perfil.guardarDisponibilidad(req.sesion.cuentaId, d);
  }

  @Put('aval')
  aval(@Req() req: RequestConSesion, @Body(new ZodPipe(avalSchema)) { aval }: { aval: boolean | null }) {
    return this.perfil.guardarAval(req.sesion.cuentaId, aval);
  }

  @Put('archivos/:tipo')
  @UseFilters(ArchivoGrandeFilter)
  @UseInterceptors(FileInterceptor('archivo', { limits: { fileSize: MAX_SUBIDA, files: 1 } }))
  subir(@Req() req: RequestConSesion, @Param('tipo') tipo: string, @UploadedFile() archivo?: ArchivoSubido) {
    const t = tipoValido(tipo);
    if (!archivo) throw new BadRequestException({ errores: { archivo: 'Elige un archivo.' } });
    return this.perfil.subir(req.sesion.cuentaId, t, archivo);
  }

  @Delete('archivos/:tipo')
  quitar(@Req() req: RequestConSesion, @Param('tipo') tipo: string) {
    return this.perfil.quitar(req.sesion.cuentaId, tipoValido(tipo));
  }

  @Get('archivos/:tipo/enlace')
  enlace(@Req() req: RequestConSesion, @Param('tipo') tipo: string) {
    return this.perfil.enlace(req.sesion.cuentaId, tipoValido(tipo));
  }
}
