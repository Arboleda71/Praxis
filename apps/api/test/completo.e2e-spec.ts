import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types.js';
import { hash } from '@node-rs/argon2';
import request from './cliente.js';
import { AppModule } from '../src/app.module.js';
import { configurarApp } from '../src/configurar.js';
import { PrismaService } from '../src/prisma.service.js';
import { Intentos } from '../src/auth/intentos.js';
import { Archivos } from '../src/perfil/archivos.js';
import { validarBasePruebas } from './seguridad/base-pruebas.js';

describe('S3, S4 y administración: recorrido con Postgres real', () => {
  let app: INestApplication<App>, db: PrismaService;
  let alumno: ReturnType<typeof request.agent>,
    empresa: ReturnType<typeof request.agent>,
    admin: ReturnType<typeof request.agent>;
  let alumnoId: string,
    empresaId: string,
    postId: string,
    vacanteId: string,
    cvPerfil: string,
    cvCopia: string;
  const clave = 'contrasena-ficticia-segura';
  const registro = {
    contrasena: clave,
    confirmarContrasena: clave,
    autorizaDatos: true,
  };
  beforeAll(async () => {
    app = configurarApp(
      (
        await Test.createTestingModule({ imports: [AppModule] }).compile()
      ).createNestApplication(),
    );
    await app.init();
    db = app.get(PrismaService);
  });
  beforeEach(async () => {
    validarBasePruebas(process.env.DATABASE_URL);
    await db.$executeRawUnsafe('TRUNCATE "Cuenta" CASCADE');
    await db.nitReservado.deleteMany();
    await db.archivoPorBorrar.deleteMany();
    await app.get(Intentos).limpiar();
    alumno = request.agent(app.getHttpServer());
    empresa = request.agent(app.getHttpServer());
    admin = request.agent(app.getHttpServer());
    await alumno
      .post('/auth/registro/estudiante')
      .send({
        ...registro,
        nombreCompleto: 'Estudiante Ficticio',
        correo: 'alumno@example.test',
      })
      .expect(201);
    await empresa
      .post('/auth/registro/empresa')
      .send({
        ...registro,
        razonSocial: 'Empresa Ficticia',
        nit: '900123456-8',
        correo: 'empresa@example.test',
      })
      .expect(201);
    alumnoId = (
      await db.cuenta.findUniqueOrThrow({
        where: { correo: 'alumno@example.test' },
      })
    ).id;
    empresaId = (
      await db.cuenta.findUniqueOrThrow({
        where: { correo: 'empresa@example.test' },
      })
    ).id;
    await db.cuenta.create({
      data: {
        correo: 'admin@example.test',
        rol: 'ADMIN',
        contrasenaHash: await hash(clave),
        autorizacionDatosEn: new Date(),
        correoConfirmadoEn: new Date(),
      },
    });
    await admin
      .post('/auth/login')
      .send({ correo: 'admin@example.test', contrasena: clave })
      .expect(200);
    await db.cuenta.update({
      where: { id: empresaId },
      data: { correoConfirmadoEn: new Date() },
    });
    await alumno
      .put('/perfil/formacion')
      .send({
        nivelFormacion: 'tecnologo',
        programa: 'Desarrollo de software',
        institucion: null,
        avance: null,
      })
      .expect(200);
    await alumno
      .put('/perfil/archivos/hoja-de-vida')
      .attach('archivo', Buffer.from('%PDF-1.4\nPerfil original'), 'perfil.pdf')
      .expect(200);
    cvPerfil = (
      await db.archivoPerfil.findFirstOrThrow({ where: { cuentaId: alumnoId } })
    ).clave;
    const futura = new Date(Date.now() + 30 * 86400000)
      .toISOString()
      .slice(0, 10);
    const v = await empresa
      .post('/empresa/vacantes')
      .send({
        titulo: 'Práctica ficticia',
        descripcion: 'Solo para pruebas',
        modalidad: 'remota',
        ciudad: null,
        duracionMeses: 6,
        fechaInicio: futura,
        vigencia: futura,
        niveles: ['tecnologo'],
        programas: [],
        avances: [],
        aval: false,
        jornada: 'tiempo-completo',
        idiomas: [],
      })
      .expect(201);
    vacanteId = v.body.id;
    await empresa.post(`/empresa/vacantes/${vacanteId}/publicar`).expect(201);
    postId = (
      await alumno.post(`/vacantes/${vacanteId}/postulaciones`).expect(201)
    ).body.id;
    cvCopia = (
      await db.archivoPostulacion.findFirstOrThrow({
        where: { postulacionId: postId },
      })
    ).clave;
  });
  afterAll(async () => {
    await app.close();
  });
  it('el estudiante cambia solo la copia del CV, con historial y notificación', async () => {
    await alumno
      .put(`/postulaciones/${postId}/cv`)
      .attach('archivo', Buffer.from('%PDF-1.4\nCV actualizado'), 'nuevo.pdf')
      .expect(200);
    const p = await db.postulacion.findUniqueOrThrow({
      where: { id: postId },
      include: { archivos: true, historial: true },
    });
    expect(p.cvReemplazadoEn).not.toBeNull();
    expect(p.archivos[0].clave).not.toBe(cvCopia);
    expect(p.historial.at(-1)?.estado).toBe('CV reemplazado');
    expect(
      (
        await db.archivoPerfil.findFirstOrThrow({
          where: { cuentaId: alumnoId },
        })
      ).clave,
    ).toBe(cvPerfil);
    expect(
      await db.notificacion.count({
        where: { cuentaId: empresaId, texto: { contains: 'reemplazó' } },
      }),
    ).toBe(1);
    await empresa
      .put(`/postulaciones/${postId}/cv`)
      .attach('archivo', Buffer.from('%PDF-1.4\nNo'), 'x.pdf')
      .expect(403);
    await alumno
      .put(`/postulaciones/${postId}/cv`)
      .attach('archivo', Buffer.from('no pdf'), 'x.pdf')
      .expect(400);
  });
  it('iniciar revisión bloquea el reemplazo, también en carrera concurrente', async () => {
    const resultados = await Promise.all([
      empresa.post(`/empresa/postulaciones/${postId}/revisar`).send({}),
      alumno
        .put(`/postulaciones/${postId}/cv`)
        .attach('archivo', Buffer.from('%PDF-1.4\nCarrera'), 'cv.pdf'),
    ]);
    expect(resultados[0].status).toBe(200);
    expect([200, 409]).toContain(resultados[1].status);
    expect(
      (await db.postulacion.findUniqueOrThrow({ where: { id: postId } }))
        .estado,
    ).toBe('En revisión');
    await alumno
      .put(`/postulaciones/${postId}/cv`)
      .attach('archivo', Buffer.from('%PDF-1.4\nTarde'), 'cv.pdf')
      .expect(409);
  });
  it('solo admin lista cuentas y no recibe ni puede consultar perfiles o CV', async () => {
    await alumno.get('/admin/cuentas').expect(403);
    const r = await admin
      .get('/admin/cuentas?rol=ESTUDIANTE&q=alumno')
      .expect(200);
    expect(r.body.total).toBe(1);
    expect(r.body.items[0].correo).toBe('alumno@example.test');
    const detalle = await admin.get(`/admin/cuentas/${alumnoId}`).expect(200);
    expect(detalle.body).not.toHaveProperty('estudiante');
    expect(detalle.body).not.toHaveProperty('contrasenaHash');
    await admin.get('/perfil').expect(403);
    await admin.get(`/empresa/postulaciones/${postId}`).expect(403);
    await admin
      .post(`/admin/cuentas/${empresaId}/acceso`)
      .send({ accion: 'revocar', motivo: '' })
      .expect(400);
  });
  it('revocar cierra sesiones, oculta vacantes; restaurar permite entrar sin recuperar sesiones', async () => {
    await admin
      .post(`/admin/cuentas/${empresaId}/acceso`)
      .send({ accion: 'revocar', motivo: 'Requerimiento de prueba ficticio' })
      .expect(200);
    await empresa.get('/auth/sesion').expect(401);
    const login = await empresa
      .post('/auth/login')
      .send({ correo: 'empresa@example.test', contrasena: clave })
      .expect(403);
    expect(JSON.stringify(login.body)).not.toContain('Requerimiento');
    expect((await alumno.get('/vacantes').expect(200)).body.total).toBe(0);
    const otro = request.agent(app.getHttpServer());
    await otro
      .post('/auth/registro/estudiante')
      .send({
        ...registro,
        nombreCompleto: 'Otro Ficticio',
        correo: 'otro@example.test',
      })
      .expect(201);
    await otro.post(`/vacantes/${vacanteId}/postulaciones`).expect(409);
    await admin
      .post(`/admin/cuentas/${empresaId}/acceso`)
      .send({ accion: 'restaurar', motivo: 'Requerimiento resuelto de prueba' })
      .expect(200);
    await empresa.get('/auth/sesion').expect(401);
    await empresa
      .post('/auth/login')
      .send({ correo: 'empresa@example.test', contrasena: clave })
      .expect(200);
    expect((await alumno.get('/vacantes').expect(200)).body.total).toBe(1);
    expect(
      await db.historialAcceso.count({ where: { cuentaId: empresaId } }),
    ).toBe(2);
  });
  it('supresión requiere contraseña y consentimiento; anonimiza copias y retira candidaturas', async () => {
    await alumno
      .post('/cuenta/supresion')
      .send({ contrasena: 'incorrecta', entiende: true })
      .expect(401);
    await alumno
      .post('/cuenta/supresion')
      .send({ contrasena: clave, entiende: false })
      .expect(400);
    await alumno
      .post('/cuenta/supresion')
      .send({ contrasena: clave, entiende: true })
      .expect(200);
    await alumno.get('/auth/sesion').expect(401);
    const cuenta = await db.cuenta.findUniqueOrThrow({
      where: { id: alumnoId },
    });
    expect(cuenta.eliminadaEn).not.toBeNull();
    expect(cuenta.correo).not.toContain('alumno@');
    const p = await db.postulacion.findUniqueOrThrow({
      where: { id: postId },
      include: { archivos: true, historial: true },
    });
    expect(p.estado).toBe('Retirada');
    expect(JSON.stringify(p.perfil)).not.toContain('Ficticio');
    expect(p.archivos).toHaveLength(0);
    expect(
      await db.archivoPerfil.count({ where: { cuentaId: alumnoId } }),
    ).toBe(0);
    const viejo = await app.get(Archivos).enlace(cvCopia);
    const u = new URL(viejo.url, 'http://localhost');
    await request(app.getHttpServer())
      .get(u.pathname.replace('/api', '') + u.search)
      .expect(404);
    await admin
      .post(`/admin/cuentas/${alumnoId}/acceso`)
      .send({
        accion: 'restaurar',
        motivo: 'No debe restaurar una cuenta eliminada',
      })
      .expect(409);
  });
  it('supresión de empresa cierra sin borrar vacantes y reserva la huella de su NIT', async () => {
    await empresa
      .post('/cuenta/supresion')
      .send({ contrasena: clave, entiende: true })
      .expect(200);
    const e = await db.empresa.findUniqueOrThrow({
      where: { cuentaId: empresaId },
    });
    expect(e.nit).not.toBe('900123456');
    expect(e.razonSocial).toBe('Empresa que eliminó su cuenta');
    const v = await db.vacante.findUniqueOrThrow({ where: { id: vacanteId } });
    expect(v.estado).toBe('Cerrada');
    expect(v.motivoCierre).toBe('cuenta eliminada');
    const nuevo = request.agent(app.getHttpServer());
    await nuevo
      .post('/auth/registro/empresa')
      .send({
        ...registro,
        razonSocial: 'Empresa Repetida',
        nit: '900123456-8',
        correo: 'nueva@example.test',
      })
      .expect(409);
    expect(await db.nitReservado.count()).toBe(1);
  });
  it('fallo del almacenamiento no revierte la supresión; el borrado pendiente sobrevive para reintentarse', async () => {
    const archivos = app.get(Archivos),
      anterior = archivos.borrar.bind(archivos);
    archivos.borrar = async () => {
      throw new Error('Proveedor de pruebas no disponible');
    };
    try {
      const r = await alumno
        .post('/cuenta/supresion')
        .send({ contrasena: clave, entiende: true })
        .expect(200);
      expect(r.body.archivosPendientes).toBe(true);
      expect(await db.archivoPorBorrar.count()).toBeGreaterThan(0);
      await alumno.get('/auth/sesion').expect(401);
    } finally {
      archivos.borrar = anterior;
    }
  });
  it('solo la empresa cambia su logo y se sirve con un enlace temporal', async () => {
    const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
    await alumno
      .put('/empresa/logo')
      .attach('archivo', png, 'logo.png')
      .expect(403);
    await empresa
      .put('/empresa/logo')
      .attach('archivo', Buffer.from('invalido'), 'logo.png')
      .expect(400);
    await empresa
      .put('/empresa/logo')
      .attach('archivo', png, 'logo.png')
      .expect(200);
    const ficha = (await empresa.get('/empresa/perfil').expect(200)).body;
    expect(ficha.logoUrl).toContain('firma=');
    expect(ficha).not.toHaveProperty('logoClave');
    const v = (await alumno.get(`/vacantes/${vacanteId}`).expect(200)).body;
    expect(v.empresa.logoUrl).toContain('firma=');
    expect(v.empresa).not.toHaveProperty('logoClave');
    await empresa.delete('/empresa/logo').expect(204);
    expect(
      (await empresa.get('/empresa/perfil').expect(200)).body.logoUrl,
    ).toBeNull();
  });
});
