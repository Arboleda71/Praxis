import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  accionSchema,
  busquedaSchema,
  idSchema,
  type Busqueda,
} from '@praxis/contracts';
import { SesionGuard, type RequestConSesion } from '../auth/sesion.js';
import { ZodPipe } from '../auth/zod.pipe.js';
import { PrismaService } from '../prisma.service.js';
@Controller('notificaciones')
@UseGuards(SesionGuard)
export class NotificacionesController {
  constructor(private readonly prisma: PrismaService) {}
  @Get() async lista(
    @Req() req: RequestConSesion,
    @Query(new ZodPipe(busquedaSchema)) b: Busqueda,
  ) {
    const where = { cuentaId: req.sesion.cuentaId };
    const [items, total, sinLeer] = await Promise.all([
      this.prisma.notificacion.findMany({
        where,
        skip: (b.pagina - 1) * 20,
        take: 20,
        orderBy: [{ creadaEn: 'desc' }, { id: 'desc' }],
      }),
      this.prisma.notificacion.count({ where }),
      this.prisma.notificacion.count({ where: { ...where, leidaEn: null } }),
    ]);
    return { items, total, sinLeer, pagina: b.pagina };
  }
  @Post(':id/leer')
  @HttpCode(204)
  async leer(
    @Req() req: RequestConSesion,
    @Param('id', new ZodPipe(idSchema)) id: string,
    @Body(new ZodPipe(accionSchema)) _d: object,
  ) {
    const n = await this.prisma.notificacion.updateMany({
      where: { id, cuentaId: req.sesion.cuentaId },
      data: { leidaEn: new Date() },
    });
    if (!n.count) throw new NotFoundException();
  }
}
