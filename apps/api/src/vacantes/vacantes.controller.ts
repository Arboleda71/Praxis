import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { accionSchema, busquedaSchema, editarVacanteSchema, idSchema, vacanteSchema, type Busqueda, type VacanteDatos } from '@praxis/contracts';
import { SoloEmpresaGuard, SoloEstudianteGuard, type RequestConSesion } from '../auth/sesion.js';
import { ZodPipe } from '../auth/zod.pipe.js';
import { VacantesService } from './vacantes.service.js';

@Controller('empresa/vacantes')
@UseGuards(SoloEmpresaGuard)
export class VacantesEmpresaController {
  constructor(private readonly vacantes: VacantesService) {}
  @Get() lista(@Req() req: RequestConSesion, @Query(new ZodPipe(busquedaSchema)) b: Busqueda) { return this.vacantes.propias(req.sesion.cuentaId, b); }
  @Post() crear(@Req() req: RequestConSesion, @Body(new ZodPipe(vacanteSchema)) d: VacanteDatos) { return this.vacantes.crear(req.sesion.cuentaId, d); }
  @Get(':id') detalle(@Req() req: RequestConSesion, @Param('id', new ZodPipe(idSchema)) id: string) { return this.vacantes.propia(req.sesion.cuentaId, id); }
  @Put(':id') editar(@Req() req: RequestConSesion, @Param('id', new ZodPipe(idSchema)) id: string, @Body(new ZodPipe(editarVacanteSchema)) d: VacanteDatos | { descripcion: string }) { return this.vacantes.editar(req.sesion.cuentaId, id, d); }
  @Post(':id/publicar') publicar(@Req() req: RequestConSesion, @Param('id', new ZodPipe(idSchema)) id: string, @Body(new ZodPipe(accionSchema)) _d: object) { return this.vacantes.publicar(req.sesion.cuentaId, id); }
  @Post(':id/cerrar') cerrar(@Req() req: RequestConSesion, @Param('id', new ZodPipe(idSchema)) id: string, @Body(new ZodPipe(accionSchema)) _d: object) { return this.vacantes.cerrar(req.sesion.cuentaId, id); }
  @Delete(':id') @HttpCode(204) eliminar(@Req() req: RequestConSesion, @Param('id', new ZodPipe(idSchema)) id: string) { return this.vacantes.eliminar(req.sesion.cuentaId, id); }
}
@Controller('vacantes')
export class VacantesController {
  constructor(private readonly vacantes: VacantesService) {}
  @Get('recientes') recientes() { return this.vacantes.recientes(); }
  @Get() @UseGuards(SoloEstudianteGuard)
  buscar(@Query(new ZodPipe(busquedaSchema)) b: Busqueda) { return this.vacantes.buscar(b); }
  @Get(':id') @UseGuards(SoloEstudianteGuard)
  detalle(@Req() req: RequestConSesion, @Param('id', new ZodPipe(idSchema)) id: string) { return this.vacantes.detalle(id, req.sesion.cuentaId); }
  @Post(':id/postulaciones') @UseGuards(SoloEstudianteGuard)
  postular(@Req() req: RequestConSesion, @Param('id', new ZodPipe(idSchema)) id: string, @Body(new ZodPipe(accionSchema)) _d: object) { return this.vacantes.postular(id, req.sesion.cuentaId); }
}
