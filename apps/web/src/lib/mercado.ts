import { MODALIDADES, nombreDe, type VacanteDatos } from "@praxis/contracts";
import { fechaLarga } from "./perfil-cliente";
export type Vacante = VacanteDatos & {
  id: string;
  estado: string;
  motivoCierre?: string | null;
  empresa?: {
    razonSocial: string;
    descripcion?: string;
    ciudad?: string;
    sitioWeb?: string;
    correoContacto?: string;
    telefono?: string;
  };
};
export type Lista<T> = {
  items: T[];
  total: number;
  pagina: number;
  cuposGratis?: number;
};
export async function solicitar<T>(
  ruta: string,
  metodo = "GET",
  datos?: unknown,
): Promise<T> {
  const r = await fetch(`/api${ruta}`, {
    method: metodo,
    headers:
      datos === undefined ? undefined : { "Content-Type": "application/json" },
    body: datos === undefined ? undefined : JSON.stringify(datos),
  });
  if (!r.ok) {
    const d = await r.json().catch(() => ({}));
    throw new Error(
      d.mensaje ??
        (Object.values(d.errores ?? {}).join(" ") ||
          "No pudimos completar la operación."),
    );
  }
  return r.status === 204 ? (undefined as T) : r.json();
}

/** «Híbrida Medellín», «Remota». */
export const ubicacion = (v: { modalidad: string; ciudad?: string | null }) =>
  [nombreDe(MODALIDADES, v.modalidad), v.ciudad].filter(Boolean).join(" ");

/** «Andina Soft S.A.S. · Híbrida Medellín · Vigencia: 15 de abril de 2026»: los datos básicos de una tarjeta. */
export const resumenVacante = (v: {
  modalidad: string;
  ciudad?: string | null;
  vigencia: string;
  empresa?: { razonSocial: string };
}) =>
  [
    v.empresa?.razonSocial,
    ubicacion(v),
    `Vigencia: ${fechaLarga(v.vigencia.slice(0, 10))}`,
  ]
    .filter(Boolean)
    .join(" · ");

/**
 * La dirección si es http(s); si no, `undefined`. La API ya lo exige al guardar, pero un dato antiguo o
 * sembrado podría ser `javascript:` y no debe llegar a un `href`.
 */
export function enlaceWeb(url?: string | null) {
  try {
    return url && ["http:", "https:"].includes(new URL(url).protocol) ? url : undefined;
  } catch {
    return undefined;
  }
}
