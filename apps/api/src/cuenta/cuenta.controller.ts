import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  accesoCuentaSchema,
  cuentasAdminSchema,
  idSchema,
  suprimirCuentaSchema,
  type BusquedaCuentas,
  type CambioAcceso,
  type Supresion,
} from '@praxis/contracts';
import {
  COOKIE,
  opcionesCookie,
  SesionGuard,
  SoloAdminGuard,
  type RequestConSesion,
} from '../auth/sesion.js';
import { ZodPipe } from '../auth/zod.pipe.js';
import { Intentos } from '../auth/intentos.js';
import { CuentaService } from './cuenta.service.js';

@Controller('cuenta')
@UseGuards(SesionGuard)
export class CuentaController {
  constructor(
    private readonly cuentas: CuentaService,
    private readonly intentos: Intentos,
  ) {}
  @Post('supresion')
  @HttpCode(200)
  async suprimir(
    @Req() req: RequestConSesion,
    @Body(new ZodPipe(suprimirCuentaSchema)) d: Supresion,
    @Res({ passthrough: true }) res: Response,
  ) {
    const segundos = await this.intentos.reservar(
      `supresion:${req.sesion.cuentaId}`,
    );
    if (segundos)
      throw new HttpException(
        { mensaje: 'Demasiados intentos. Inténtalo más tarde.', segundos },
        429,
      );
    const r = await this.cuentas.suprimir(req.sesion.cuentaId, d);
    res.clearCookie(COOKIE, opcionesCookie());
    return r;
  }
}
@Controller('admin/cuentas')
@UseGuards(SoloAdminGuard)
export class AdminController {
  constructor(private readonly cuentas: CuentaService) {}
  @Get() lista(@Query(new ZodPipe(cuentasAdminSchema)) b: BusquedaCuentas) {
    return this.cuentas.cuentas(b);
  }
  @Get(':id') detalle(@Param('id', new ZodPipe(idSchema)) id: string) {
    return this.cuentas.detalle(id);
  }
  @Post(':id/acceso')
  @HttpCode(200)
  acceso(
    @Req() req: RequestConSesion,
    @Param('id', new ZodPipe(idSchema)) id: string,
    @Body(new ZodPipe(accesoCuentaSchema)) d: CambioAcceso,
  ) {
    return this.cuentas.acceso(req.sesion.cuentaId, id, d);
  }
}
