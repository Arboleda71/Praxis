import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types.js';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configurarApp } from '../src/configurar.js';
import { Intentos } from '../src/auth/intentos.js';
import { PrismaService } from '../src/prisma.service.js';
import { validarBasePruebas } from './seguridad/base-pruebas.js';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { jest } from '@jest/globals';
import { Logger } from '@nestjs/common';

describe('003: integración de seguridad', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const origen = 'http://localhost:3000';
  const datos = {
    nombreCompleto: 'Persona Ficticia',
    correo: 'seguridad@example.test',
    contrasena: 'contrasena-segura',
    confirmarContrasena: 'contrasena-segura',
    autorizaDatos: true,
  };
  beforeAll(async () => {
    app = configurarApp(
      (
        await Test.createTestingModule({ imports: [AppModule] }).compile()
      ).createNestApplication(),
    );
    await app.init();
    prisma = app.get(PrismaService);
  });
  beforeEach(async () => {
    validarBasePruebas(process.env.DATABASE_URL);
    await prisma.$executeRawUnsafe('TRUNCATE "Cuenta" CASCADE');
    app.get(Intentos).limpiar();
  });
  afterAll(async () => {
    await app.close();
  });
  it('rechaza otro origen y la ausencia de Origin sin crear cuentas', async () => {
    for (const o of ['', 'https://externo.example']) {
      await request(app.getHttpServer())
        .post('/auth/registro/estudiante')
        .set('Origin', o)
        .send(datos)
        .expect(403);
    }
    expect(await prisma.cuenta.count()).toBe(0);
  });
  it('reserva los intentos: cincuenta solicitudes evalúan como máximo cinco', async () => {
    await request(app.getHttpServer())
      .post('/auth/registro/estudiante')
      .set('Origin', origen)
      .send(datos)
      .expect(201);
    const respuestas = await Promise.all(
      Array.from({ length: 50 }, (_, n) =>
        request(app.getHttpServer())
          .post('/auth/login')
          .set('Origin', origen)
          .set('X-Forwarded-For', `198.18.1.${n}`)
          .send({ correo: datos.correo, contrasena: 'incorrecta' }),
      ),
    );
    expect(respuestas.filter((r) => r.status === 401)).toHaveLength(5);
    expect(respuestas.filter((r) => r.status === 429)).toHaveLength(45);
  });
  it('cabeceras y cookies seguras sin revelar Express', async () => {
    const r = await request(app.getHttpServer())
      .post('/auth/registro/estudiante')
      .set('Origin', origen)
      .send(datos)
      .expect(201);
    expect(String(r.headers['set-cookie'])).toMatch(/; Secure/);
    expect(r.headers['x-powered-by']).toBeUndefined();
    expect(r.headers['x-content-type-options']).toBe('nosniff');
  });
  it('confirmaciones simultáneas son idempotentes y no cambian la sesión', async () => {
    await request(app.getHttpServer())
      .post('/auth/registro/estudiante')
      .set('Origin', origen)
      .send(datos)
      .expect(201);
    const id = createHash('sha256').update(datos.correo).digest('hex');
    const dir = process.env.CORREOS_DIR!;
    const archivo = readdirSync(dir)
      .filter((f) => f.includes(id))
      .sort()
      .at(-1)!;
    const token = readFileSync(join(dir, archivo), 'utf8').match(
      /token=([A-Za-z0-9_-]+)/,
    )![1];
    const estados = await Promise.all(
      [1, 2].map(() =>
        request(app.getHttpServer())
          .post('/auth/confirmar-correo')
          .set('Origin', origen)
          .send({ token })
          .then((r) => r.status),
      ),
    );
    expect(estados).toEqual([200, 200]);
    expect(
      await prisma.enlaceConfirmacion.count({
        where: { usadoEn: { not: null } },
      }),
    ).toBe(1);
  });
  it('sesiones vencidas no entran y se eliminan', async () => {
    const r = await request(app.getHttpServer())
      .post('/auth/registro/estudiante')
      .set('Origin', origen)
      .send(datos)
      .expect(201);
    const cookie = String(r.headers['set-cookie'][0]).split(';')[0];
    await prisma.sesion.updateMany({ data: { expiraEn: new Date(0) } });
    await request(app.getHttpServer())
      .get('/auth/sesion')
      .set('Cookie', cookie)
      .expect(401);
    expect(await prisma.sesion.count()).toBe(0);
  });
  it('dos reenvíos simultáneos crean un solo enlace nuevo', async () => {
    const r = await request(app.getHttpServer())
      .post('/auth/registro/estudiante')
      .set('Origin', origen)
      .send(datos)
      .expect(201);
    const cookie = String(r.headers['set-cookie'][0]).split(';')[0];
    await prisma.enlaceConfirmacion.updateMany({
      data: { creadoEn: new Date(Date.now() - 61_000) },
    });
    const estados = await Promise.all(
      [1, 2].map(() =>
        request(app.getHttpServer())
          .post('/auth/reenviar-confirmacion')
          .set('Origin', origen)
          .set('Cookie', cookie)
          .then((r) => r.status),
      ),
    );
    expect(estados.sort((a, b) => a - b)).toEqual([204, 429]);
    expect(await prisma.enlaceConfirmacion.count()).toBe(2);
    expect(
      await prisma.enlaceConfirmacion.count({ where: { usadoEn: null } }),
    ).toBe(1);
  });
  it('un fallo real de Postgres al crear el enlace revierte la cuenta y no filtra el error', async () => {
    validarBasePruebas(process.env.DATABASE_URL);
    const log = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});
    try {
      await prisma.$executeRawUnsafe(
        `CREATE OR REPLACE FUNCTION praxis_test_rechazar_enlace() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Fallo ficticio controlado'; END; $$`,
      );
      await prisma.$executeRawUnsafe(
        'CREATE TRIGGER praxis_test_rechazar_enlace BEFORE INSERT ON "EnlaceConfirmacion" FOR EACH ROW EXECUTE FUNCTION praxis_test_rechazar_enlace()',
      );
      const r = await request(app.getHttpServer())
        .post('/auth/registro/estudiante')
        .set('Origin', origen)
        .send(datos)
        .expect(500);
      expect(await prisma.cuenta.count()).toBe(0);
      expect(JSON.stringify(r.body)).not.toContain(datos.correo);
      expect(JSON.stringify(log.mock.calls)).not.toContain(datos.correo);
      expect(JSON.stringify(log.mock.calls)).not.toContain(datos.contrasena);
    } finally {
      await prisma.$executeRawUnsafe(
        'DROP TRIGGER IF EXISTS praxis_test_rechazar_enlace ON "EnlaceConfirmacion"',
      );
      await prisma.$executeRawUnsafe(
        'DROP FUNCTION IF EXISTS praxis_test_rechazar_enlace()',
      );
      log.mockRestore();
    }
  });
});
