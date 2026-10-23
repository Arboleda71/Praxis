import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types.js';
import request from './cliente.js';
import { AppModule } from '../src/app.module.js';
import { configurarApp } from '../src/configurar.js';
import { Intentos } from '../src/auth/intentos.js';
import { PrismaService } from '../src/prisma.service.js';
import { validarBasePruebas } from './seguridad/base-pruebas.js';

describe('M4: propiedad de la ficha de empresa', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const base = { correo: 'empresa@example.test', contrasena: 'contrasena-segura', confirmarContrasena: 'contrasena-segura', autorizaDatos: true };
  beforeAll(async () => { app = configurarApp((await Test.createTestingModule({ imports: [AppModule] }).compile()).createNestApplication()); await app.init(); prisma = app.get(PrismaService); });
  beforeEach(async () => { validarBasePruebas(process.env.DATABASE_URL); await prisma.$executeRawUnsafe('TRUNCATE "Cuenta" CASCADE'); app.get(Intentos).limpiar(); });
  afterAll(async () => { await app.close(); });
  it('solo una empresa accede: 401 y 403 para los demás', async () => {
    await request(app.getHttpServer()).get('/empresa/perfil').expect(401);
    const e = request.agent(app.getHttpServer());
    await e.post('/auth/registro/estudiante').send({ ...base, nombreCompleto: 'Estudiante Ficticio' }).expect(201);
    await e.get('/empresa/perfil').expect(403);
  });
  it('guarda su ficha, valida NIT y muestra la habilitación declarada', async () => {
    const e = request.agent(app.getHttpServer());
    await e.post('/auth/registro/empresa').send({ ...base, razonSocial: 'Empresa Ficticia', nit: '900123456-8' }).expect(201);
    await e.put('/empresa/perfil').send({ razonSocial: 'Empresa Ficticia', nit: '900123456-7', sector: 'tecnologia', ciudad: null, sitioWeb: null, descripcion: null, correoContacto: null, telefono: null }).expect(400);
    const r = await e.put('/empresa/perfil').send({ razonSocial: 'Empresa Ficticia', nit: '900123456-8', sector: 'tecnologia', ciudad: 'Medellín', sitioWeb: 'https://example.test', descripcion: 'Prácticas', correoContacto: 'contacto@example.test', telefono: '+57 300 000 0000' }).expect(200);
    expect(r.body).toMatchObject({ sector: 'tecnologia', puedePublicar: false, nitValido: true, declaracion: 'Datos declarados por la empresa' });
    await prisma.cuenta.updateMany({ data: { correoConfirmadoEn: new Date() } });
    expect((await e.get('/empresa/perfil').expect(200)).body.puedePublicar).toBe(true);
  });
});
