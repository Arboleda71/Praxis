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
  const archivos = readdirSync(CORREOS).filter((f) => f.includes(createHash('sha256').update(correo).digest('hex'))).sort();
  const html = readFileSync(join(CORREOS, archivos.at(-1)!), 'utf8');
  return html.match(/token=([A-Za-z0-9_-]+)/)![1];
}

describe('/auth (integración, Postgres real)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let agente: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configurarApp(mod.createNestApplication());
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    validarBasePruebas(process.env.DATABASE_URL);
    await prisma.$executeRawUnsafe('TRUNCATE "Cuenta" CASCADE');
    app.get(Intentos).limpiar();
    rmSync(CORREOS, { recursive: true, force: true });
    agente = request.agent(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  describe('registro', () => {
    it('crea la cuenta de estudiante, inicia la sesión y envía el correo', async () => {
      const res = await agente.post('/auth/registro/estudiante').send(estudiante).expect(201);
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
      await agente.post('/auth/registro/estudiante').send(estudiante).expect(201);
      const c = await prisma.cuenta.findUniqueOrThrow({ where: { correo: 'laura@correo.co' } });
      expect(c.contrasenaHash).toMatch(/^\$argon2id\$/);
      expect(c.autorizacionDatosEn).toBeInstanceOf(Date);
    });

    it('rechaza un correo ya registrado con un mensaje por campo', async () => {
      await agente.post('/auth/registro/estudiante').send(estudiante).expect(201);
      const res = await request(app.getHttpServer()).post('/auth/registro/estudiante').send(estudiante).expect(409);
      expect(res.body.errores.correo).toBe('Este correo ya tiene una cuenta. Inicia sesión.');
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
      expect(res.body.errores.autorizaDatos).toBe('Debes aceptar la política para continuar.');
    });

    it('los registros tienen una ventana independiente y limitada', async () => {
      await agente.post('/auth/registro/estudiante').send(estudiante).expect(201);
      for (let i = 0; i < 4; i++) await agente.post('/auth/registro/estudiante').send(estudiante).expect(409);
      // El registro de la empresa sí prospera: los cuatro fallos anteriores dejan de contar.
      await agente.post('/auth/registro/empresa').send(empresa).expect(201);
      for (let i = 0; i < 4; i++) await agente.post('/auth/registro/estudiante').send(estudiante).expect(409);
      await agente.post('/auth/registro/estudiante').send({ ...estudiante, correo: 'otra@correo.co' }).expect(429);
    });
  });

  describe('inicio y cierre de sesión', () => {
    beforeEach(async () => {
      await request(app.getHttpServer()).post('/auth/registro/estudiante').send(estudiante).expect(201);
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
      const a = await agente.post('/auth/login').send({ correo: 'laura@correo.co', contrasena: 'equivocada' }).expect(401);
      const b = await agente.post('/auth/login').send({ correo: 'nadie@correo.co', contrasena: 'equivocada' }).expect(401);
      expect(a.body).toEqual(b.body);
      expect(a.body.mensaje).toBe('Correo o contraseña incorrectos.');
    });

    it('bloquea 15 minutos tras 5 intentos fallidos', async () => {
      for (let i = 0; i < 5; i++) {
        await agente.post('/auth/login').send({ correo: 'laura@correo.co', contrasena: 'equivocada' }).expect(401);
      }
      const res = await agente.post('/auth/login').send({ correo: 'laura@correo.co', contrasena: estudiante.contrasena }).expect(429);
      expect(res.body.mensaje).toBe('Demasiados intentos. Espera 15 minutos e inténtalo de nuevo.');
    });

    it('un inicio de sesión correcto reinicia la cuenta de intentos', async () => {
      const malo = { correo: 'laura@correo.co', contrasena: 'equivocada' };
      const bueno = { correo: 'laura@correo.co', contrasena: estudiante.contrasena };
      for (let i = 0; i < 4; i++) await agente.post('/auth/login').send(malo).expect(401);
      await agente.post('/auth/login').send(bueno).expect(200);
      for (let i = 0; i < 4; i++) await agente.post('/auth/login').send(malo).expect(401);
      await agente.post('/auth/login').send(bueno).expect(200);
    });

    it('cerrar sesión la termina en el servidor', async () => {
      await agente.post('/auth/login').send({ correo: 'laura@correo.co', contrasena: estudiante.contrasena }).expect(200);
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
      await agente.post('/auth/registro/estudiante').send(estudiante).expect(201);
    });

    it('un enlace válido confirma el correo una sola vez', async () => {
      const token = tokenDe('laura@correo.co');
      const ok = await request(app.getHttpServer()).post('/auth/confirmar-correo').send({ token }).expect(200);
      expect(ok.body.rol).toBe('estudiante');
      const s = await agente.get('/auth/sesion').expect(200);
      expect(s.body.correoConfirmado).toBe(true);
      await request(app.getHttpServer()).post('/auth/confirmar-correo').send({ token }).expect(200);
    });

    it('un enlace vencido no sirve', async () => {
      const token = tokenDe('laura@correo.co');
      await prisma.enlaceConfirmacion.updateMany({ data: { expiraEn: new Date(Date.now() - 1000) } });
      const res = await request(app.getHttpServer()).post('/auth/confirmar-correo').send({ token }).expect(410);
      expect(res.body.mensaje).toBe('Este enlace ya no sirve.');
    });

    it('reenviar: uno por minuto y el anterior deja de servir', async () => {
      const viejo = tokenDe('laura@correo.co');
      await prisma.enlaceConfirmacion.updateMany({ data: { creadoEn: new Date(Date.now() - 61_000) } });
      await agente.post('/auth/reenviar-confirmacion').expect(204);
      const espera = await agente.post('/auth/reenviar-confirmacion').expect(429);
      expect(espera.body.segundos).toBeGreaterThan(0);
      await request(app.getHttpServer()).post('/auth/confirmar-correo').send({ token: viejo }).expect(410);
      await request(app.getHttpServer()).post('/auth/confirmar-correo').send({ token: tokenDe('laura@correo.co') }).expect(200);
    });

    it('reenviar exige sesión', async () => {
      await request(app.getHttpServer()).post('/auth/reenviar-confirmacion').expect(401);
    });
  });
});


