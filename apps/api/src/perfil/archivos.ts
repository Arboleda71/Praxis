import { Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export const ENLACE_MS = 5 * 60_000;
export const MIME = { pdf: 'application/pdf', jpg: 'image/jpeg', png: 'image/png' } as const;
/** Claves generadas por la API: `<uuid>.<ext>`. Nada del nombre original llega al disco ni al bucket. */
export const CLAVE = /^[0-9a-f-]{36}\.(pdf|jpg|png)$/;

type S3 = { client: import('@aws-sdk/client-s3').S3Client; bucket: string };

/**
 * Archivos privados del perfil (XIV). Con S3_BUCKET usa S3/R2 y URLs prefirmadas; sin él (desarrollo y
 * pruebas) usa ARCHIVOS_DIR y enlaces firmados con HMAC que sirve `GET /archivos/:clave`.
 */
@Injectable()
export class Archivos {
  private readonly dir = process.env.ARCHIVOS_DIR || '.archivos';
  private s3?: Promise<S3>;

  constructor() {
    // En producción el disco del contenedor es efímero y la constitución fija S3/R2.
    if (process.env.NODE_ENV === 'production' && !process.env.S3_BUCKET) throw new Error('Falta S3_BUCKET en producción.');
  }

  async guardar(clave: string, datos: Buffer) {
    const s3 = await this.conS3();
    if (!s3) {
      await mkdir(this.dir, { recursive: true });
      return writeFile(join(this.dir, clave), datos);
    }
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    await s3.client.send(new PutObjectCommand({ Bucket: s3.bucket, Key: clave, Body: datos, ContentType: tipoDe(clave) }));
  }

  async borrar(clave: string) {
    const s3 = await this.conS3();
    if (!s3) return rm(join(this.dir, clave), { force: true });
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    await s3.client.send(new DeleteObjectCommand({ Bucket: s3.bucket, Key: clave }));
  }

  async copiar(origen: string, destino: string) {
    const s3 = await this.conS3();
    if (!s3) return this.guardar(destino, await readFile(join(this.dir, origen)));
    const { CopyObjectCommand } = await import('@aws-sdk/client-s3');
    await s3.client.send(new CopyObjectCommand({ Bucket: s3.bucket, Key: destino, CopySource: `${s3.bucket}/${encodeURIComponent(origen)}` }));
  }

  /** URL válida 5 minutos. En disco va por la web (`/api/…`, rewrite de Next). */
  async enlace(clave: string) {
    const exp = Date.now() + ENLACE_MS;
    const s3 = await this.conS3();
    if (!s3) return { url: `/api/archivos/${clave}?exp=${exp}&firma=${this.firma(clave, exp)}`, expiraEn: new Date(exp) };
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
    const comando = new GetObjectCommand({ Bucket: s3.bucket, Key: clave, ResponseContentDisposition: 'inline' });
    return { url: await getSignedUrl(s3.client, comando, { expiresIn: ENLACE_MS / 1000 }), expiraEn: new Date(exp) };
  }

  /** Solo backend en disco: valida la firma y lee el archivo, o devuelve null. */
  async leerFirmado(clave: string, exp: number, firma: string): Promise<Buffer | 'firma' | null> {
    const esperada = Buffer.from(this.firma(clave, exp));
    const dada = Buffer.from(firma);
    if (!CLAVE.test(clave) || exp < Date.now() || dada.length !== esperada.length || !timingSafeEqual(dada, esperada)) {
      return 'firma';
    }
    return readFile(join(this.dir, clave)).catch(() => null);
  }

  private firma(clave: string, exp: number) {
    return createHmac('sha256', process.env.ARCHIVOS_SECRETO || 'praxis-desarrollo').update(`${clave}.${exp}`).digest('base64url');
  }

  private conS3(): Promise<S3 | null> {
    const bucket = process.env.S3_BUCKET;
    if (!bucket) return Promise.resolve(null);
    this.s3 ??= import('@aws-sdk/client-s3').then(({ S3Client }) => ({
      bucket,
      client: new S3Client({
        region: process.env.S3_REGION || 'auto',
        endpoint: process.env.S3_ENDPOINT || undefined,
        credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '', secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '' },
      }),
    }));
    return this.s3;
  }
}

export const tipoDe = (clave: string) => MIME[clave.split('.').pop() as keyof typeof MIME];
