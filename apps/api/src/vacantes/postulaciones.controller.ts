import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { ArchivoSubido } from '../perfil/perfil.service.js';
import { CvService } from './cv.service.js';
import {
  accionSchema,
  busquedaSchema,
  cambioEstadoSchema,
  idSchema,
  tipoArchivoSchema,
  type Busqueda,
  type TipoArchivo,
  TAMANO_PAGINA,
} from '@praxis/contracts';
import {
  SoloEmpresaGuard,
  SoloEstudianteGuard,
  type RequestConSesion,
} from '../auth/sesion.js';
import { ZodPipe } from '../auth/zod.pipe.js';
import { PrismaService } from '../prisma.service.js';
import { Archivos } from '../perfil/archivos.js';
import { SeguimientoService } from './seguimiento.service.js';

@Controller('postulaciones')
@UseGuards(SoloEstudianteGuard)
export class PostulacionesEstudianteController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly seguimiento: SeguimientoService,
    private readonly archivos: Archivos,
    private readonly cv: CvService,
  ) {}
  @Put(':id/cv')
  @UseInterceptors(
    FileInterceptor('archivo', {
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    }),
  )
  reemplazar(
    @Req() req: RequestConSesion,
    @Param('id', new ZodPipe(idSchema)) id: string,
    @UploadedFile() a?: ArchivoSubido,
  ) {
    return this.cv.reemplazar(req.sesion.cuentaId, id, a);
  }
  @Get(':id')
  async detalle(
    @Req() req: RequestConSesion,
    @Param('id', new ZodPipe(idSchema)) id: string,
  ) {
    const p = await this.prisma.postulacion.findFirst({
      where: { id, estudianteId: req.sesion.cuentaId },
      select: {
        id: true,
        estado: true,
        cvReemplazadoEn: true,
        archivos: { select: { tipo: true, nombre: true, bytes: true } },
        vacante: {
          select: { titulo: true, empresa: { select: { razonSocial: true } } },
        },
      },
    });
    if (!p) throw new NotFoundException();
    return p;
  }
  @Post(':id/retirar')
  @HttpCode(200)
  retirar(
    @Req() req: RequestConSesion,
    @Param('id', new ZodPipe(idSchema)) id: string,
    @Body(new ZodPipe(accionSchema)) _d: object,
  ) {
    return this.seguimiento.cambiar(
      req.sesion.cuentaId,
      'ESTUDIANTE',
      id,
      'Retirada',
    );
  }
  @Get(':id/archivos/:tipo')
  async enlace(
    @Req() req: RequestConSesion,
    @Param('id', new ZodPipe(idSchema)) id: string,
    @Param('tipo', new ZodPipe(tipoArchivoSchema)) tipo: TipoArchivo,
  ) {
    const tipoDb = {
      'hoja-de-vida': 'HOJA_DE_VIDA',
      'soporte-aval': 'SOPORTE_AVAL',
      foto: 'FOTO',
    }[tipo];
    const a = await this.prisma.archivoPostulacion.findFirst({
      where: {
        postulacionId: id,
        tipo: tipoDb,
        postulacion: { estudianteId: req.sesion.cuentaId },
      },
    });
    if (!a) throw new NotFoundException();
    return this.archivos.enlace(a.clave);
  }
  @Get() async lista(
    @Req() req: RequestConSesion,
    @Query(new ZodPipe(busquedaSchema)) b: Busqueda,
  ) {
    const where = { estudianteId: req.sesion.cuentaId };
    const [items, total] = await Promise.all([
      this.prisma.postulacion.findMany({
        where,
        orderBy: [{ creadaEn: 'desc' }, { id: 'desc' }],
        skip: (b.pagina - 1) * TAMANO_PAGINA,
        take: TAMANO_PAGINA,
        include: {
          vacante: {
            select: {
              titulo: true,
              empresa: { select: { razonSocial: true } },
            },
          },
          historial: { orderBy: [{ fecha: 'asc' }, { id: 'asc' }] },
          archivos: { select: { tipo: true, nombre: true, bytes: true } },
        },
      }),
      this.prisma.postulacion.count({ where }),
    ]);
    return { items, total, pagina: b.pagina };
  }
}
@Controller('empresa')
@UseGuards(SoloEmpresaGuard)
export class CandidatosController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly archivos: Archivos,
    private readonly seguimiento: SeguimientoService,
  ) {}
  @Post('postulaciones/:id/revisar')
  @HttpCode(200)
  async revisar(
    @Req() req: RequestConSesion,
    @Param('id', new ZodPipe(idSchema)) id: string,
    @Body(new ZodPipe(accionSchema)) _d: object,
  ) {
    await this.seguimiento.revisar(req.sesion.cuentaId, id);
    return this.detalle(req, id);
  }
  @Post('postulaciones/:id/estado')
  @HttpCode(200)
  cambiar(
    @Req() req: RequestConSesion,
    @Param('id', new ZodPipe(idSchema)) id: string,
    @Body(new ZodPipe(cambioEstadoSchema)) d: { estado: string },
  ) {
    return this.seguimiento.cambiar(
      req.sesion.cuentaId,
      'EMPRESA',
      id,
      d.estado,
    );
  }
  @Get('vacantes/:id/postulaciones')
  async lista(
    @Req() req: RequestConSesion,
    @Param('id', new ZodPipe(idSchema)) id: string,
    @Query(new ZodPipe(busquedaSchema)) b: Busqueda,
  ) {
    if (
      !(await this.prisma.vacante.findFirst({
        where: { id, empresaId: req.sesion.cuentaId },
      }))
    )
      throw new NotFoundException();
    const where = { vacanteId: id };
    const [items, total] = await Promise.all([
      this.prisma.postulacion.findMany({
        where,
        skip: (b.pagina - 1) * TAMANO_PAGINA,
        take: TAMANO_PAGINA,
        orderBy: [{ creadaEn: 'asc' }, { id: 'asc' }],
        select: { id: true, estado: true, creadaEn: true },
      }),
      this.prisma.postulacion.count({ where }),
    ]);
    return { items, total, pagina: b.pagina };
  }
  @Get('postulaciones/:id')
  async detalle(
    @Req() req: RequestConSesion,
    @Param('id', new ZodPipe(idSchema)) id: string,
  ) {
    const p = await this.prisma.postulacion.findFirst({
      where: { id, vacante: { empresaId: req.sesion.cuentaId } },
      include: {
        historial: { orderBy: [{ fecha: 'asc' }, { id: 'asc' }] },
        archivos: { select: { tipo: true, nombre: true, bytes: true } },
      },
    });
    if (!p) throw new NotFoundException();
    return p;
  }
  @Get('postulaciones/:id/archivos/:tipo')
  async enlace(
    @Req() req: RequestConSesion,
    @Param('id', new ZodPipe(idSchema)) id: string,
    @Param('tipo', new ZodPipe(tipoArchivoSchema)) tipo: TipoArchivo,
  ) {
    const tipoDb = {
      'hoja-de-vida': 'HOJA_DE_VIDA',
      'soporte-aval': 'SOPORTE_AVAL',
      foto: 'FOTO',
    }[tipo];
    const a = await this.prisma.archivoPostulacion.findFirst({
      where: {
        postulacionId: id,
        tipo: tipoDb,
        postulacion: { vacante: { empresaId: req.sesion.cuentaId } },
      },
    });
    if (!a) throw new NotFoundException();
    return this.archivos.enlace(a.clave);
  }
}
