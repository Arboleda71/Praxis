import { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import type { Request, Response, NextFunction } from 'express';
import { validarConfiguracion, ErroresSeguros } from './seguridad.js';

/** Configuración común a la app real y a las pruebas de integración. */
export function configurarApp<T extends INestApplication>(app: T): T {
  validarConfiguracion();
  app.useGlobalFilters(new ErroresSeguros());
  app.use(cookieParser());
  // La web reenvía las peticiones (rewrite de Next); la IP real llega en X-Forwarded-For.
  app.getHttpAdapter().getInstance().set('trust proxy', false);
  app.getHttpAdapter().getInstance().disable('x-powered-by');
  const origen = new URL(process.env.WEB_URL || 'http://localhost:3000').origin;
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; frame-ancestors 'none'",
    );
    res.setHeader('Cache-Control', 'no-store');
    if (process.env.NODE_ENV === 'production')
      res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    if (
      !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
      req.path !== '/pagos/eventos' &&
      req.get('origin') !== origen
    ) {
      res
        .status(403)
        .json({
          mensaje: 'Realiza esta acción desde las pantallas de Praxis.',
        });
      return;
    }
    next();
  });
  return app;
}
