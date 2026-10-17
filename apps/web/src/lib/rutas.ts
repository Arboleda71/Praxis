import type { Rol } from "@praxis/contracts";

/** Solo rutas internas: evita redirecciones abiertas con `?next=`. */
export function safeNext(next: unknown): string | null {
  return typeof next === "string" && /^\/(?![/\\])/.test(next) ? next : null;
}

/** Sección a la que llega cada rol al iniciar sesión. */
export const inicioDe = (rol: Rol) => (rol === "estudiante" ? "/estudiante/perfil" : "/empresa/vacantes");
