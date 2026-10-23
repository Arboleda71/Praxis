import { validarBasePruebas } from './seguridad/base-pruebas.js';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { rmSync } from 'node:fs';
import request from './cliente.js';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configurarApp } from '../src/configurar.js';
import { Intentos } from '../src/auth/intentos.js';
import { PrismaService } from '../src/prisma.service.js';

const MB = 1024 * 1024;
const pdf = (bytes = 2000) => Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(bytes - 9, 0x20)]);
const png = () => Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(500)]);
const docx = () => Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.alloc(500)]);
const gif = () => Buffer.concat([Buffer.from('GIF89a'), Buffer.alloc(500)]);

const cuenta = { contrasena: 'contrasena-segura', confirmarContrasena: 'contrasena-segura', autorizaDatos: true };
const formacion = { nivelFormacion: 'tecnologo', programa: 'Tecnología en análisis y desarrollo de software', institucion: 'SENA', avance: 'lectiva' };

describe('/perfil (integración, Postgres real)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let laura: ReturnType<typeof request.agent>;

  const subir = (agente: typeof laura, tipo: string, datos: Buffer, nombre: string) =>
    agente.put(`/perfil/archivos/${tipo}`).attach('archivo', datos, nombre);
  /** El enlace firmado apunta a /api/… (rewrite de la web); la API lo sirve sin el prefijo. */
  const ruta = (url: string) => url.replace(/^\/api/, '');

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
    rmSync(process.env.ARCHIVOS_DIR!, { recursive: true, force: true });
    laura = request.agent(app.getHttpServer());
    await laura
      .post('/auth/registro/estudiante')
      .send({ ...cuenta, nombreCompleto: 'Laura Gómez Restrepo', correo: 'laura@correo.co' })
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('acceso (FR-001, SC-003)', () => {
    it('sin sesión → 401', async () => {
      await request(app.getHttpServer()).get('/perfil').expect(401);
      await request(app.getHttpServer()).put('/perfil/formacion').send(formacion).expect(401);
    });

    it('una empresa → 403 en todo /perfil', async () => {
      const empresa = request.agent(app.getHttpServer());
      await empresa
        .post('/auth/registro/empresa')
        .send({ ...cuenta, razonSocial: 'Andina Soft S.A.S.', nit: '900123456-8', correo: 'talento@andinasoft.co' })
        .expect(201);
      const res = await empresa.get('/perfil').expect(403);
      expect(res.body.mensaje).toBe('Esta sección es solo para estudiantes.');
      await empresa.put('/perfil/formacion').send(formacion).expect(403);
      await subir(empresa, 'hoja-de-vida', pdf(), 'cv.pdf').expect(403);
    });
  });

  describe('perfil mínimo y secciones (US1, US2)', () => {
    it('un perfil nuevo está vacío y dice qué falta', async () => {
      const { body } = await laura.get('/perfil').expect(200);
      expect(body).toMatchObject({
        nombre: 'Laura Gómez Restrepo',
        formacion: { nivelFormacion: null, programa: null, institucion: null, avance: null },
        disponibilidad: { disponibleDesde: null, jornada: null, idiomas: [] },
        aval: null,
        archivos: { hojaDeVida: null, soporteAval: null, foto: null },
        perfilMinimo: { completo: false, faltan: ['nivelFormacion', 'programa', 'hojaDeVida'] },
      });
    });

    it('guarda la formación y completa el perfil mínimo con la hoja de vida', async () => {
      let { body } = await laura.put('/perfil/formacion').send(formacion).expect(200);
      expect(body.formacion).toEqual(formacion);
      expect(body.perfilMinimo.faltan).toEqual(['hojaDeVida']);
      ({ body } = await subir(laura, 'hoja-de-vida', pdf(), 'hoja de vida ñandú.pdf').expect(200));
      expect(body.archivos.hojaDeVida).toMatchObject({ nombre: 'hoja de vida ñandú.pdf', bytes: 2000 });
      expect(body.perfilMinimo).toEqual({ completo: true, faltan: [] });
    });

    it('el programa es texto libre (constitución v4.0.0): acepta cualquier programa real y lo recorta', async () => {
      const { body } = await laura
        .put('/perfil/formacion')
        .send({ ...formacion, nivelFormacion: 'universitario', programa: '  Ingeniería Mecatrónica ', avance: null })
        .expect(200);
      expect(body.formacion.programa).toBe('Ingeniería Mecatrónica');
    });

    it('rechaza un programa demasiado corto, un avance de otro nivel y campos que no se piden', async () => {
      let res = await laura.put('/perfil/formacion').send({ ...formacion, programa: 'In' }).expect(400);
      expect(res.body.errores.programa).toBe('Escribe el nombre completo de tu programa.');
      res = await laura.put('/perfil/formacion').send({ ...formacion, avance: 'sem-3' }).expect(400);
      expect(res.body.errores.avance).toBe('Este avance no corresponde al nivel elegido.');
      res = await laura.put('/perfil/formacion').send({ ...formacion, edad: 22 }).expect(400);
      expect(res.body.errores).toBeDefined();
    });

    it('guarda disponibilidad e idiomas, y reemplaza los idiomas al guardar de nuevo', async () => {
      const d = { disponibleDesde: '2026-11-03', jornada: 'tiempo-completo', idiomas: [{ idioma: 'ingles', nivel: 'b1' }] };
      let { body } = await laura.put('/perfil/disponibilidad').send(d).expect(200);
      expect(body.disponibilidad).toEqual(d);
      ({ body } = await laura.put('/perfil/disponibilidad').send({ ...d, idiomas: [{ idioma: 'portugues', nivel: 'a2' }] }).expect(200));
      expect(body.disponibilidad.idiomas).toEqual([{ idioma: 'portugues', nivel: 'a2' }]);
    });

    it('rechaza un idioma repetido en su fila', async () => {
      const res = await laura
        .put('/perfil/disponibilidad')
        .send({ disponibleDesde: null, jornada: null, idiomas: [{ idioma: 'ingles', nivel: 'b1' }, { idioma: 'ingles', nivel: 'c1' }] })
        .expect(400);
      expect(res.body.errores['idiomas.1.idioma']).toBe('Ya agregaste este idioma.');
    });
  });

  describe('archivos (US3)', () => {
    it('rechaza por contenido un .docx renombrado a .pdf', async () => {
      const res = await subir(laura, 'hoja-de-vida', docx(), 'cv.pdf').expect(400);
      expect(res.body.errores.archivo).toBe('Solo se aceptan archivos PDF. Guárdalo como PDF y vuelve a elegirlo.');
    });

    it('rechaza un PDF de más de 5 MB diciendo cuánto pesa', async () => {
      const res = await subir(laura, 'hoja-de-vida', pdf(6 * MB), 'cv.pdf').expect(413);
      expect(res.body.errores.archivo).toBe('Pesa 6 MB y el máximo es 5 MB.');
    });

    it('sirve el archivo con un enlace firmado y deja de servir el anterior al reemplazar', async () => {
      await subir(laura, 'hoja-de-vida', pdf(1000), 'v1.pdf').expect(200);
      const { body: e1 } = await laura.get('/perfil/archivos/hoja-de-vida/enlace').expect(200);
      const r1 = await request(app.getHttpServer()).get(ruta(e1.url)).expect(200);
      expect(r1.headers['content-type']).toBe('application/pdf');
      expect(r1.headers['cache-control']).toMatch(/no-store/);
      expect(r1.body.length).toBe(1000);

      await subir(laura, 'hoja-de-vida', pdf(1500), 'v2.pdf').expect(200);
      await request(app.getHttpServer()).get(ruta(e1.url)).expect(404);
      const { body: e2 } = await laura.get('/perfil/archivos/hoja-de-vida/enlace').expect(200);
      expect((await request(app.getHttpServer()).get(ruta(e2.url)).expect(200)).body.length).toBe(1500);
    });

    it('rechaza una firma alterada o vencida', async () => {
      await subir(laura, 'hoja-de-vida', pdf(), 'cv.pdf').expect(200);
      const { body } = await laura.get('/perfil/archivos/hoja-de-vida/enlace').expect(200);
      await request(app.getHttpServer()).get(ruta(body.url).replace(/firma=./, 'firma=X')).expect(403);
      await request(app.getHttpServer()).get(ruta(body.url).replace(/exp=\d+/, 'exp=1')).expect(403);
    });

    it('la hoja de vida no se puede quitar; sin archivo no hay enlace', async () => {
      await laura.get('/perfil/archivos/hoja-de-vida/enlace').expect(404);
      await subir(laura, 'hoja-de-vida', pdf(), 'cv.pdf').expect(200);
      const res = await laura.delete('/perfil/archivos/hoja-de-vida').expect(400);
      expect(res.body.mensaje).toBe('La hoja de vida se puede reemplazar, pero no quitar.');
    });

    it('un tipo de archivo desconocido → 404', async () => {
      await subir(laura, 'cedula', pdf(), 'c.pdf').expect(404);
    });
  });

  describe('aval (US4)', () => {
    it('el soporte exige aval «Sí» y «No» lo quita', async () => {
      let res = await subir(laura, 'soporte-aval', pdf(), 'aval.pdf').expect(400);
      expect(res.body.errores.archivo).toBe('Primero responde «Sí» a «¿Tienes aval de tu institución?».');
      await laura.put('/perfil/aval').send({ aval: true }).expect(200);
      res = await subir(laura, 'soporte-aval', pdf(), 'aval.pdf').expect(200);
      expect(res.body.archivos.soporteAval).not.toBeNull();
      res = await laura.put('/perfil/aval').send({ aval: false }).expect(200);
      expect(res.body).toMatchObject({ aval: false, archivos: { soporteAval: null } });
    });
  });

  describe('foto (US5)', () => {
    it('acepta PNG, rechaza GIF y nunca cambia el perfil mínimo', async () => {
      const antes = (await laura.get('/perfil').expect(200)).body.perfilMinimo;
      let res = await subir(laura, 'foto', png(), 'yo.png').expect(200);
      expect(res.body.archivos.foto).not.toBeNull();
      expect(res.body.perfilMinimo).toEqual(antes);
      res = await subir(laura, 'foto', gif(), 'yo.gif').expect(400);
      expect(res.body.errores.archivo).toBe('Solo se aceptan fotos JPG o PNG.');
      res = await laura.delete('/perfil/archivos/foto').expect(200);
      expect(res.body.archivos.foto).toBeNull();
      expect(res.body.perfilMinimo).toEqual(antes);
    });

    it('rechaza una foto de más de 2 MB', async () => {
      const grande = Buffer.concat([png(), Buffer.alloc(3 * MB)]);
      const res = await subir(laura, 'foto', grande, 'yo.png').expect(413);
      expect(res.body.errores.archivo).toMatch(/^Pesa 3 MB y el máximo es 2 MB\.$/);
    });
  });
});

