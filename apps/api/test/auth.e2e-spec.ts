import { createHash } from 'node:crypto';
import { validarBasePruebas } from './seguridad/base-pruebas.js';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import request from './cliente.js';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configurarApp } from '../src/configurar.js';
import { Intentos } from '../src/auth/intentos.js';
import { PrismaService } from '../src/prisma.service.js';
import { jest } from '@jest/globals';
import { Logger } from '@nestjs/common';

const CORREOS = process.env.CORREOS_DIR!;

const estudiante = {
  nombreCompleto: 'Laura Gómez Restrepo',
  correo: 'laura@correo.co',
  contrasena: 'contrasena-segura',
  confirmarContrasena: 'contrasena-segura',
  autorizaDatos: true,
};
const empresa = {
  razonSocial: 'Andina Soft S.A.S.',
  nit: '900123456-8',
  correo: 'talento@andinasoft.co',
  contrasena: 'contrasena-segura',
  confirmarContrasena: 'contrasena-segura',
  autorizaDatos: true,
};

/** Token del último correo de confirmación enviado a `correo`. */
function tokenDe(correo: string): string {
  const archivos = readdirSync(CORREOS)
    .filter((f) =>
      f.includes(createHash('sha256').update(correo).digest('hex')),
    )
    .sort();
  const html = readFileSync(join(CORREOS, archivos.at(-1)!), 'utf8');
  return html.match(/token=([A-Za-z0-9_-]+)/)![1];
}

describe('/auth (integración, Postgres real)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let agente: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = configurarApp(mod.createNestApplication());
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    validarBasePruebas(process.env.DATABASE_URL);
    await prisma.$executeRawUnsafe('TRUNCATE "Cuenta" CASCADE');
    await app.get(Intentos).limpiar();
    rmSync(CORREOS, { recursive: true, force: true });
    agente = request.agent(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  describe('registro', () => {
    it('crea la cuenta de estudiante, inicia la sesión y envía el correo', async () => {
      const res = await agente
        .post('/auth/registro/estudiante')
        .send(estudiante)
        .expect(201);
      expect(res.body.sesion).toEqual({
        rol: 'estudiante',
        nombre: 'Laura Gómez Restrepo',
        correo: 'laura@correo.co',
        correoConfirmado: false,
      });
      const cookie = String(res.headers['set-cookie']);
      expect(cookie).toMatch(/praxis_sesion=/);
      expect(cookie).toMatch(/HttpOnly/i);
      expect(cookie).toMatch(/SameSite=Lax/i);
      expect(tokenDe('laura@correo.co')).toBeTruthy();
      await agente.get('/auth/sesion').expect(200);
    });

    it('guarda la contraseña con argon2, nunca en texto plano', async () => {
      await agente
        .post('/auth/registro/estudiante')
        .send(estudiante)
        .expect(201);
      const c = await prisma.cuenta.findUniqueOrThrow({
        where: { correo: 'laura@correo.co' },
      });
      expect(c.contrasenaHash).toMatch(/^\$argon2id\$/);
      expect(c.autorizacionDatosEn).toBeInstanceOf(Date);
    });

    it('rechaza un correo ya registrado con un mensaje por campo', async () => {
      await agente
        .post('/auth/registro/estudiante')
        .send(estudiante)
        .expect(201);
      const res = await request(app.getHttpServer())
        .post('/auth/registro/estudiante')
        .send(estudiante)
        .expect(409);
      expect(res.body.errores.correo).toBe(
        'Este correo ya tiene una cuenta. Inicia sesión.',
      );
    });

    it('crea la empresa con el NIT normalizado y rechaza un NIT repetido', async () => {
      await agente.post('/auth/registro/empresa').send(empresa).expect(201);
      const e = await prisma.empresa.findFirstOrThrow();
      expect({ nit: e.nit, dv: e.dv }).toEqual({ nit: '900123456', dv: 8 });
      const res = await request(app.getHttpServer())
        .post('/auth/registro/empresa')
        .send({ ...empresa, correo: 'otra@andinasoft.co' })
        .expect(409);
      expect(res.body.errores.nit).toBe('Ya existe una cuenta para este NIT.');
    });

    it('valida con los esquemas compartidos (400 con errores por campo)', async () => {
      const res = await agente
        .post('/auth/registro/empresa')
        .send({ ...empresa, nit: '900123456-7', autorizaDatos: false })
        .expect(400);
      expect(res.body.errores.nit).toMatch(/dígito de verificación/);
      expect(res.body.errores.autorizaDatos).toBe(
        'Debes aceptar la política para continuar.',
      );
    });

    it('los registros tienen una ventana independiente y limitada', async () => {
      await agente
        .post('/auth/registro/estudiante')
        .send(estudiante)
        .expect(201);
      for (let i = 0; i < 4; i++)
        await agente
          .post('/auth/registro/estudiante')
          .send(estudiante)
          .expect(409);
      // El registro de la empresa sí prospera: los cuatro fallos anteriores dejan de contar.
      await agente.post('/auth/registro/empresa').send(empresa).expect(201);
      for (let i = 0; i < 4; i++)
        await agente
          .post('/auth/registro/estudiante')
          .send(estudiante)
          .expect(409);
      const bloqueo = await agente
        .post('/auth/registro/estudiante')
        .send({ ...estudiante, correo: 'otra@correo.co' })
        .expect(429);
      // El registro también informa el tiempo real que falta (spec 011, FR-007).
      expect(bloqueo.body.segundos).toBeGreaterThan(890);
    });
  });

  describe('inicio y cierre de sesión', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/auth/registro/estudiante')
        .send(estudiante)
        .expect(201);
    });

    it('inicia sesión con datos correctos', async () => {
      const res = await agente
        .post('/auth/login')
        .send({ correo: 'LAURA@correo.co', contrasena: estudiante.contrasena })
        .expect(200);
      expect(res.body.sesion.rol).toBe('estudiante');
      await agente.get('/auth/sesion').expect(200);
    });

    it('responde igual con contraseña errada o correo inexistente', async () => {
      const a = await agente
        .post('/auth/login')
        .send({ correo: 'laura@correo.co', contrasena: 'equivocada' })
        .expect(401);
      const b = await agente
        .post('/auth/login')
        .send({ correo: 'nadie@correo.co', contrasena: 'equivocada' })
        .expect(401);
      expect(a.body).toEqual(b.body);
      expect(a.body.mensaje).toBe('Correo o contraseña incorrectos.');
    });

    it('bloquea 15 minutos tras 5 intentos fallidos', async () => {
      for (let i = 0; i < 5; i++) {
        await agente
          .post('/auth/login')
          .send({ correo: 'laura@correo.co', contrasena: 'equivocada' })
          .expect(401);
      }
      const res = await agente
        .post('/auth/login')
        .send({ correo: 'laura@correo.co', contrasena: estudiante.contrasena })
        .expect(429);
      expect(res.body.mensaje).toBe(
        'Demasiados intentos. Espera 15 minutos e inténtalo de nuevo.',
      );
      expect(res.body.segundos).toBeGreaterThan(890);
      expect(res.body.segundos).toBeLessThanOrEqual(900);
    });

    it('el bloqueo informa el tiempo real que falta y termina solo (spec 011)', async () => {
      const malo = { correo: 'laura@correo.co', contrasena: 'equivocada' };
      for (let i = 0; i < 5; i++)
        await agente.post('/auth/login').send(malo).expect(401);
      await prisma.$executeRawUnsafe(
        `UPDATE "Intento" SET vence = now() + interval '90 seconds'`,
      );
      const res = await agente.post('/auth/login').send(malo).expect(429);
      expect(res.body.segundos).toBeGreaterThan(85);
      expect(res.body.segundos).toBeLessThanOrEqual(90);
      expect(res.body.mensaje).toBe(
        'Demasiados intentos. Espera 2 minutos e inténtalo de nuevo.',
      );
      await prisma.$executeRawUnsafe(
        `UPDATE "Intento" SET vence = now() - interval '1 second'`,
      );
      await agente
        .post('/auth/login')
        .send({ correo: 'laura@correo.co', contrasena: estudiante.contrasena })
        .expect(200);
    });

    it('cerrar una sesión que el servidor ya no reconoce no da error (spec 011)', async () => {
      await agente
        .post('/auth/login')
        .send({ correo: 'laura@correo.co', contrasena: estudiante.contrasena })
        .expect(200);
      await prisma.sesion.deleteMany();
      await agente.post('/auth/logout').expect(204);
      await request(app.getHttpServer()).post('/auth/logout').expect(204);
    });

    it('un inicio de sesión correcto reinicia la cuenta de intentos', async () => {
      const malo = { correo: 'laura@correo.co', contrasena: 'equivocada' };
      const bueno = {
        correo: 'laura@correo.co',
        contrasena: estudiante.contrasena,
      };
      for (let i = 0; i < 4; i++)
        await agente.post('/auth/login').send(malo).expect(401);
      await agente.post('/auth/login').send(bueno).expect(200);
      for (let i = 0; i < 4; i++)
        await agente.post('/auth/login').send(malo).expect(401);
      await agente.post('/auth/login').send(bueno).expect(200);
    });

    it('cerrar sesión la termina en el servidor', async () => {
      await agente
        .post('/auth/login')
        .send({ correo: 'laura@correo.co', contrasena: estudiante.contrasena })
        .expect(200);
      await agente.post('/auth/logout').expect(204);
      await agente.get('/auth/sesion').expect(401);
      expect(await prisma.sesion.count()).toBe(1); // solo la del registro inicial
    });

    it('sin sesión, /auth/sesion responde 401', async () => {
      await request(app.getHttpServer()).get('/auth/sesion').expect(401);
    });
  });

  describe('confirmación de correo', () => {
    beforeEach(async () => {
      await agente
        .post('/auth/registro/estudiante')
        .send(estudiante)
        .expect(201);
    });

    it('un enlace válido confirma el correo una sola vez', async () => {
      const token = tokenDe('laura@correo.co');
      const ok = await request(app.getHttpServer())
        .post('/auth/confirmar-correo')
        .send({ token })
        .expect(200);
      expect(ok.body.rol).toBe('estudiante');
      const s = await agente.get('/auth/sesion').expect(200);
      expect(s.body.correoConfirmado).toBe(true);
      await request(app.getHttpServer())
        .post('/auth/confirmar-correo')
        .send({ token })
        .expect(200);
    });

    it('un enlace vencido no sirve', async () => {
      const token = tokenDe('laura@correo.co');
      await prisma.enlaceConfirmacion.updateMany({
        data: { expiraEn: new Date(Date.now() - 1000) },
      });
      const res = await request(app.getHttpServer())
        .post('/auth/confirmar-correo')
        .send({ token })
        .expect(410);
      expect(res.body.mensaje).toBe('Este enlace ya no sirve.');
    });

    it('reenviar: uno por minuto y el anterior deja de servir', async () => {
      const viejo = tokenDe('laura@correo.co');
      await prisma.enlaceConfirmacion.updateMany({
        data: { creadoEn: new Date(Date.now() - 61_000) },
      });
      await agente.post('/auth/reenviar-confirmacion').expect(204);
      const espera = await agente
        .post('/auth/reenviar-confirmacion')
        .expect(429);
      expect(espera.body.segundos).toBeGreaterThan(0);
      await request(app.getHttpServer())
        .post('/auth/confirmar-correo')
        .send({ token: viejo })
        .expect(410);
      await request(app.getHttpServer())
        .post('/auth/confirmar-correo')
        .send({ token: tokenDe('laura@correo.co') })
        .expect(200);
    });

    describe('proveedor de correo caído (spec 011)', () => {
      let fetchFalso: jest.SpiedFunction<typeof fetch>;
      const hace61s = () =>
        prisma.enlaceConfirmacion.updateMany({
          data: { creadoEn: new Date(Date.now() - 61_000) },
        });
      beforeEach(() => {
        process.env.RESEND_API_KEY = 're_ficticia';
        process.env.CORREO_REMITENTE = 'Praxis <no-responder@praxis.test>';
        jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
        fetchFalso = jest
          .spyOn(globalThis, 'fetch')
          .mockRejectedValue(new Error('sin red'));
      });
      afterEach(() => {
        process.env.RESEND_API_KEY = '';
        jest.restoreAllMocks();
      });

      it('al registrarse, la cuenta queda creada y con sesión', async () => {
        const otro = request.agent(app.getHttpServer());
        await otro.post('/auth/registro/empresa').send(empresa).expect(201);
        await otro.get('/auth/sesion').expect(200);
        expect(fetchFalso).toHaveBeenCalledTimes(1);
      });

      it('el envío lleva tiempo límite y un rechazo del proveedor es un fallo', async () => {
        await hace61s();
        fetchFalso.mockResolvedValue(new Response('{}', { status: 403 }));
        await agente.post('/auth/reenviar-confirmacion').expect(503);
        const [url, opciones] = fetchFalso.mock.calls[0];
        expect(url).toBe('https://api.resend.com/emails');
        expect(opciones?.signal).toBeInstanceOf(AbortSignal);
      });

      it('al reenviar avisa, conserva el límite de un minuto y se puede reintentar', async () => {
        const viejo = tokenDe('laura@correo.co');
        await hace61s();
        const res = await agente
          .post('/auth/reenviar-confirmacion')
          .expect(503);
        expect(res.body.mensaje).toBe(
          'No pudimos enviar el correo. Inténtalo de nuevo en un minuto.',
        );
        expect(JSON.stringify(res.body)).not.toContain('laura@correo.co');
        // El fallo no abre la puerta a martillar al proveedor.
        await agente.post('/auth/reenviar-confirmacion').expect(429);
        await agente.get('/auth/sesion').expect(200);
        // Vuelve el proveedor: el reintento sale y recién entonces el anterior deja de servir.
        await hace61s();
        fetchFalso.mockResolvedValue(
          new Response('{"id":"ficticio"}', { status: 200 }),
        );
        await agente.post('/auth/reenviar-confirmacion').expect(204);
        expect(
          await prisma.enlaceConfirmacion.count({ where: { usadoEn: null } }),
        ).toBe(1);
        await request(app.getHttpServer())
          .post('/auth/confirmar-correo')
          .send({ token: viejo })
          .expect(410);
      });

      it('si el proveedor aceptó pero respondió tarde, el enlace que llegó también confirma', async () => {
        await hace61s();
        fetchFalso.mockRejectedValue(new DOMException('tarde', 'TimeoutError'));
        await agente.post('/auth/reenviar-confirmacion').expect(503);
        const cuerpo = JSON.parse(fetchFalso.mock.calls[0][1]?.body as string);
        const enviado = String(cuerpo.html).match(/token=([A-Za-z0-9_-]+)/)![1];
        await request(app.getHttpServer())
          .post('/auth/confirmar-correo')
          .send({ token: enviado })
          .expect(200);
      });

      it('tras un reenvío fallido, el enlace que ya tenía confirma', async () => {
        const viejo = tokenDe('laura@correo.co');
        await hace61s();
        await agente.post('/auth/reenviar-confirmacion').expect(503);
        await request(app.getHttpServer())
          .post('/auth/confirmar-correo')
          .send({ token: viejo })
          .expect(200);
      });
    });

    it('reenviar exige sesión', async () => {
      await request(app.getHttpServer())
        .post('/auth/reenviar-confirmacion')
        .expect(401);
    });
  });
});
