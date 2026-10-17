import { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';

/** Configuración común a la app real y a las pruebas de integración. */
export function configurarApp<T extends INestApplication>(app: T): T {
  app.use(cookieParser());
  // La web reenvía las peticiones (rewrite de Next); la IP real llega en X-Forwarded-For.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  return app;
}
