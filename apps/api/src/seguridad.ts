import { Catch, HttpException, Logger, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
/** Solo la configuración; nunca incluye valores secretos en el error. */
export function validarConfiguracion(env: NodeJS.ProcessEnv = process.env) {
  if (env.NODE_ENV !== 'production') return;
  for (const key of ['DATABASE_URL', 'WEB_URL', 'RESEND_API_KEY', 'CORREO_REMITENTE', 'S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY']) {
    if (!env[key]) throw new Error(`Falta ${key} en producción.`);
  }
  if (new URL(env.WEB_URL!).protocol !== 'https:') throw new Error('WEB_URL debe usar HTTPS en producción.');
  if (env.CORREOS_DIR) throw new Error('CORREOS_DIR no está permitido en producción.');
}

@Catch()
export class ErroresSeguros implements ExceptionFilter {
  private readonly log = new Logger('API');
  catch(error: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    if (error instanceof HttpException) {
      res.status(error.getStatus()).json(error.getResponse());
    } else {
      this.log.error('No se pudo completar una operación.');
      res.status(500).json({ mensaje: 'No pudimos completar la operación. Inténtalo de nuevo.' });
    }
  }
}
