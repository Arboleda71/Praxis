/** Entrada exclusiva de Playwright. No se compila ni se importa desde main.ts. */
import { NestFactory } from '@nestjs/core';
import type { Request, Response } from 'express';
import { AppModule } from '../dist/app.module.js';
import { configurarApp } from '../dist/configurar.js';
import { Intentos } from '../dist/auth/intentos.js';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const moduloGuarda = './seguridad/base-pruebas.ts';
const { validarBasePruebas } = await import(moduloGuarda);

validarBasePruebas(process.env.DATABASE_URL, 'praxis_e2e');

if (
  process.env.NODE_ENV !== 'test' ||
  !process.env.PRAXIS_TEST_CONTROL_SECRET
) {
  throw new Error('Entrada exclusiva de pruebas aisladas.');
}

// Los servicios consultan la base al iniciar: prepararla antes de app.listen,
// porque Playwright ejecuta globalSetup después de arrancar sus servidores.
const moduloLibre = './seguridad/base-libre.ts';
await (
  await import(moduloLibre)
).prepararBase(process.env.DATABASE_URL!, false);
execFileSync(
  process.execPath,
  [
    createRequire(import.meta.url).resolve('prisma/build/index.js'),
    'migrate',
    'deploy',
  ],
  {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    stdio: 'inherit',
  },
);

const app = configurarApp(
  await NestFactory.create(AppModule, { logger: false }),
);

app
  .getHttpAdapter()
  .post('/__pruebas/reiniciar', async (req: Request, res: Response) => {
    if (req.get('x-praxis-test') !== process.env.PRAXIS_TEST_CONTROL_SECRET) {
      res.sendStatus(403);
      return;
    }

    try {
      await app.get(Intentos).limpiar();
      res.sendStatus(204);
    } catch {
      res.sendStatus(500);
    }
  });

await app.listen(Number(process.env.PORT ?? 3101), '127.0.0.1');
