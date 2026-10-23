import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  loginSchema,
  registroEmpresaSchema,
  registroEstudianteSchema,
  tokenSchema,
  type Login,
  type RegistroEmpresa,
  type RegistroEstudiante,
} from '@praxis/contracts';
import type { Request, Response } from 'express';
import { AuthService, publica } from './auth.service.js';
import {
  COOKIE,
  opcionesCookie,
  SESION_MS,
  SesionGuard,
  type RequestConSesion,
} from './sesion.js';
import { ZodPipe } from './zod.pipe.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('registro/estudiante')
  async registroEstudiante(
    @Body(new ZodPipe(registroEstudianteSchema)) datos: RegistroEstudiante,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.conCookie(
      res,
      await this.auth.registrarEstudiante(datos, req.ip ?? ''),
    );
  }

  @Post('registro/empresa')
  async registroEmpresa(
    @Body(new ZodPipe(registroEmpresaSchema)) datos: RegistroEmpresa,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.conCookie(
      res,
      await this.auth.registrarEmpresa(datos, req.ip ?? ''),
    );
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body(new ZodPipe(loginSchema)) datos: Login,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.conCookie(res, await this.auth.login(datos, req.ip ?? ''));
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.cerrarSesion(req.cookies?.[COOKIE]);
    res.clearCookie(COOKIE, opcionesCookie());
  }

  @Get('sesion')
  @UseGuards(SesionGuard)
  sesion(@Req() req: RequestConSesion) {
    return publica(req.sesion.cuenta);
  }

  @Post('confirmar-correo')
  @HttpCode(200)
  confirmar(@Body(new ZodPipe(tokenSchema)) { token }: { token: string }) {
    return this.auth.confirmarCorreo(token);
  }
  @Get('confirmar-correo')
  estadoEnlace(@Query(new ZodPipe(tokenSchema)) { token }: { token: string }) {
    return this.auth.estadoEnlace(token);
  }

  @Post('reenviar-confirmacion')
  @HttpCode(204)
  @UseGuards(SesionGuard)
  async reenviar(@Req() req: RequestConSesion) {
    await this.auth.reenviarConfirmacion(req.sesion.cuenta);
  }

  private conCookie(
    res: Response,
    { token, sesion }: { token: string; sesion: unknown },
  ) {
    res.cookie(COOKIE, token, { ...opcionesCookie(), maxAge: SESION_MS });
    return { sesion };
  }
}
