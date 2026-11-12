import { createHash } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { Intentos } from '../src/auth/intentos.js';
import { configurarApp } from '../src/configurar.js';
import { PrismaService } from '../src/prisma.service.js';
import request from './cliente.js';
import { validarBasePruebas } from './seguridad/base-pruebas.js';

const CORREOS = process.env.CORREOS_DIR!;
const CORREO = 'laura@correo.co';
const ANTERIOR = 'contrasena-segura';
const NUEVA = 'contrasena-nueva-1';
const estudiante = {
  nombreCompleto: 'Laura Gómez Restrepo',
  correo: CORREO,
  contrasena: ANTERIOR,
  confirmarContrasena: ANTERIOR,
  autorizaDatos: true,
};

/** Correos enviados a `correo`, del más antiguo al más reciente. */
function correosDe(correo: string): string[] {
  if (!existsSync(CORREOS)) return [];
  const id = createHash('sha256').update(correo).digest('hex');
  return readdirSync(CORREOS)
    .filter((f) => f.includes(id))
    .sort()
    .map((f) => readFileSync(join(CORREOS, f), 'utf8'));
}
const tokenDe = (correo: string) =>
  correosDe(correo)
    .at(-1)!
    .match(/restablecer-contrasena\?token=([A-Za-z0-9_-]+)/)![1];

// Spec 012. Cambiar la contraseña es una regla de seguridad (XIII, XIV): Postgres real.
describe('restablecer la contraseña (integración, Postgres real)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let agente: ReturnType<typeof request.agent>;
  const anonimo = () => request(app.getHttpServer());
  const pedir = (correo = CORREO) =>
    anonimo().post('/auth/olvide-contrasena').send({ correo });
  const cambiar = (token: string, contrasena = NUEVA) =>
    anonimo()
      .post('/auth/restablecer-contrasena')
      .send({ token, contrasena, confirmarContrasena: contrasena });
  const entrar = (contrasena: string) =>
    anonimo().post('/auth/login').send({ correo: CORREO, contrasena });

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
    await agente.post('/auth/registro/estudiante').send(estudiante).expect(201);
    rmSync(CORREOS, { recursive: true, force: true });
  });

  afterAll(async () => {
    await app.close();
  });

  it('responde igual exista o no la cuenta y solo escribe a la que existe', async () => {
    const desconocida = await pedir('nadie@correo.co').expect(204);
    const conocida = await pedir().expect(204);
    expect(desconocida.body).toEqual(conocida.body);
    expect(correosDe('nadie@correo.co')).toHaveLength(0);
    expect(correosDe(CORREO)).toHaveLength(1);
    expect(await prisma.enlaceRestablecer.count()).toBe(1);
  });

  it('cambia la contraseña, cierra todas las sesiones y el enlace sirve una sola vez', async () => {
    await agente.get('/auth/sesion').expect(200);
    await pedir().expect(204);
    const token = tokenDe(CORREO);
    const estado = () =>
      anonimo().get('/auth/restablecer-contrasena').query({ token });
    // Abrir el enlace no lo gasta.
    expect((await estado().expect(200)).body).toEqual({ valido: true });
    expect((await estado().expect(200)).body).toEqual({ valido: true });

    const res = await cambiar(token).expect(204);
    // No inicia sesión: quien cambió la contraseña entra con ella.
    expect(res.headers['set-cookie']).toBeUndefined();

    await agente.get('/auth/sesion').expect(401);
    expect(await prisma.sesion.count()).toBe(0);
    await entrar(ANTERIOR).expect(401);
    await entrar(NUEVA).expect(200);

    expect((await estado().expect(200)).body).toEqual({ valido: false });
    const repetido = await cambiar(token, 'otra-contrasena-2').expect(410);
    expect(repetido.body.mensaje).toBe('Este enlace ya no sirve.');
    await entrar(NUEVA).expect(200);
  });

  it('guarda la contraseña nueva con argon2 y nunca el token', async () => {
    await pedir().expect(204);
    const token = tokenDe(CORREO);
    const enlace = await prisma.enlaceRestablecer.findFirstOrThrow();
    expect(enlace.id).not.toContain(token);
    // Vence en 30 minutos.
    const minutos = (enlace.expiraEn.getTime() - Date.now()) / 60_000;
    expect(minutos).toBeGreaterThan(29);
    expect(minutos).toBeLessThanOrEqual(30);
    await cambiar(token).expect(204);
    const c = await prisma.cuenta.findUniqueOrThrow({
      where: { correo: CORREO },
    });
    expect(c.contrasenaHash).toMatch(/^\$argon2id\$/);
    expect(c.contrasenaHash).not.toContain(NUEVA);
  });

  it('un enlace vencido o inventado no cambia la contraseña', async () => {
    await pedir().expect(204);
    const token = tokenDe(CORREO);
    await prisma.enlaceRestablecer.updateMany({
      data: { expiraEn: new Date(Date.now() - 1000) },
    });
    await cambiar(token).expect(410);
    await cambiar('x'.repeat(43)).expect(410);
    await entrar(NUEVA).expect(401);
    await entrar(ANTERIOR).expect(200);
    await agente.get('/auth/sesion').expect(200);
  });

  it('envía un correo por minuto y solo sirve el último enlace', async () => {
    await pedir().expect(204);
    const primero = tokenDe(CORREO);
    // Dentro del minuto: misma respuesta, ningún correo nuevo.
    await pedir().expect(204);
    expect(correosDe(CORREO)).toHaveLength(1);

    await prisma.enlaceRestablecer.updateMany({
      data: { creadoEn: new Date(Date.now() - 61_000) },
    });
    await pedir().expect(204);
    expect(correosDe(CORREO)).toHaveLength(2);
    const segundo = tokenDe(CORREO);
    expect(segundo).not.toBe(primero);

    await cambiar(primero).expect(410);
    await cambiar(segundo).expect(204);
  });

  it('dos solicitudes simultáneas envían un solo correo', async () => {
    await Promise.all([pedir().expect(204), pedir().expect(204)]);
    expect(correosDe(CORREO)).toHaveLength(1);
  });

  it('dos usos simultáneos del mismo enlace: solo uno cambia la contraseña', async () => {
    await pedir().expect(204);
    const token = tokenDe(CORREO);
    const [a, b] = await Promise.all([
      cambiar(token, 'contrasena-uno-1'),
      cambiar(token, 'contrasena-dos-2'),
    ]);
    expect([a.status, b.status].sort((x, y) => x - y)).toEqual([204, 410]);
    const ganadora = a.status === 204 ? 'contrasena-uno-1' : 'contrasena-dos-2';
    const perdedora = a.status === 204 ? 'contrasena-dos-2' : 'contrasena-uno-1';
    await entrar(perdedora).expect(401);
    await entrar(ganadora).expect(200);
  });

  it('valida la contraseña nueva con los esquemas compartidos', async () => {
    await pedir().expect(204);
    const token = tokenDe(CORREO);
    const corta = await cambiar(token, 'corta1').expect(400);
    expect(corta.body.errores.contrasena).toBe(
      'Debe tener al menos 10 caracteres. Llevas 6.',
    );
    const distinta = await anonimo()
      .post('/auth/restablecer-contrasena')
      .send({ token, contrasena: NUEVA, confirmarContrasena: 'otra-distinta' })
      .expect(400);
    expect(distinta.body.errores.confirmarContrasena).toBe(
      'Las contraseñas no coinciden.',
    );
    await pedir('no-es-un-correo').expect(400);
    // Los rechazos no gastan el enlace.
    await cambiar(token).expect(204);
  });

  it('limita las solicitudes a diez por hora por origen, exista o no la cuenta', async () => {
    for (let i = 0; i < 10; i++)
      await pedir(`nadie-${i}@correo.co`).expect(204);
    const res = await pedir().expect(429);
    expect(res.body.mensaje).toMatch(/^Demasiados intentos\. Espera /);
    expect(res.body.segundos).toBeGreaterThan(3500);
    expect(correosDe(CORREO)).toHaveLength(0);
  });

  it('levanta el bloqueo por intentos fallidos de la cuenta', async () => {
    for (let i = 0; i < 5; i++) await entrar('equivocada-1').expect(401);
    await entrar(ANTERIOR).expect(429);
    await pedir().expect(204);
    await cambiar(tokenDe(CORREO)).expect(204);
    await entrar(NUEVA).expect(200);
  });

  it('rechaza las peticiones que no vienen de las pantallas de Praxis', async () => {
    await anonimo()
      .post('/auth/olvide-contrasena')
      .set('Origin', 'https://otro-sitio.co')
      .send({ correo: CORREO })
      .expect(403);
    expect(correosDe(CORREO)).toHaveLength(0);
  });
});
