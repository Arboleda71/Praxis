import {
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { Archivos, tipoDe } from './archivos.js';
import { PrismaService } from '../prisma.service.js';

/** Backend en disco: la firma del enlace es la autorización (sin cookie), válida 5 minutos. */
@Controller('archivos')
export class ArchivosController {
  constructor(
    private readonly archivos: Archivos,
    private readonly prisma: PrismaService,
  ) {}

  @Get(':clave')
  async servir(
    @Param('clave') clave: string,
    @Query('exp') exp: string,
    @Query('firma') firma: string,
    @Res() res: Response,
  ) {
    if (await this.prisma.archivoPorBorrar.findUnique({ where: { clave } }))
      throw new NotFoundException({
        mensaje: 'Este archivo ya no está disponible.',
      });
    const datos = await this.archivos.leerFirmado(
      clave,
      Number(exp),
      String(firma ?? ''),
    );
    if (datos === 'firma')
      throw new ForbiddenException({
        mensaje:
          'Este enlace venció o no es válido. Vuelve a abrirlo desde tu perfil.',
      });
    if (!datos)
      throw new NotFoundException({
        mensaje: 'Este archivo ya no está disponible.',
      });
    res
      .set({
        'Content-Type': tipoDe(clave),
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      })
      .send(datos);
  }
}
