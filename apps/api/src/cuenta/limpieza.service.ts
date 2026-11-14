import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { Archivos } from '../perfil/archivos.js';

@Injectable()
export class LimpiezaService implements OnModuleInit, OnModuleDestroy {
  private reloj?: ReturnType<typeof setInterval>;
  private readonly log = new Logger(LimpiezaService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly archivos: Archivos,
  ) {}
  async onModuleInit() {
    await this.procesar();
    this.reloj = setInterval(() => {
      void this.procesar().catch(() =>
        this.log.error('No se pudo completar la limpieza de archivos.'),
      );
    }, 60000);
    this.reloj.unref();
  }
  onModuleDestroy() {
    clearInterval(this.reloj);
  }
  async procesar() {
    const pendientes = await this.prisma.archivoPorBorrar.findMany({
      take: 100,
      orderBy: { creadoEn: 'asc' },
    });
    for (const a of pendientes) {
      try {
        await this.archivos.borrar(a.clave);
        await this.prisma.archivoPorBorrar.deleteMany({
          where: { clave: a.clave },
        });
      } catch {
        this.log.warn(
          'El almacenamiento no confirmó un borrado; se reintentará.',
        );
      }
    }
  }
}
