import { CreateBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { Archivos, ENLACE_MS } from '../src/perfil/archivos.js';

// Spec 011 (US6): el camino de producción de los archivos, contra un almacenamiento compatible con S3
// levantado por `npm run db:test` (docker-compose.test.yml). Credenciales ficticias, solo loopback.
const ENDPOINT = process.env.S3_PRUEBAS_ENDPOINT ?? 'http://127.0.0.1:59000';
const S3 = {
  S3_BUCKET: `praxis-pruebas-${Date.now()}`,
  S3_ENDPOINT: ENDPOINT,
  S3_REGION: 'us-east-1',
  S3_ACCESS_KEY_ID: 'praxis_test',
  S3_SECRET_ACCESS_KEY: 'praxis_test_secreto',
};

describe('archivos privados en S3 (almacenamiento compatible real)', () => {
  let archivos: Archivos;
  const previo: Record<string, string | undefined> = {};
  const clave = () => `${randomUUID()}.pdf`;
  const pdf = (texto: string) => Buffer.from(`%PDF-1.4 ${texto}`);
  const leer = async (c: string) => {
    const res = await fetch((await archivos.enlace(c)).url);
    return { estado: res.status, cuerpo: Buffer.from(await res.arrayBuffer()), res };
  };

  beforeAll(async () => {
    if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(ENDPOINT))
      throw new Error('Las pruebas de archivos solo corren contra loopback.');
    for (const [k, v] of Object.entries(S3)) {
      previo[k] = process.env[k];
      process.env[k] = v;
    }
    await new S3Client({
      region: S3.S3_REGION,
      endpoint: ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: S3.S3_ACCESS_KEY_ID,
        secretAccessKey: S3.S3_SECRET_ACCESS_KEY,
      },
    }).send(new CreateBucketCommand({ Bucket: S3.S3_BUCKET }));
    archivos = new Archivos();
  });
  afterAll(() => {
    for (const k of Object.keys(S3)) {
      if (previo[k] === undefined) delete process.env[k];
      else process.env[k] = previo[k];
    }
  });

  it('guarda y el enlace firmado entrega el mismo contenido, como PDF', async () => {
    const c = clave();
    await archivos.guardar(c, pdf('hoja de vida ficticia'));
    const { estado, cuerpo, res } = await leer(c);
    expect(estado).toBe(200);
    expect(cuerpo.equals(pdf('hoja de vida ficticia'))).toBe(true);
    expect(res.headers.get('content-type')).toBe('application/pdf');
  });

  it('el enlace vence a los 5 minutos', async () => {
    const c = clave();
    await archivos.guardar(c, pdf('x'));
    const { url, expiraEn } = await archivos.enlace(c);
    expect(new URL(url).searchParams.get('X-Amz-Expires')).toBe(
      String(ENLACE_MS / 1000),
    );
    expect(expiraEn.getTime() - Date.now()).toBeLessThanOrEqual(ENLACE_MS);
  });

  it('sin firma, o con la firma alterada, el almacenamiento lo niega', async () => {
    const c = clave();
    await archivos.guardar(c, pdf('privado'));
    const firmada = new URL((await archivos.enlace(c)).url);
    expect((await fetch(`${firmada.origin}${firmada.pathname}`)).status).toBe(403);
    const firma = firmada.searchParams.get('X-Amz-Signature')!;
    firmada.searchParams.set(
      'X-Amz-Signature',
      (firma[0] === '0' ? '1' : '0') + firma.slice(1),
    );
    expect((await fetch(firmada)).status).toBe(403);
    // La firma de un archivo no abre otro.
    const otra = clave();
    await archivos.guardar(otra, pdf('ajeno'));
    const cruzada = new URL((await archivos.enlace(c)).url);
    cruzada.pathname = cruzada.pathname.replace(c, otra);
    expect((await fetch(cruzada)).status).toBe(403);
  });

  it('la copia de la postulación conserva el original cuando el estudiante reemplaza el CV', async () => {
    const perfil = clave();
    const copia = clave();
    await archivos.guardar(perfil, pdf('versión 1'));
    await archivos.copiar(perfil, copia);
    await archivos.guardar(perfil, pdf('versión 2'));
    expect((await leer(copia)).cuerpo.equals(pdf('versión 1'))).toBe(true);
    expect((await leer(perfil)).cuerpo.equals(pdf('versión 2'))).toBe(true);
  });

  it('un archivo borrado ya no se entrega', async () => {
    const c = clave();
    await archivos.guardar(c, pdf('temporal'));
    await archivos.borrar(c);
    expect((await leer(c)).estado).toBe(404);
  });

  it('con S3 activo, el enlace local firmado no sirve', async () => {
    expect(await archivos.leerFirmado(clave(), Date.now() + 1000, 'x')).toBe(
      'firma',
    );
  });
});
