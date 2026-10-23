import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types.js';
import request from './cliente.js';
import { AppModule } from '../src/app.module.js';
import { configurarApp } from '../src/configurar.js';
import { Intentos } from '../src/auth/intentos.js';
import { PrismaService } from '../src/prisma.service.js';
import { validarBasePruebas } from './seguridad/base-pruebas.js';
import { digitoVerificacion } from '@praxis/contracts';

describe('M5: publicación y postulación reales', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let empresa: ReturnType<typeof request.agent>;
  let estudiante: ReturnType<typeof request.agent>;
  const cuenta = {
    contrasena: 'contrasena-segura',
    confirmarContrasena: 'contrasena-segura',
    autorizaDatos: true,
  };
  const futuro = (dias: number) =>
    new Date(Date.now() + dias * 86400000).toISOString().slice(0, 10);
  const vacante = () => ({
    titulo: 'Práctica de software',
    descripcion: 'Oferta académica ficticia',
    modalidad: 'remota',
    ciudad: null,
    duracionMeses: 6,
    fechaInicio: futuro(60),
    vigencia: futuro(30),
    niveles: ['tecnologo'],
    programas: [],
    avances: [],
    aval: true,
    jornada: 'tiempo-completo',
    idiomas: [],
  });
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
    empresa = request.agent(app.getHttpServer());
    estudiante = request.agent(app.getHttpServer());
    await empresa
      .post('/auth/registro/empresa')
      .send({
        ...cuenta,
        razonSocial: 'Empresa Ficticia',
        correo: 'empresa@example.test',
        nit: '900123456-8',
      })
      .expect(201);
    await estudiante
      .post('/auth/registro/estudiante')
      .send({
        ...cuenta,
        nombreCompleto: 'Persona Ficticia',
        correo: 'persona@example.test',
      })
      .expect(201);
  });
  afterAll(async () => {
    await app.close();
  });
  async function publicar() {
    await prisma.cuenta.updateMany({
      where: { rol: 'EMPRESA' },
      data: { correoConfirmadoEn: new Date() },
    });
    const r = await empresa
      .post('/empresa/vacantes')
      .send(vacante())
      .expect(201);
    await empresa.post(`/empresa/vacantes/${r.body.id}/publicar`).expect(201);
    return r.body.id as string;
  }
  it('sin confirmar no publica; el estudiante no crea vacantes', async () => {
    await estudiante.post('/empresa/vacantes').send(vacante()).expect(403);
    const r = await empresa
      .post('/empresa/vacantes')
      .send(vacante())
      .expect(201);
    await empresa.post(`/empresa/vacantes/${r.body.id}/publicar`).expect(409);
  });
  it('tres publicaciones simultáneas consumen exactamente los dos cupos', async () => {
    await prisma.cuenta.updateMany({
      data: { correoConfirmadoEn: new Date() },
    });
    const ids = [];
    for (let n = 0; n < 3; n++)
      ids.push(
        (await empresa.post('/empresa/vacantes').send(vacante()).expect(201))
          .body.id as string,
      );
    const estados = await Promise.all(
      ids.map((id) =>
        empresa.post(`/empresa/vacantes/${id}/publicar`).then((r) => r.status),
      ),
    );
    expect(estados.filter((s) => s === 201)).toHaveLength(2);
    expect(estados.filter((s) => s === 409)).toHaveLength(1);
  });
  it('perfil mínimo, nivel, unicidad y copia del CV', async () => {
    const id = await publicar();
    await estudiante.post(`/vacantes/${id}/postulaciones`).expect(409);
    await estudiante
      .put('/perfil/formacion')
      .send({
        nivelFormacion: 'universitario',
        programa: 'Otro programa',
        avance: null,
        institucion: null,
      })
      .expect(200);
    await estudiante
      .put('/perfil/archivos/hoja-de-vida')
      .attach('archivo', Buffer.from('%PDF-1.4\nFicticio'), 'cv.pdf')
      .expect(200);
    await estudiante.post(`/vacantes/${id}/postulaciones`).expect(409);
    await estudiante
      .put('/perfil/formacion')
      .send({
        nivelFormacion: 'tecnologo',
        programa: 'Programa libre',
        avance: null,
        institucion: null,
      })
      .expect(200);
    const estados = await Promise.all(
      [1, 2].map(() =>
        estudiante.post(`/vacantes/${id}/postulaciones`).then((r) => r.status),
      ),
    );
    expect(estados.sort((a, b) => a - b)).toEqual([201, 409]);
    const lista = await estudiante.get('/postulaciones').expect(200);
    expect(lista.body.items).toHaveLength(1);
    const propia = lista.body.items[0];
    const detalle = await empresa
      .get(`/empresa/postulaciones/${propia.id}`)
      .expect(200);
    expect(detalle.body.perfil.programa).toBe('Programa libre');
    await estudiante
      .put('/perfil/archivos/hoja-de-vida')
      .attach('archivo', Buffer.from('%PDF-1.4\nReemplazo'), 'nuevo.pdf')
      .expect(200);
    const enlace = await empresa
      .get(`/empresa/postulaciones/${propia.id}/archivos/hoja-de-vida`)
      .expect(200);
    const archivo = await request(app.getHttpServer())
      .get(enlace.body.url.replace(/^\/api/, ''))
      .expect(200);
    expect(archivo.body.toString()).toContain('Ficticio');
  });
  it('requisitos inmutables, cierre irreversible y acceso por rol', async () => {
    const id = await publicar();
    await empresa
      .put(`/empresa/vacantes/${id}`)
      .send({ ...vacante(), niveles: ['universitario'] })
      .expect(409);
    await empresa
      .put(`/empresa/vacantes/${id}`)
      .send({ descripcion: 'Descripción actualizada de la práctica' })
      .expect(200);
    await empresa.delete(`/empresa/vacantes/${id}`).expect(409);
    await empresa.get('/vacantes').expect(403);
    await request(app.getHttpServer()).get('/vacantes').expect(401);
    await empresa.post(`/empresa/vacantes/${id}/cerrar`).expect(201);
    await empresa.post(`/empresa/vacantes/${id}/publicar`).expect(409);
    await estudiante.post(`/vacantes/${id}/postulaciones`).expect(409);
  });
  it('cada cambio agrega historial y notificación; retirada no permite volver a postular', async () => {
    const id = await publicar();
    await estudiante
      .put('/perfil/formacion')
      .send({
        nivelFormacion: 'tecnologo',
        programa: 'Programa libre',
        avance: null,
        institucion: null,
      })
      .expect(200);
    await estudiante
      .put('/perfil/archivos/hoja-de-vida')
      .attach('archivo', Buffer.from('%PDF-1.4\nFicticio'), 'cv.pdf')
      .expect(200);
    const r = await estudiante
      .post(`/vacantes/${id}/postulaciones`)
      .expect(201);
    await empresa
      .post(`/empresa/postulaciones/${r.body.id}/estado`)
      .send({ estado: 'En revisión' })
      .expect(200);
    await estudiante.post(`/postulaciones/${r.body.id}/retirar`).expect(200);
    await empresa
      .post(`/empresa/postulaciones/${r.body.id}/estado`)
      .send({ estado: 'Entrevista' })
      .expect(409);
    await estudiante.post(`/vacantes/${id}/postulaciones`).expect(409);
    const lista = await estudiante.get('/postulaciones').expect(200);
    expect(
      lista.body.items[0].historial.map((h: { estado: string }) => h.estado),
    ).toEqual(['Enviada', 'En revisión', 'Retirada']);
    const avisos = await estudiante.get('/notificaciones').expect(200);
    expect(avisos.body.total).toBe(3);
    await estudiante
      .post(`/notificaciones/${avisos.body.items[0].id}/leer`)
      .expect(204);
  });
  it('otra empresa no accede al perfil, archivos, estado ni notificaciones del candidato', async () => {
    const id = await publicar();
    await estudiante
      .put('/perfil/formacion')
      .send({
        nivelFormacion: 'tecnologo',
        programa: 'Programa libre',
        avance: null,
        institucion: null,
      })
      .expect(200);
    await estudiante
      .put('/perfil/archivos/hoja-de-vida')
      .attach('archivo', Buffer.from('%PDF-1.4\nFicticio'), 'cv.pdf')
      .expect(200);
    const p = await estudiante
      .post(`/vacantes/${id}/postulaciones`)
      .expect(201);
    const otra = request.agent(app.getHttpServer());
    await otra
      .post('/auth/registro/empresa')
      .send({
        ...cuenta,
        razonSocial: 'Otra Ficticia',
        correo: 'otra@example.test',
        nit: `900123457-${digitoVerificacion('900123457')}`,
      })
      .expect(201);
    await otra.get(`/empresa/postulaciones/${p.body.id}`).expect(404);
    await otra
      .get(`/empresa/postulaciones/${p.body.id}/archivos/hoja-de-vida`)
      .expect(404);
    await otra
      .post(`/empresa/postulaciones/${p.body.id}/estado`)
      .send({ estado: 'En revisión' })
      .expect(404);
    await otra.get(`/empresa/vacantes/${id}`).expect(404);
    const n = await estudiante.get('/notificaciones').expect(200);
    await otra.post(`/notificaciones/${n.body.items[0].id}/leer`).expect(404);
  });
  it('el vencimiento cierra la vacante sin borrar su historial', async () => {
    const id = await publicar();
    await prisma.vacante.update({
      where: { id },
      data: { vigencia: new Date(0) },
    });
    const lista = await estudiante.get('/vacantes').expect(200);
    expect(lista.body.items).toHaveLength(0);
    const propia = await empresa.get(`/empresa/vacantes/${id}`).expect(200);
    expect(propia.body.estado).toBe('Cerrada');
    expect(propia.body.motivoCierre).toBe('venció');
  });
});
