import type { CampoMinimo } from "@praxis/contracts";
import { cookies } from "next/headers";
import { API_URL, COOKIE } from "./session";

export type ArchivoMeta = { nombre: string; bytes: number; subidoEn: string };

/** Respuesta de `GET /perfil` (specs/005-perfil-estudiante/contracts/api-perfil.md). */
export type Perfil = {
  nombre: string;
  formacion: { nivelFormacion: string | null; programa: string | null; institucion: string | null; avance: string | null };
  disponibilidad: { disponibleDesde: string | null; jornada: string | null; idiomas: { idioma: string; nivel: string }[] };
  aval: boolean | null;
  archivos: { hojaDeVida: ArchivoMeta | null; soporteAval: ArchivoMeta | null; foto: ArchivoMeta | null };
  perfilMinimo: { completo: boolean; faltan: CampoMinimo[] };
};

async function api<T>(ruta: string): Promise<T | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  const res = await fetch(`${API_URL}${ruta}`, { headers: { cookie: `${COOKIE}=${token}` }, cache: "no-store" }).catch(() => null);
  return res?.ok ? ((await res.json()) as T) : null;
}

export const getPerfil = () => api<Perfil>("/perfil");

/** Enlace firmado de la foto (5 minutos), para mostrarla al cargar la página. */
export async function urlFoto(perfil: Perfil) {
  if (!perfil.archivos.foto) return null;
  return (await api<{ url: string }>("/perfil/archivos/foto/enlace"))?.url ?? null;
}
