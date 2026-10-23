import type { TipoArchivo } from "@praxis/contracts";

export type Errores = Record<string, string>;
export type Resultado = { ok: true } | { ok: false; errores: Errores; mensaje?: string };

const SIN_CONEXION = "No pudimos guardar. Revisa tu conexión e inténtalo de nuevo.";

async function leer(res: Response | null): Promise<Resultado> {
  if (res?.ok) return { ok: true };
  const cuerpo = res ? await res.json().catch(() => ({})) : {};
  return { ok: false, errores: cuerpo.errores ?? {}, mensaje: cuerpo.errores ? undefined : (cuerpo.mensaje ?? SIN_CONEXION) };
}

export const guardarSeccion = (seccion: "formacion" | "disponibilidad" | "aval", datos: unknown) =>
  fetch(`/api/perfil/${seccion}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos) })
    .catch(() => null)
    .then(leer);

export const quitarArchivo = (tipo: TipoArchivo) =>
  fetch(`/api/perfil/archivos/${tipo}`, { method: "DELETE" }).catch(() => null).then(leer);

/** Abre el archivo en otra pestaña con un enlace firmado de corta duración. */
export async function verArchivo(tipo: TipoArchivo) {
  const res = await fetch(`/api/perfil/archivos/${tipo}/enlace`).catch(() => null);
  if (res?.ok) window.open((await res.json()).url, "_blank", "noopener");
}

/** Sube con XHR: fetch no informa el progreso de subida. */
export function subirArchivo(tipo: TipoArchivo, archivo: File, progreso: (pct: number) => void) {
  const xhr = new XMLHttpRequest();
  const promesa = new Promise<Resultado | "cancelada">((resolve) => {
    xhr.upload.onprogress = (e) => e.lengthComputable && progreso(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve({ ok: true });
      let cuerpo: { errores?: Errores; mensaje?: string } = {};
      try {
        cuerpo = JSON.parse(xhr.responseText);
      } catch {}
      resolve({ ok: false, errores: cuerpo.errores ?? {}, mensaje: cuerpo.errores ? undefined : (cuerpo.mensaje ?? SIN_CONEXION) });
    };
    xhr.onerror = () => resolve({ ok: false, errores: {}, mensaje: "Se perdió la conexión. Tu archivo anterior sigue igual." });
    xhr.onabort = () => resolve("cancelada");
  });
  const datos = new FormData();
  datos.append("archivo", archivo);
  xhr.open("PUT", `/api/perfil/archivos/${tipo}`);
  xhr.send(datos);
  return { promesa, cancelar: () => xhr.abort() };
}

/** «312 KB», «1,4 MB». */
export function tamano(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toLocaleString("es-CO", { maximumFractionDigits: 1 })} MB`;
}

const BOGOTA = { timeZone: "America/Bogota" } as const;
/** «20/10/2026». */
export const fechaCorta = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", { ...BOGOTA, day: "2-digit", month: "2-digit", year: "numeric" });
/** «3 de noviembre de 2026», a partir de «2026-11-03». */
export const fechaLarga = (dia: string) =>
  new Date(`${dia}T12:00:00-05:00`).toLocaleDateString("es-CO", { ...BOGOTA, day: "numeric", month: "long", year: "numeric" });
