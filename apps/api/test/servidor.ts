/** Entrada exclusiva de Playwright. No se compila ni se importa desde main.ts. */
import { NestFactory } from '@nestjs/core';
import type { Request, Response } from 'express';
import { AppModule } from '../dist/app.module.js';
import { configurarApp } from '../dist/configurar.js';
import { Intentos } from '../dist/auth/intentos.js';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { hash } from '@node-rs/argon2';
import { z } from 'zod';
import { PrismaService } from '../dist/prisma.service.js';
import express from 'express';

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
// Estas rutas de fixtures se registran antes de que Nest instale su parser.
app.use(express.json({ limit: '100kb' }));

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

// Fixtures exclusivas del servidor de pruebas: jamás se importan desde main.ts.
app
  .getHttpAdapter()
  .post('/__pruebas/admin', async (req: Request, res: Response) => {
    if (req.get('x-praxis-test') !== process.env.PRAXIS_TEST_CONTROL_SECRET) {
      res.sendStatus(403);
      return;
    }
    const db = app.get(PrismaService);
    await db.cuenta.upsert({
      where: { correo: 'admin@praxis.example.test' },
      create: {
        correo: 'admin@praxis.example.test',
        contrasenaHash: await hash('contrasena-segura'),
        rol: 'ADMIN',
        autorizacionDatosEn: new Date(),
        correoConfirmadoEn: new Date(),
      },
      update: {},
    });
    res.sendStatus(204);
  });
app
  .getHttpAdapter()
  .post('/__pruebas/plan', async (req: Request, res: Response) => {
    if (req.get('x-praxis-test') !== process.env.PRAXIS_TEST_CONTROL_SECRET) {
      res.sendStatus(403);
      return;
    }
    const d = z
      .strictObject({
        correo: z.email(),
        dias: z.number().int().min(-1).max(8),
      })
      .safeParse(req.body);
    if (!d.success) {
      res.sendStatus(400);
      return;
    }
    const db = app.get(PrismaService);
    const c = await db.cuenta.findUniqueOrThrow({
      where: { correo: d.data.correo },
    });
    await db.empresa.update({
      where: { cuentaId: c.id },
      data: {
        plan: 'basico',
        planInicioEn: new Date(Date.now() - 160 * 86400000),
        planVenceEn: new Date(Date.now() + d.data.dias * 86400000),
      },
    });
    res.sendStatus(204);
  });
await app.listen(Number(process.env.PORT ?? 3101), '127.0.0.1');
