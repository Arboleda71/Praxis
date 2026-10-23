import {
  Body,
  ConflictException,
  Controller,
  Get,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { empresaSchema, leerNit, type FichaEmpresa } from '@praxis/contracts';
import { SoloEmpresaGuard, type RequestConSesion } from '../auth/sesion.js';
import { ZodPipe } from '../auth/zod.pipe.js';
import { PrismaService } from '../prisma.service.js';

@Controller('empresa')
@UseGuards(SoloEmpresaGuard)
export class EmpresaController {
  constructor(private readonly prisma: PrismaService) {}
  @Get('perfil')
  async obtener(@Req() req: RequestConSesion) {
    const ficha = await this.prisma.empresa.findUniqueOrThrow({
      where: { cuentaId: req.sesion.cuentaId },
    });
    const nitValido = leerNit(`${ficha.nit}-${ficha.dv}`).ok;
    return {
      ...ficha,
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
      await this.prisma.empresa.update({
        where: { cuentaId: req.sesion.cuentaId },
        data: d,
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
}
