import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configurarApp } from './configurar.js';

// Node 24 carga .env sin dependencias; en producción las variables vienen del entorno.
try {
  process.loadEnvFile();
} catch {
  // Sin .env.
}

async function bootstrap() {
  const app = configurarApp(await NestFactory.create(AppModule));
  await app.listen(process.env.PORT ?? 3001);
  // La web reenvía las peticiones y reutiliza la conexión. Si la API la cierra primero (5 s por
  // omisión en Node), el POST se cae con ECONNRESET y el navegador ve un error de red.
  const servidor = app.getHttpServer();
  servidor.keepAliveTimeout = 65_000;
  servidor.headersTimeout = 66_000;
}
await bootstrap();
