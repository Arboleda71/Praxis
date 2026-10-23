import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types.js';
import { createHash } from 'node:crypto';
import request from './cliente.js';
import { AppModule } from '../src/app.module.js';
import { configurarApp } from '../src/configurar.js';
import { Intentos } from '../src/auth/intentos.js';
import { PrismaService } from '../src/prisma.service.js';
import { WompiClient } from '../src/pagos/wompi.js';
import { validarBasePruebas } from './seguridad/base-pruebas.js';

describe('Planes: Postgres real, Wompi externo sustituido por fixture', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let empresa: ReturnType<typeof request.agent>;
  let transaccion = {
    id: 'sandbox-123',
    status: 'APPROVED',
    amount_in_cents: 2990000,
    currency: 'COP',
    reference: '',
  };
  const claves = [
    'WOMPI_ENV',
    'WOMPI_PUBLIC_KEY',
    'WOMPI_INTEGRITY_SECRET',
    'WOMPI_EVENTS_SECRET',
  ] as const;
  const anteriores = Object.fromEntries(claves.map((k) => [k, process.env[k]]));
  beforeAll(async () => {
    process.env.WOMPI_ENV = 'sandbox';
    process.env.WOMPI_PUBLIC_KEY = 'pub_test_ficticia';
    process.env.WOMPI_INTEGRITY_SECRET = 'test_integrity_ficticio';
    process.env.WOMPI_EVENTS_SECRET = 'test_events_ficticio';
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(WompiClient)
      .useValue({ consultar: () => Promise.resolve(transaccion) })
      .compile();
    app = configurarApp(modulo.createNestApplication());
    await app.init();
    prisma = app.get(PrismaService);
  });
  beforeEach(async () => {
    validarBasePruebas(process.env.DATABASE_URL);
    await prisma.$executeRawUnsafe('TRUNCATE "Cuenta" CASCADE');
    app.get(Intentos).limpiar();
    empresa = request.agent(app.getHttpServer());
    await empresa
      .post('/auth/registro/empresa')
      .send({
        razonSocial: 'Empresa Ficticia',
        nit: '900123456-8',
        correo: 'pagos@example.test',
        contrasena: 'contrasena-segura',
        confirmarContrasena: 'contrasena-segura',
        autorizaDatos: true,
      })
      .expect(201);
    transaccion = {
      id: 'sandbox-123',
      status: 'APPROVED',
      amount_in_cents: 2990000,
      currency: 'COP',
      reference: '',
    };
  });
  afterAll(async () => {
    await app.close();
    for (const k of claves) {
      if (anteriores[k] === undefined) delete process.env[k];
      else process.env[k] = anteriores[k];
    }
  });
  function evento() {
    return {
      event: 'transaction.updated',
      environment: 'test',
      timestamp: 1234,
      data: { transaction: transaccion },
      signature: {
        properties: [
          'transaction.id',
          'transaction.status',
          'transaction.amount_in_cents',
        ],
        checksum: createHash('sha256')
          .update(
            `${transaccion.id}${transaccion.status}${transaccion.amount_in_cents}1234test_events_ficticio`,
          )
          .digest('hex'),
      },
    };
  }
  it('importe fijado por el servidor y modo sandbox obligatorio', async () => {
    await empresa
      .post('/empresa/pagos')
      .send({ plan: 'basico', monto: 1 })
      .expect(400);
    const p = await empresa
      .post('/empresa/pagos')
      .send({ plan: 'basico' })
      .expect(201);
    expect(new URL(p.body.url).searchParams.get('amount-in-cents')).toBe(
      '2990000',
    );
    process.env.WOMPI_PUBLIC_KEY = 'pub_prod_ficticia';
    await empresa.post('/empresa/pagos').send({ plan: 'basico' }).expect(503);
    process.env.WOMPI_PUBLIC_KEY = 'pub_test_ficticia';
  });
  it('rechaza firma e importe alterados, activa una vez y no extiende con reenvíos', async () => {
    const p = await empresa
      .post('/empresa/pagos')
      .send({ plan: 'basico' })
      .expect(201);
    transaccion.reference = p.body.pagoId;
    await request(app.getHttpServer())
      .post('/pagos/eventos')
      .send({
        ...evento(),
        signature: { ...evento().signature, checksum: '0'.repeat(64) },
      })
      .expect(401);
    transaccion.amount_in_cents = 1;
    await request(app.getHttpServer())
      .post('/pagos/eventos')
      .send(evento())
      .expect(400);
    expect((await prisma.empresa.findFirstOrThrow()).plan).toBeNull();
    transaccion.amount_in_cents = 2990000;
    await request(app.getHttpServer())
      .post('/pagos/eventos')
      .send(evento())
      .expect(200);
    const primera = await prisma.empresa.findFirstOrThrow();
    await request(app.getHttpServer())
      .post('/pagos/eventos')
      .send(evento())
      .expect(200);
    const segunda = await prisma.empresa.findFirstOrThrow();
    expect(segunda.plan).toBe('basico');
    expect(segunda.planVenceEn).toEqual(primera.planVenceEn);
    expect(await prisma.pago.count({ where: { estado: 'Aprobado' } })).toBe(1);
  });
  it('Básico habilita exactamente cuatro publicaciones adicionales', async () => {
    const p = await empresa
      .post('/empresa/pagos')
      .send({ plan: 'basico' })
      .expect(201);
    transaccion.reference = p.body.pagoId;
    await request(app.getHttpServer())
      .post('/pagos/eventos')
      .send(evento())
      .expect(200);
    await prisma.cuenta.updateMany({
      data: { correoConfirmadoEn: new Date() },
    });
    const dia = (n: number) =>
      new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
    const datos = {
      titulo: 'Práctica académica ficticia',
      descripcion: 'Oferta académica ficticia para prueba de cupos',
      modalidad: 'remota',
      ciudad: null,
      duracionMeses: 6,
      fechaInicio: dia(60),
      vigencia: dia(30),
      niveles: ['tecnologo'],
      programas: [],
      avances: [],
      aval: false,
      jornada: 'tiempo-completo',
      idiomas: [],
    };
    for (let n = 0; n < 7; n++) {
      const v = await empresa.post('/empresa/vacantes').send(datos).expect(201);
      await empresa
        .post(`/empresa/vacantes/${v.body.id}/publicar`)
        .expect(n < 6 ? 201 : 409);
    }
    expect(await prisma.vacante.count({ where: { cupoTipo: 'gratis' } })).toBe(
      2,
    );
    expect(await prisma.vacante.count({ where: { cupoTipo: 'basico' } })).toBe(
      4,
    );
  });
  it('Ilimitado publica sin cupo mientras está activo y deja de hacerlo al vencer', async () => {
    const p = await empresa
      .post('/empresa/pagos')
      .send({ plan: 'ilimitado' })
      .expect(201);
    transaccion.reference = p.body.pagoId;
    transaccion.amount_in_cents = 5900000;
    await request(app.getHttpServer())
      .post('/pagos/eventos')
      .send(evento())
      .expect(200);
    await prisma.cuenta.updateMany({
      data: { correoConfirmadoEn: new Date() },
    });
    const dia = (n: number) =>
      new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
    const datos = {
      titulo: 'Práctica académica ficticia',
      descripcion: 'Oferta académica ficticia para prueba de cupos',
      modalidad: 'remota',
      ciudad: null,
      duracionMeses: 6,
      fechaInicio: dia(60),
      vigencia: dia(30),
      niveles: ['tecnologo'],
      programas: [],
      avances: [],
      aval: false,
      jornada: 'tiempo-completo',
      idiomas: [],
    };
    for (let n = 0; n < 7; n++) {
      const v = await empresa.post('/empresa/vacantes').send(datos).expect(201);
      await empresa.post(`/empresa/vacantes/${v.body.id}/publicar`).expect(201);
    }
    await prisma.empresa.updateMany({ data: { planVenceEn: new Date(0) } });
    const v = await empresa.post('/empresa/vacantes').send(datos).expect(201);
    await empresa.post(`/empresa/vacantes/${v.body.id}/publicar`).expect(409);
  });
  it('pago rechazado nunca activa un plan', async () => {
    const p = await empresa
      .post('/empresa/pagos')
      .send({ plan: 'basico' })
      .expect(201);
    transaccion.reference = p.body.pagoId;
    transaccion.status = 'DECLINED';
    await request(app.getHttpServer())
      .post('/pagos/eventos')
      .send(evento())
      .expect(200);
    expect((await prisma.empresa.findFirstOrThrow()).plan).toBeNull();
    expect(await prisma.pago.count({ where: { estado: 'Rechazado' } })).toBe(1);
  });
});
