import type { Rol } from "@praxis/contracts";

/** Solo rutas internas: evita redirecciones abiertas con `?next=`. */
export function safeNext(next: unknown): string | null {
  if (typeof next !== "string" || !/^\/(?!\/)/.test(next)) return null;
  let ruta = next;
  try {
    for (let n = 0; n < 3; n++) ruta = decodeURIComponent(ruta);
  } catch {
    return null;
  }
  if (
    /[\\\u0000-\u0020\u007f]/.test(ruta) ||
    ruta.startsWith("//") ||
    ruta.split(/[/?#]/).includes("..")
  )
    return null;
  return next;
}

/** Sección a la que llega cada rol al iniciar sesión. */
export const inicioDe = (rol: Rol) =>
  rol === "estudiante" ? "/estudiante/perfil" : "/empresa/vacantes";
