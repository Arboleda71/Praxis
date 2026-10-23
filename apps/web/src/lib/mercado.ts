import type { VacanteDatos } from "@praxis/contracts";
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
