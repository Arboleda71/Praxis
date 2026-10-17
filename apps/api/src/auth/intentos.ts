import { Injectable } from '@nestjs/common';

export const MAX_INTENTOS = 5;
export const BLOQUEO_MS = 15 * 60_000;

/**
 * Fallos seguidos por clave (correo o IP). Bloquea 15 minutos desde el último fallo al llegar a 5.
 * ponytail: en memoria, una sola instancia de la API; con varias instancias, mover a Postgres.
 */
@Injectable()
export class Intentos {
  private readonly fallos = new Map<string, { n: number; ultimo: number }>();

  constructor(private readonly ahora: () => number = Date.now) {}

  bloqueado(...claves: string[]): boolean {
    return claves.some((c) => {
      const f = this.fallos.get(c);
      return !!f && f.n >= MAX_INTENTOS && this.ahora() - f.ultimo < BLOQUEO_MS;
    });
  }

  fallo(...claves: string[]): void {
    const t = this.ahora();
    for (const c of claves) {
      const f = this.fallos.get(c);
      const n = f && t - f.ultimo < BLOQUEO_MS ? f.n + 1 : 1;
      this.fallos.set(c, { n, ultimo: t });
    }
  }

  exito(clave: string): void {
    this.fallos.delete(clave);
  }

  limpiar(): void {
    this.fallos.clear();
  }
}
