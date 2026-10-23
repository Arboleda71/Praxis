import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types.js';
import { hash } from '@node-rs/argon2';
import { randomUUID } from 'node:crypto';
import { digitoVerificacion } from '@praxis/contracts';
import request from './cliente.js';
import { AppModule } from '../src/app.module.js';
import { configurarApp } from '../src/configurar.js';
import { PrismaService } from '../src/prisma.service.js';
import { validarBasePruebas } from './seguridad/base-pruebas.js';

describe('Escala local del piloto: datos exclusivamente ficticios', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  beforeAll(async () => {
    app = configurarApp(
      (
        await Test.createTestingModule({ imports: [AppModule] }).compile()
      ).createNestApplication(),
    );
    await app.init();
    prisma = app.get(PrismaService);
  });
  afterAll(async () => {
    await app.close();
  });
  it('pagina y busca con 10.000 estudiantes, 500 empresas y 1.000 vacantes con p95 menor a 500 ms', async () => {
    validarBasePruebas(process.env.DATABASE_URL);
    await prisma.$executeRawUnsafe('TRUNCATE "Cuenta" CASCADE');
    const contrasenaHash = await hash('contrasena-ficticia-de-pruebas');
    const autorizacionDatosEn = new Date();
    const alumnos = Array.from({ length: 9999 }, (_, n) => ({
      id: randomUUID(),
      correo: `alumno-${n}@example.test`,
      rol: 'ESTUDIANTE' as const,
      contrasenaHash,
      autorizacionDatosEn,
    }));
    const empresas = Array.from({ length: 500 }, (_, n) => ({
      id: randomUUID(),
      correo: `empresa-${n}@example.test`,
      rol: 'EMPRESA' as const,
      contrasenaHash,
      autorizacionDatosEn,
    }));
    await prisma.cuenta.createMany({ data: [...alumnos, ...empresas] });
    await prisma.estudiante.createMany({
      data: alumnos.map((a) => ({
        cuentaId: a.id,
        nombreCompleto: 'Estudiante Ficticio',
      })),
    });
    await prisma.empresa.createMany({
      data: empresas.map((e, n) => ({
        cuentaId: e.id,
        razonSocial: 'Empresa Ficticia',
        nit: String(811000000 + n),
        dv: digitoVerificacion(String(811000000 + n)),
      })),
    });
    const dia = (n: number) => new Date(Date.now() + n * 86400000);
    await prisma.vacante.createMany({
      data: empresas.flatMap((e) =>
        [1, 2].map((n) => ({
          empresaId: e.id,
          titulo: `Práctica de software ${n}`,
          descripcion: 'Práctica ficticia para medición local del piloto',
          modalidad: 'remota',
          duracionMeses: 6,
          fechaInicio: dia(60),
          vigencia: dia(30),
          niveles: ['tecnologo'],
          programas: [],
          avances: [],
          aval: false,
          jornada: 'tiempo-completo',
          idiomas: [],
          estado: 'Abierta',
          publicadaEn: new Date(),
        })),
      ),
    });
    const agente = request.agent(app.getHttpServer());
    await agente
      .post('/auth/registro/estudiante')
      .send({
        nombreCompleto: 'Cliente de Prueba',
        correo: 'cliente@example.test',
        contrasena: 'contrasena-ficticia-de-pruebas',
        confirmarContrasena: 'contrasena-ficticia-de-pruebas',
        autorizaDatos: true,
      })
      .expect(201);
    const muestras: number[] = [];
    for (let n = 0; n < 30; n++) {
      const inicio = performance.now();
      const r = await agente
        .get('/vacantes?q=software&nivel=tecnologo&pagina=1')
        .expect(200);
      muestras.push(performance.now() - inicio);
      expect(r.body.items).toHaveLength(20);
      expect(r.body.total).toBe(1000);
    }
    muestras.sort((a, b) => a - b);
    const p95 = muestras[Math.ceil(muestras.length * 0.95) - 1];
    console.info(
      `API búsqueda local: p95=${p95.toFixed(1)} ms; 30 muestras; 10.000 estudiantes, 500 empresas, 1.000 vacantes.`,
    );
    expect(p95).toBeLessThan(500);
  }, 30_000);
});
