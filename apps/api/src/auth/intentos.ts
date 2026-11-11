import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma.service.js';

export const MAX_INTENTOS = 5;
export const BLOQUEO_MS = 15 * 60_000;

const hash = (clave: string) => createHash('sha256').update(clave).digest('hex');
/** `reinicia`: al llegar al límite, el bloqueo dura la ventana completa desde ese intento. */
const regla = (clave: string) =>
  clave.startsWith('ip:')
    ? { limite: 30, ms: BLOQUEO_MS, reinicia: false }
    : clave.startsWith('registro:')
      ? { limite: 10, ms: 3_600_000, reinicia: false }
      : { limite: MAX_INTENTOS, ms: BLOQUEO_MS, reinicia: true };
const RECHAZADA = Symbol('rechazada');

/**
 * Límite de intentos en Postgres (spec 011): sobrevive a reinicios y es común a todas las copias de la API.
 * Reservar antes de esperar argon2. El reloj es el de la base.
 *
 * ponytail: la clave se guarda como SHA-256 sin sal. Evita tener correos e IP legibles a simple vista, pero
 * una IPv4 se recupera probando todas; las filas duran como mucho una hora. HMAC con un secreto propio si
 * esta tabla llega a copiarse fuera de la base.
 */
@Injectable()
export class Intentos {
  constructor(private readonly prisma: PrismaService) {}

  /** Cuenta el intento en todas las claves. Devuelve 0, o los segundos de espera si alguna está bloqueada. */
  async reservar(...claves: string[]): Promise<number> {
    const contadas = await this.sumar(claves, true);
    return contadas === claves.length
      ? 0
      : (await this.bloqueado(...claves)) || 1;
  }

  /** Cuenta sin comprobar el límite (rechazos que no pasan por `reservar`). */
  async fallo(...claves: string[]) {
    await this.sumar(claves, false);
  }

  /** Segundos que faltan para que ninguna clave esté bloqueada; 0 si ninguna lo está. */
  async bloqueado(...claves: string[]): Promise<number> {
    const { hashes, limites } = this.columnas(claves);
    const [{ segundos }] = await this.prisma.$queryRaw<
      [{ segundos: number | null }]
    >`
      SELECT ceil(max(extract(epoch FROM i.vence - now())))::int AS segundos
      FROM "Intento" i
      JOIN unnest(${hashes}::text[], ${limites}::int[]) AS e(clave, limite) ON e.clave = i.clave
      WHERE i.vence > now() AND i.n >= e.limite`;
    return segundos ?? 0;
  }

  registro(ip: string) {
    return this.reservar(`registro:${ip}`);
  }

  /**
   * Reinicia la racha de la cuenta; al origen solo le devuelve la reserva de esta petición.
   * Sentencias sueltas a propósito: cada una bloquea una sola fila, o salta las bloqueadas, así que no puede
   * formar un ciclo de bloqueos con `sumar`.
   */
  async exito(...claves: string[]) {
    const origen = claves.filter((c) => c.startsWith('ip:')).map(hash);
    const resto = claves.filter((c) => !c.startsWith('ip:')).map(hash);
    await this.prisma.$executeRaw`
      DELETE FROM "Intento" WHERE clave = ANY(${resto}::text[])`;
    await this.prisma.$executeRaw`
      UPDATE "Intento" SET n = greatest(0, n - 1) WHERE clave = ANY(${origen}::text[])`;
    await this.prisma.$executeRaw`
      DELETE FROM "Intento" WHERE clave IN (
        SELECT clave FROM "Intento" WHERE vence <= now()
        ORDER BY clave LIMIT 1000 FOR UPDATE SKIP LOCKED)`;
  }

  async limpiar() {
    await this.prisma.intento.deleteMany();
  }

  private columnas(claves: string[]) {
    const reglas = claves.map(regla);
    return {
      hashes: claves.map(hash),
      limites: reglas.map((r) => r.limite),
      ms: reglas.map((r) => r.ms),
      reinicia: reglas.map((r) => r.reinicia),
    };
  }

  /**
   * Una sola sentencia: el bloqueo de fila de ON CONFLICT serializa las reservas simultáneas, también entre
   * instancias, y `ORDER BY clave` fija el orden de los bloqueos. Con `limitar`, una clave en su límite no se
   * actualiza; si eso pasa con alguna, la transacción se deshace para que la petición rechazada no cuente en
   * las demás (una clave puede llegar al límite mientras la sentencia ya corría).
   */
  private async sumar(claves: string[], limitar: boolean): Promise<number> {
    const { hashes, limites, ms, reinicia } = this.columnas(claves);
    const sentencia = Prisma.sql`
      WITH e AS (
        SELECT * FROM unnest(${hashes}::text[], ${limites}::int[], ${ms}::float8[], ${reinicia}::bool[])
          AS t(clave, limite, ms, reinicia)
      )
      INSERT INTO "Intento" AS i (clave, n, vence)
      SELECT e.clave, 1, now() + e.ms * interval '1 millisecond' FROM e
      WHERE NOT ${limitar} OR NOT EXISTS (
        SELECT 1 FROM "Intento" b JOIN e x ON x.clave = b.clave
        WHERE b.vence > now() AND b.n >= x.limite
      )
      ORDER BY e.clave
      ON CONFLICT (clave) DO UPDATE SET
        n = CASE WHEN i.vence <= now() THEN 1 ELSE i.n + 1 END,
        vence = CASE
          WHEN i.vence <= now()
            OR (SELECT e.reinicia AND i.n + 1 >= e.limite FROM e WHERE e.clave = i.clave)
          THEN EXCLUDED.vence
          ELSE i.vence
        END
      WHERE NOT ${limitar} OR i.vence <= now()
        OR i.n < (SELECT e.limite FROM e WHERE e.clave = i.clave)
      RETURNING i.clave`;
    if (!limitar)
      return (await this.prisma.$queryRaw<unknown[]>(sentencia)).length;
    try {
      return await this.prisma.$transaction(async (tx) => {
        const filas = await tx.$queryRaw<unknown[]>(sentencia);
        if (filas.length < claves.length) throw RECHAZADA;
        return filas.length;
      });
    } catch (e) {
      if (e === RECHAZADA) return 0;
      throw e;
    }
  }
}
