import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  busquedaSchema,
  compraSchema,
  eventoWompiSchema,
  type Busqueda,
  type EventoWompi,
  type Plan,
} from '@praxis/contracts';
import { SoloEmpresaGuard, type RequestConSesion } from '../auth/sesion.js';
import { ZodPipe } from '../auth/zod.pipe.js';
import { PrismaService } from '../prisma.service.js';
import { PagosService } from './pagos.service.js';
@Controller('empresa')
@UseGuards(SoloEmpresaGuard)
export class PagosEmpresaController {
  constructor(
    private readonly pagos: PagosService,
    private readonly prisma: PrismaService,
  ) {}
  @Get('planes') planes(@Req() req: RequestConSesion) {
    return this.pagos.planes(req.sesion.cuentaId);
  }
  @Post('pagos') crear(
    @Req() req: RequestConSesion,
    @Body(new ZodPipe(compraSchema)) d: { plan: Plan },
  ) {
    return this.pagos.crear(req.sesion.cuentaId, d.plan);
  }
  @Get('pagos') async lista(
    @Req() req: RequestConSesion,
    @Query(new ZodPipe(busquedaSchema)) b: Busqueda,
  ) {
    const where = { empresaId: req.sesion.cuentaId };
    const [items, total] = await Promise.all([
      this.prisma.pago.findMany({
        where,
        orderBy: [{ creadaEn: 'desc' }, { id: 'desc' }],
        skip: (b.pagina - 1) * 20,
        take: 20,
      }),
      this.prisma.pago.count({ where }),
    ]);
    return { items, total, pagina: b.pagina };
  }
}
@Controller('pagos')
export class EventosWompiController {
  constructor(private readonly pagos: PagosService) {}
  @Post('eventos')
  @HttpCode(200)
  evento(@Body(new ZodPipe(eventoWompiSchema)) e: EventoWompi) {
    return this.pagos.evento(e);
  }
}
