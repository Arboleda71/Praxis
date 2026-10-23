import { z } from "zod";
import { AVANCES, NIVELES_MCER, type Valor } from "./catalogos.js";

/** Resultado de comparar un requisito con el perfil (III). No hay puntajes. */
export type Resultado = "cumple" | "no_cumple" | "falta_informacion";

/** Solo este requisito puede bloquear una postulación; el resto son deseables (IV, FR-017). */
export const REQUISITOS_EXCLUYENTES = ["nivelFormacion"] as const;

// --- Programas solicitados (constitución v4.0.0, II y III) ---
// La vacante pide uno o varios programas en texto libre. Se muestran junto al programa del estudiante,
// sin *cumple*/*no cumple* y sin bloquear: la afinidad la valora la empresa.

export const PROGRAMA_REVISA_EMPRESA = "La empresa revisa la afinidad";

const sinTildes = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export const programasSolicitadosSchema = z
  .array(
    z
      .string()
      .trim()
      .min(3, { error: "Escribe el nombre completo del programa." })
      .max(150, { error: "Escribe máximo 150 caracteres." }),
  )
  .min(1, { error: "Escribe al menos un programa." })
  .max(5, { error: "Escribe máximo 5 programas." })
  .check((ctx) => {
    const vistos = ctx.value.map(sinTildes);
    vistos.forEach((p, i) => {
      if (vistos.indexOf(p) < i) ctx.issues.push({ code: "custom", input: ctx.value[i], path: [i], message: "Ya agregaste este programa." });
    });
  });

// Un campo vacío del perfil nunca es «no cumple» (FR-016).

/** Nivel de formación: el declarado está entre los aceptados. */
export const estaEntre = (aceptados: readonly string[], declarado?: string): Resultado =>
  !declarado ? "falta_informacion" : aceptados.includes(declarado) ? "cumple" : "no_cumple";

/** Jornada: el declarado es el requerido. */
export const coinciden = (requerido: string, declarado?: string) => estaEntre([requerido], declarado);

/** Niveles ordenados (MCER, avance): cumple si el declarado es igual o mayor al mínimo. */
export function alMenos(orden: readonly Valor[], minimo: string, declarado?: string): Resultado {
  if (!declarado) return "falta_informacion";
  const posicion = (id: string) => {
    const i = orden.findIndex((v) => v.id === id);
    if (i < 0) throw new Error(`«${id}» no está en el catálogo`);
    return i;
  };
  return posicion(declarado) >= posicion(minimo) ? "cumple" : "no_cumple";
}

type Idioma = { idioma: string; nivel: string };

/** Un idioma que el estudiante no declaró es «falta información», no «no cumple». */
export const compararIdioma = (requisito: Idioma, declarados: readonly Idioma[]) =>
  alMenos(NIVELES_MCER, requisito.nivel, declarados.find((d) => d.idioma === requisito.idioma)?.nivel);

/** El avance solo se compara dentro del mismo nivel de formación (FR-009). */
export const compararAvance = (
  requisito: { nivel: string; avance: string },
  declarado: { nivel?: string; avance?: string },
): Resultado =>
  declarado.nivel !== requisito.nivel ? "falta_informacion" : alMenos(AVANCES, requisito.avance, declarado.avance);
