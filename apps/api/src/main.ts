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
}
await bootstrap();
