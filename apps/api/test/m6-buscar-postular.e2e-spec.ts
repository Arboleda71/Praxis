import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types.js';
import request from './cliente.js';
import { AppModule } from '../src/app.module.js';
import { configurarApp } from '../src/configurar.js';
import { Intentos } from '../src/auth/intentos.js';
import { PrismaService } from '../src/prisma.service.js';
import { validarBasePruebas } from './seguridad/base-pruebas.js';

/**
 * M6 · Buscar, comprobar y postular. Una prueba por regla de cada tarea del módulo:
 * T1 visitante, T2 búsqueda, T3 detalle y comprobación, T4 postulación.
 */
describe('M6: buscar, comprobar y postular', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let empresa: ReturnType<typeof request.agent>;
  let estudiante: ReturnType<typeof request.agent>;
  let empresaId: string;
  const cuenta = {
    contrasena: 'contrasena-segura',
    confirmarContrasena: 'contrasena-segura',
    autorizaDatos: true,
  };
  const futuro = (dias: number) =>
    new Date(Date.now() + dias * 86400000).toISOString().slice(0, 10);
  const datos = (cambios: object = {}) => ({
    titulo: 'Práctica de software',
    descripcion: 'Oferta académica ficticia',
    modalidad: 'remota',
    ciudad: null,
    duracionMeses: 6,
    fechaInicio: futuro(60),
    vigencia: futuro(30),
    niveles: ['tecnologo'],
    programas: ['Tecnología en desarrollo de software'],
    avances: [],
    aval: false,
    jornada: 'tiempo-completo',
    idiomas: [],
    ...cambios,
  });
  let n = 0;
  /**
   * Inserta una vacante abierta directamente en la base: la publicación (cupos, correo, NIT) ya la prueba
   * M5 y aquí solo importa lo que ve el estudiante. `publicadaEn` creciente fija el orden de los listados.
   */
  async function abierta(cambios: object = {}, estado = 'Abierta') {
    const d = datos(cambios) as ReturnType<typeof datos> & {
      fechaInicio: string;
      vigencia: string;
    };
    const v = await prisma.vacante.create({
      data: {
        ...d,
        empresaId,
        fechaInicio: new Date(d.fechaInicio),
        vigencia: new Date(d.vigencia),
        estado,
        publicadaEn: estado === 'Borrador' ? null : new Date(Date.UTC(2026, 0, 1) + n++ * 60_000),
        cupoTipo: 'gratis',
        cupoPeriodo: new Date(Date.UTC(2026, 0, 1)),
      },
    });
    return v.id;
  }
  async function perfilMinimo(nivelFormacion = 'tecnologo') {
    await estudiante
      .put('/perfil/formacion')
      .send({ nivelFormacion, programa: 'Programa libre', avance: null, institucion: null })
      .expect(200);
    await estudiante
      .put('/perfil/archivos/hoja-de-vida')
      .attach('archivo', Buffer.from('%PDF-1.4\nFicticio'), 'cv.pdf')
      .expect(200);
  }
  const buscar = (q: Record<string, string | number> = {}) =>
    estudiante
      .get('/vacantes')
      .query(q)
      .expect(200)
      .then((r) => r.body as { items: { id: string; titulo: string }[]; total: number; pagina: number });

  beforeAll(async () => {
    app = configurarApp(
      (await Test.createTestingModule({ imports: [AppModule] }).compile()).createNestApplication(),
    );
    await app.init();
    prisma = app.get(PrismaService);
  });
  beforeEach(async () => {
    validarBasePruebas(process.env.DATABASE_URL);
    await prisma.$executeRawUnsafe('TRUNCATE "Cuenta" CASCADE');
    await app.get(Intentos).limpiar();
    empresa = request.agent(app.getHttpServer());
    estudiante = request.agent(app.getHttpServer());
    await empresa
      .post('/auth/registro/empresa')
      .send({ ...cuenta, razonSocial: 'Empresa Ficticia', correo: 'empresa@example.test', nit: '900123456-8' })
      .expect(201);
    await estudiante
      .post('/auth/registro/estudiante')
      .send({ ...cuenta, nombreCompleto: 'Persona Ficticia', correo: 'persona@example.test' })
      .expect(201);
    empresaId = (await prisma.cuenta.findFirstOrThrow({ where: { rol: 'EMPRESA' } })).id;
    await prisma.empresa.update({
      where: { cuentaId: empresaId },
      data: { plan: 'basico', planInicioEn: new Date(), planVenceEn: new Date(Date.now() + 86400000), sector: 'tecnologia' },
    });
  });
  afterAll(async () => {
    await app.close();
  });

  describe('T1 · visitante: últimas cinco prácticas', () => {
    it('sin sesión ve solo las cinco abiertas más recientes, sin borradores, cerradas ni vencidas', async () => {
      await abierta({ titulo: 'Borrador' }, 'Borrador');
      await abierta({ titulo: 'Cerrada' }, 'Cerrada');
      for (let i = 1; i <= 6; i++) await abierta({ titulo: `Abierta ${i}` });
      const vencida = await abierta({ titulo: 'Vencida' });
      await prisma.vacante.update({ where: { id: vencida }, data: { vigencia: new Date(0) } });

      const r = await request(app.getHttpServer()).get('/vacantes/recientes').expect(200);
      expect(r.body.map((v: { titulo: string }) => v.titulo)).toEqual([
        'Abierta 6',
        'Abierta 5',
        'Abierta 4',
        'Abierta 3',
        'Abierta 2',
      ]);
    });

    it('solo entrega datos básicos: nada de requisitos, descripción, NIT ni plan', async () => {
      await abierta();
      const [v] = (await request(app.getHttpServer()).get('/vacantes/recientes').expect(200)).body;
      expect(Object.keys(v).sort()).toEqual(['ciudad', 'empresa', 'id', 'modalidad', 'titulo', 'vigencia']);
      expect(v.empresa).toEqual({ razonSocial: 'Empresa Ficticia' });
    });

    it('el visitante no puede buscar ni abrir el detalle', async () => {
      const id = await abierta();
      await request(app.getHttpServer()).get('/vacantes').expect(401);
      await request(app.getHttpServer()).get(`/vacantes/${id}`).expect(401);
      await request(app.getHttpServer()).post(`/vacantes/${id}/postulaciones`).expect(401);
    });
  });

  describe('T2 · búsqueda del estudiante', () => {
    it('busca por título sin distinguir mayúsculas y solo entre las abiertas', async () => {
      await abierta({ titulo: 'Practicante de Sistemas' });
      await abierta({ titulo: 'Practicante de Contabilidad' });
      await abierta({ titulo: 'Sistemas en borrador' }, 'Borrador');
      await abierta({ titulo: 'Sistemas cerrada' }, 'Cerrada');
      const r = await buscar({ q: 'sistemas' });
      expect(r.items.map((v) => v.titulo)).toEqual(['Practicante de Sistemas']);
      expect(r.total).toBe(1);
    });

    it('filtra por nivel aceptado, por modalidad y por ciudad; los filtros se combinan', async () => {
      await abierta({ titulo: 'Tecnólogo remota', niveles: ['tecnologo'] });
      await abierta({ titulo: 'Universitario presencial Bello', niveles: ['universitario'], modalidad: 'presencial', ciudad: 'Bello' });
      await abierta({ titulo: 'Ambos híbrida Medellín', niveles: ['tecnologo', 'universitario'], modalidad: 'hibrida', ciudad: 'Medellín' });
      const titulos = async (q: Record<string, string>) => (await buscar(q)).items.map((v) => v.titulo).sort();

      expect(await titulos({ nivel: 'universitario' })).toEqual(['Ambos híbrida Medellín', 'Universitario presencial Bello']);
      expect(await titulos({ modalidad: 'presencial' })).toEqual(['Universitario presencial Bello']);
      expect(await titulos({ ciudad: 'bello' })).toEqual(['Universitario presencial Bello']);
      expect(await titulos({ nivel: 'tecnologo', modalidad: 'hibrida' })).toEqual(['Ambos híbrida Medellín']);
      expect(await titulos({ nivel: 'tecnico' })).toEqual([]);
    });

    it('la ciudad es ubicación de la práctica, no un requisito: no aparece en la comprobación', async () => {
      const id = await abierta({ modalidad: 'presencial', ciudad: 'Bello' });
      await perfilMinimo();
      const d = await estudiante.get(`/vacantes/${id}`).expect(200);
      expect(d.body.evaluacion.requisitos.map((r: { requisito: string }) => r.requisito).join(' ')).not.toMatch(/ciudad|Bello/i);
      expect(d.body.evaluacion.puedePostular).toBe(true);
    });

    it('pagina de a 20 y conserva el total', async () => {
      for (let i = 1; i <= 21; i++) await abierta({ titulo: `Oferta ${String(i).padStart(2, '0')}` });
      const p1 = await buscar({ pagina: 1 });
      const p2 = await buscar({ pagina: 2 });
      expect(p1.items).toHaveLength(20);
      expect(p2.items).toHaveLength(1);
      expect([p1.total, p2.total, p2.pagina]).toEqual([21, 21, 2]);
      // Sin repetidos ni huecos entre páginas.
      expect(new Set([...p1.items, ...p2.items].map((v) => v.id)).size).toBe(21);
      expect(p2.items[0].titulo).toBe('Oferta 01');
    });

    it('rechaza filtros fuera del catálogo o parámetros desconocidos en lugar de ignorarlos', async () => {
      for (const q of [{ nivel: 'doctorado' }, { modalidad: 'teletrabajo' }, { pagina: 0 }, { orden: 'titulo' }, { q: 'x'.repeat(121) }])
        await estudiante.get('/vacantes').query(q).expect(400);
    });

    it('un texto con comodines de SQL se busca tal cual', async () => {
      await abierta({ titulo: 'Practicante 100% remoto' });
      await abierta({ titulo: 'Practicante presencial' });
      expect((await buscar({ q: '%' })).items.map((v) => v.titulo)).toEqual(['Practicante 100% remoto']);
      expect((await buscar({ q: 'Practicante_' })).total).toBe(0);
      expect((await buscar({ q: '\\' })).total).toBe(0);
      expect((await buscar({ q: "' OR 1=1 --" })).total).toBe(0);
    });

    it('la empresa no busca vacantes ni abre el detalle de estudiante', async () => {
      const id = await abierta();
      await empresa.get('/vacantes').expect(403);
      await empresa.get(`/vacantes/${id}`).expect(403);
    });
  });

  describe('T3 · detalle y comprobación de requisitos', () => {
    it('evalúa cada requisito por separado con nombres del catálogo y sin puntajes', async () => {
      const id = await abierta({
        niveles: ['tecnologo', 'universitario'],
        avances: [{ nivel: 'tecnologo', avance: 'productiva' }],
        aval: true,
        idiomas: [{ idioma: 'ingles', nivel: 'b1' }],
      });
      await perfilMinimo();
      const { body } = await estudiante.get(`/vacantes/${id}`).expect(200);
      expect(body.evaluacion.requisitos).toEqual([
        { requisito: 'Nivel de formación', excluyente: true, resultado: 'cumple' },
        { requisito: 'Avance tecnólogo: Productiva', excluyente: false, resultado: 'falta_informacion' },
        { requisito: 'Aval declarado', excluyente: false, resultado: 'falta_informacion' },
        { requisito: 'Jornada: Tiempo completo', excluyente: false, resultado: 'falta_informacion' },
        { requisito: 'Disponibilidad para la fecha de inicio', excluyente: false, resultado: 'falta_informacion' },
        { requisito: 'Idioma Inglés: B1 · Intermedio', excluyente: false, resultado: 'falta_informacion' },
      ]);
      expect(JSON.stringify(body.evaluacion)).not.toMatch(/puntaje|porcentaje|score/i);
    });

    it('el programa no tiene estado automático: se muestran los dos y decide la empresa', async () => {
      const id = await abierta();
      await perfilMinimo();
      const { body } = await estudiante.get(`/vacantes/${id}`).expect(200);
      expect(body.evaluacion.programas).toEqual({
        solicitados: ['Tecnología en desarrollo de software'],
        declarado: 'Programa libre',
        etiqueta: 'La empresa revisa la afinidad',
      });
      expect(body.evaluacion.requisitos.some((r: { requisito: string }) => /programa/i.test(r.requisito))).toBe(false);
    });

    it('solo el nivel excluye; los deseables que no se cumplen no bloquean', async () => {
      const id = await abierta({ aval: true, jornada: 'medio-tiempo', idiomas: [{ idioma: 'ingles', nivel: 'c2' }] });
      await perfilMinimo();
      await estudiante
        .put('/perfil/aval')
        .send({ aval: false })
        .then((r) => expect([200, 204]).toContain(r.status));
      const ok = (await estudiante.get(`/vacantes/${id}`).expect(200)).body.evaluacion;
      expect(ok.puedePostular).toBe(true);

      await perfilMinimo('universitario');
      const no = (await estudiante.get(`/vacantes/${id}`).expect(200)).body.evaluacion;
      expect(no.requisitos[0]).toEqual({ requisito: 'Nivel de formación', excluyente: true, resultado: 'no_cumple' });
      expect(no.puedePostular).toBe(false);
    });

    it('sin perfil mínimo (nivel, programa y CV) no puede postularse y se dice qué falta', async () => {
      const id = await abierta();
      const { body } = await estudiante.get(`/vacantes/${id}`).expect(200);
      expect(body.evaluacion.perfilMinimo.completo).toBe(false);
      expect(body.evaluacion.puedePostular).toBe(false);
      expect(body.evaluacion.requisitos[0].resultado).toBe('falta_informacion');
    });

    it('un borrador o un id inexistente no se puede abrir; una cerrada sí, para consulta', async () => {
      const borrador = await abierta({}, 'Borrador');
      const cerrada = await abierta({}, 'Cerrada');
      await estudiante.get(`/vacantes/${borrador}`).expect(404);
      await estudiante.get('/vacantes/00000000-0000-4000-8000-000000000000').expect(404);
      await estudiante.get('/vacantes/no-es-un-id').expect(400);
      expect((await estudiante.get(`/vacantes/${cerrada}`).expect(200)).body.estado).toBe('Cerrada');
    });

    it('solo expone datos declarados de la empresa: ni NIT, ni plan, ni cupos de la vacante', async () => {
      const id = await abierta();
      const { body } = await estudiante.get(`/vacantes/${id}`).expect(200);
      expect(Object.keys(body.empresa).sort()).toEqual(
        ['ciudad', 'correoContacto', 'descripcion', 'logoUrl', 'razonSocial', 'sitioWeb', 'telefono'].sort(),
      );
      const texto = JSON.stringify(body);
      for (const privado of ['900123456', 'nit', 'basico', 'planVenceEn', 'cupoTipo', 'cupoPeriodo', 'empresaId', 'cuentaId'])
        expect(texto).not.toContain(privado);
    });
  });

  describe('T4 · postular', () => {
    it('crea la postulación Enviada con su copia y el detalle pasa a «ya te postulaste»', async () => {
      const id = await abierta();
      await perfilMinimo();
      const r = await estudiante.post(`/vacantes/${id}/postulaciones`).expect(201);
      const { body } = await estudiante.get(`/vacantes/${id}`).expect(200);
      expect(body['postulación']).toEqual({ id: r.body.id, estado: 'Enviada' });
      const copia = await prisma.postulacion.findUniqueOrThrow({ where: { id: r.body.id }, include: { archivos: true } });
      expect(copia.archivos.map((a) => a.tipo)).toEqual(['HOJA_DE_VIDA']);
    });

    it('no admite cuerpo extra en la petición de postular', async () => {
      const id = await abierta();
      await perfilMinimo();
      await estudiante.post(`/vacantes/${id}/postulaciones`).send({ estado: 'Seleccionada' }).expect(400);
    });

    it('una vacante cerrada, vencida o en borrador no recibe postulaciones', async () => {
      await perfilMinimo();
      const cerrada = await abierta({}, 'Cerrada');
      const borrador = await abierta({}, 'Borrador');
      const vencida = await abierta();
      await prisma.vacante.update({ where: { id: vencida }, data: { vigencia: new Date(0) } });
      for (const id of [cerrada, borrador, vencida]) {
        const r = await estudiante.post(`/vacantes/${id}/postulaciones`).expect(409);
        expect(r.body.mensaje).toBe('Esta vacante ya no recibe postulaciones.');
      }
      expect(await prisma.postulacion.count()).toBe(0);
    });

    it('explica por qué no puede postularse: perfil incompleto o nivel no aceptado', async () => {
      const id = await abierta();
      const sinPerfil = await estudiante.post(`/vacantes/${id}/postulaciones`).expect(409);
      expect(sinPerfil.body.mensaje).toBe('Completa nivel de formación, programa y hoja de vida antes de postularte.');
      await perfilMinimo('universitario');
      const nivel = await estudiante.post(`/vacantes/${id}/postulaciones`).expect(409);
      expect(nivel.body.mensaje).toBe('Tu nivel de formación no está entre los aceptados.');
    });

    it('una sola postulación por vacante, aunque se retire', async () => {
      const id = await abierta();
      await perfilMinimo();
      const r = await estudiante.post(`/vacantes/${id}/postulaciones`).expect(201);
      await estudiante.post(`/vacantes/${id}/postulaciones`).expect(409);
      await estudiante.post(`/postulaciones/${r.body.id}/retirar`).expect(200);
      const otra = await estudiante.post(`/vacantes/${id}/postulaciones`).expect(409);
      expect(otra.body.mensaje).toBe('Ya te postulaste a esta vacante, aunque hayas retirado tu postulación.');
      expect(await prisma.postulacion.count()).toBe(1);
    });
  });
});
