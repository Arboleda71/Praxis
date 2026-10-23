/** Entrada exclusiva de Playwright. No se compila ni se importa desde main.ts. */
import { NestFactory } from '@nestjs/core';
import type { Request, Response } from 'express';
import { AppModule } from '../dist/app.module.js';
import { configurarApp } from '../dist/configurar.js';
import { Intentos } from '../dist/auth/intentos.js';

const moduloGuarda = './seguridad/base-pruebas.ts';
const { validarBasePruebas } = await import(moduloGuarda);
validarBasePruebas(process.env.DATABASE_URL);
if (process.env.NODE_ENV !== 'test' || !process.env.PRAXIS_TEST_CONTROL_SECRET) throw new Error('Entrada exclusiva de pruebas aisladas.');
const app = configurarApp(await NestFactory.create(AppModule, { logger: false }));
app.getHttpAdapter().post('/__pruebas/reiniciar', (req: Request, res: Response) => {
  if (req.get('x-praxis-test') !== process.env.PRAXIS_TEST_CONTROL_SECRET) { res.sendStatus(403); return; }
  app.get(Intentos).limpiar();
  res.sendStatus(204);
});
await app.listen(Number(process.env.PORT ?? 3101), '127.0.0.1');
