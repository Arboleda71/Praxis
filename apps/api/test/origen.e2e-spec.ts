import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types.js';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configurarApp } from '../src/configurar.js';
import { Intentos } from '../src/auth/intentos.js';
import { validarBasePruebas } from './seguridad/base-pruebas.js';

// Spec 011 (FR-001, FR-002): el origen lo declara la web de Praxis con un secreto; nadie más.
describe('origen de la petición', () => {
  let app: INestApplication<App>;
  const SECRETO = 'secreto-de-proxy-de-pruebas-0123456789';
  let n = 0;
  /** Un ingreso fallido contra una cuenta distinta cada vez: solo puede bloquear el origen. */
  const intento = (cabeceras: Record<string, string> = {}) =>
    request(app.getHttpServer())
      .post('/auth/login')
      .set('Origin', 'http://localhost:3000')
      .set(cabeceras)
      .send({ correo: `nadie-${n++}@correo.co`, contrasena: 'equivocada' })
      .then((r) => r.status);
  const desdeLaWeb = (ip: string, secreto = SECRETO) => ({
    'x-praxis-proxy': secreto,
    'x-praxis-ip': ip,
  });
  const agotar = async (cabeceras: (i: number) => Record<string, string>) => {
    for (let i = 0; i < 30; i++) expect(await intento(cabeceras(i))).toBe(401);
  };

  beforeAll(async () => {
    app = configurarApp(
      (
        await Test.createTestingModule({ imports: [AppModule] }).compile()
      ).createNestApplication(),
    );
    await app.init();
  });
  beforeEach(async () => {
    validarBasePruebas(process.env.DATABASE_URL);
    process.env.PROXY_SECRETO = SECRETO;
    await app.get(Intentos).limpiar();
  });
  afterAll(async () => {
    delete process.env.PROXY_SECRETO;
    await app.close();
  });

  it('dos visitantes que llegan por la web son orígenes distintos', async () => {
    await agotar(() => desdeLaWeb('203.0.113.7'));
    expect(await intento(desdeLaWeb('203.0.113.7'))).toBe(429);
    expect(await intento(desdeLaWeb('203.0.113.8'))).toBe(401);
    expect(await intento(desdeLaWeb('2001:db8::1'))).toBe(401);
  });

  it('sin el secreto, declarar una IP no da intentos extra', async () => {
    await agotar((i) => ({
      'x-praxis-ip': `198.51.100.${i}`,
      'X-Forwarded-For': `198.51.100.${i}`,
      'X-Real-IP': `198.51.100.${i}`,
    }));
    expect(
      await intento({ 'x-praxis-ip': '192.0.2.1', 'X-Forwarded-For': '192.0.2.1' }),
    ).toBe(429);
  });

  it('un secreto incorrecto se ignora', async () => {
    await agotar((i) => desdeLaWeb(`198.51.100.${i}`, `${SECRETO}x`));
    expect(await intento(desdeLaWeb('192.0.2.1', 'otro'))).toBe(429);
  });

  it('con el secreto correcto, un valor que no es una IP se ignora', async () => {
    await agotar((i) => desdeLaWeb(`no-es-ip-${i}`));
    expect(await intento(desdeLaWeb('tampoco'))).toBe(429);
  });

  it('si la API no tiene secreto configurado, no cree a nadie', async () => {
    for (const vacio of [undefined, '']) {
      await app.get(Intentos).limpiar();
      if (vacio === undefined) delete process.env.PROXY_SECRETO;
      else process.env.PROXY_SECRETO = vacio;
      await agotar((i) => desdeLaWeb(`198.51.100.${i}`, 'cualquiera'));
      expect(await intento(desdeLaWeb('192.0.2.1', 'cualquiera'))).toBe(429);
    }
  });

  it('una IPv6 cuenta por su /64 y una IPv4 escrita como IPv6 es la misma', async () => {
    await agotar((i) => desdeLaWeb(`2001:db8:0:1::${(i + 1).toString(16)}`));
    expect(await intento(desdeLaWeb('2001:db8:0:1:ffff:ffff:ffff:ffff'))).toBe(429);
    expect(await intento(desdeLaWeb('2001:db8:0:2::1'))).toBe(401);

    await agotar(() => desdeLaWeb('203.0.113.50'));
    expect(await intento(desdeLaWeb('::ffff:203.0.113.50'))).toBe(429);
  });
});
