import { createHash } from 'node:crypto';
import { Intentos } from '../src/auth/intentos.js';
import { PrismaService } from '../src/prisma.service.js';
import { validarBasePruebas } from './seguridad/base-pruebas.js';

// Spec 011 (PM019): los contadores viven en Postgres. Dos instancias simulan dos copias de la API.
describe('Intentos (Postgres real, dos instancias)', () => {
  let prismaA: PrismaService;
  let prismaB: PrismaService;
  let a: Intentos;
  let b: Intentos;
  const h = (clave: string) => createHash('sha256').update(clave).digest('hex');
  const n = async (clave: string) =>
    (await prismaA.intento.findUnique({ where: { clave: h(clave) } }))?.n;
  const vencer = () =>
    prismaA.$executeRawUnsafe(
      `UPDATE "Intento" SET vence = now() - interval '1 second'`,
    );

  beforeAll(async () => {
    validarBasePruebas(process.env.DATABASE_URL);
    prismaA = new PrismaService();
    prismaB = new PrismaService();
    await prismaA.$connect();
    await prismaB.$connect();
    a = new Intentos(prismaA);
    b = new Intentos(prismaB);
  });
  beforeEach(() => a.limpiar());
  afterAll(async () => {
    await prismaA.$disconnect();
    await prismaB.$disconnect();
  });

  it('50 reservas simultáneas repartidas entre dos instancias aceptan como máximo 5', async () => {
    const r = await Promise.all(
      Array.from({ length: 50 }, (_, n) =>
        (n % 2 ? a : b).reservar('correo:a@b.co', 'ip:1'),
      ),
    );
    expect(r.filter((s) => s === 0)).toHaveLength(5);
  });

  it('una reserva que pierde la carrera no cuenta en las demás claves', async () => {
    for (let i = 0; i < 4; i++) await a.reservar('correo:a@b.co');
    // Otra copia de la API lleva la cuenta al límite y aún no confirma: la reserva siguiente ya leyó n = 4
    // y espera ese bloqueo de fila. Al confirmarse, la cuenta no se suma, y el origen tampoco debe sumarse.
    let tomado!: () => void;
    let soltar!: () => void;
    const lockTomado = new Promise<void>((r) => (tomado = r));
    const fin = new Promise<void>((r) => (soltar = r));
    const otra = prismaB.$transaction(
      async (tx) => {
        await tx.$executeRaw`UPDATE "Intento" SET n = n + 1 WHERE clave = ${h('correo:a@b.co')}`;
        tomado();
        await fin;
      },
      { timeout: 10_000 },
    );
    await lockTomado;
    const reserva = a.reservar('correo:a@b.co', 'ip:1');
    await new Promise((r) => setTimeout(r, 500));
    soltar();
    await otra;
    expect(await reserva).toBeGreaterThan(0);
    expect(await n('ip:1')).toBeUndefined();
  });

  it('el quinto fallo reinicia el bloqueo de la cuenta; la ventana del origen es fija', async () => {
    for (let i = 0; i < 4; i++) await a.reservar('correo:a@b.co');
    for (let i = 0; i < 29; i++) await a.fallo('ip:1');
    await prismaA.$executeRawUnsafe(
      `UPDATE "Intento" SET vence = now() + interval '10 seconds'`,
    );
    await a.reservar('correo:a@b.co');
    await a.reservar('correo:otra@b.co', 'ip:1');
    expect(await a.bloqueado('correo:a@b.co')).toBeGreaterThan(895);
    const origen = await a.bloqueado('ip:1');
    expect(origen).toBeGreaterThan(0);
    expect(origen).toBeLessThanOrEqual(10);
  });

  it('aciertos y reservas simultáneos sobre las mismas claves no se interbloquean', async () => {
    for (let i = 0; i < 20; i++) await a.fallo(`correo:${i}@b.co`);
    await vencer();
    const claves = ['correo:a@b.co', 'ip:1', 'ip:2', 'correo:b@b.co'];
    const r = await Promise.allSettled(
      Array.from({ length: 60 }, (_, i) => {
        const yo = i % 2 ? a : b;
        const par = i % 3 ? [claves[0], claves[1]] : [claves[3], claves[2]];
        return i % 4 ? yo.reservar(...par) : yo.exito(...par.toReversed());
      }),
    );
    expect(r.filter((x) => x.status === 'rejected')).toEqual([]);
  });

  it('el bloqueo de una instancia lo ve la otra y dura 15 minutos', async () => {
    for (let n = 0; n < 5; n++)
      expect(await a.reservar('correo:a@b.co', 'ip:1')).toBe(0);
    const segundos = await b.reservar('correo:a@b.co', 'ip:2');
    expect(segundos).toBeGreaterThan(895);
    expect(segundos).toBeLessThanOrEqual(900);
    expect(await b.bloqueado('correo:a@b.co')).toBe(segundos);
  });

  it('una petición bloqueada no cuenta contra las demás claves', async () => {
    for (let n = 0; n < 5; n++) await a.reservar('correo:a@b.co', 'ip:1');
    for (let n = 0; n < 40; n++) await a.reservar('correo:a@b.co', 'ip:2');
    expect(await a.reservar('correo:otra@b.co', 'ip:2')).toBe(0);
  });

  it('una ventana vencida vuelve a empezar', async () => {
    for (let n = 0; n < 5; n++) await a.reservar('correo:a@b.co');
    await vencer();
    expect(await b.reservar('correo:a@b.co')).toBe(0);
    expect(await b.bloqueado('correo:a@b.co')).toBe(0);
  });

  it('un acierto libera la cuenta y solo devuelve la reserva del origen', async () => {
    for (let n = 0; n < 29; n++) await a.fallo('ip:1');
    expect(await a.reservar('correo:correcto', 'ip:1')).toBe(0);
    await a.exito('correo:correcto', 'ip:1');
    expect(await b.reservar('correo:ultimo', 'ip:1')).toBe(0);
    expect(await b.reservar('correo:otra', 'ip:1')).toBeGreaterThan(0);
    for (let n = 0; n < 4; n++) await a.reservar('correo:correcto');
    expect(await a.reservar('correo:correcto')).toBe(0);
  });

  it('el origen se bloquea a los 30 intentos, no a los 5', async () => {
    for (let n = 0; n < 30; n++)
      expect(await a.reservar(`correo:${n}@b.co`, 'ip:1')).toBe(0);
    expect(await a.reservar('correo:nueva@b.co', 'ip:1')).toBeGreaterThan(0);
  });

  it('limita los registros a diez por hora por origen', async () => {
    for (let n = 0; n < 10; n++) expect(await a.registro('1.1.1.1')).toBe(0);
    const segundos = await b.registro('1.1.1.1');
    expect(segundos).toBeGreaterThan(3590);
    expect(segundos).toBeLessThanOrEqual(3600);
    expect(await b.registro('2.2.2.2')).toBe(0);
  });

  it('no guarda correos ni IP en claro y borra los vencidos al acertar', async () => {
    await a.reservar('correo:persona@correo.co', 'ip:203.0.113.7');
    const filas = await prismaA.$queryRawUnsafe<{ clave: string }[]>(
      'SELECT clave FROM "Intento"',
    );
    expect(filas).toHaveLength(2);
    for (const f of filas) expect(f.clave).toMatch(/^[0-9a-f]{64}$/);
    await vencer();
    await a.exito('correo:otra');
    expect(await prismaA.intento.count()).toBe(0);
  });
});
