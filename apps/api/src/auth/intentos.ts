import { Injectable } from '@nestjs/common';

export const MAX_INTENTOS = 5;
export const BLOQUEO_MS = 15 * 60_000;

/** Ventanas acotadas; una instancia de API en el piloto. Reservar antes de esperar argon2. */
@Injectable()
export class Intentos {
  private readonly fallos = new Map<string, { n: number; vence: number }>();
  constructor(private readonly ahora: () => number = Date.now) {}
  private depurar() {
    const t = this.ahora();
    for (const [c, v] of this.fallos) if (v.vence <= t) this.fallos.delete(c);
  }
  private limite(c: string) {
    return c.startsWith('ip:')
      ? 30
      : c.startsWith('registro:')
        ? 10
        : MAX_INTENTOS;
  }
  bloqueado(...claves: string[]) {
    this.depurar();
    return claves.some((c) => (this.fallos.get(c)?.n ?? 0) >= this.limite(c));
  }
  fallo(...claves: string[]) {
    this.depurar();
    for (const c of claves) {
      const f = this.fallos.get(c) ?? {
        n: 0,
        vence:
          this.ahora() + (c.startsWith('registro:') ? 3_600_000 : BLOQUEO_MS),
      };
      f.n++;
      if (
        !c.startsWith('ip:') &&
        !c.startsWith('registro:') &&
        f.n === MAX_INTENTOS
      )
        f.vence = this.ahora() + BLOQUEO_MS;
      this.fallos.set(c, f);
    }
  }
  reservar(...claves: string[]) {
    if (this.bloqueado(...claves)) return false;
    this.fallo(...claves);
    return true;
  }
  registro(ip: string) {
    return this.reservar(`registro:${ip}`);
  }
  exito(...claves: string[]) {
    for (const c of claves) {
      if (c.startsWith('ip:')) {
        const f = this.fallos.get(c);
        if (f) f.n = Math.max(0, f.n - 1); // libera solo la reserva de esta petición
      } else this.fallos.delete(c);
    }
  }
  limpiar() {
    this.fallos.clear();
  }
}
