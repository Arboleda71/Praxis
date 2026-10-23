import { z } from "zod";

/**
 * Valor de un catálogo. El `id` nunca cambia ni se reutiliza; el `nombre` se puede corregir.
 * Para dejar de ofrecer un valor se marca `retirado: true`: nunca se borra, porque perfiles y vacantes
 * ya publicadas lo siguen mostrando (FR-004).
 */
export type Valor = { readonly id: string; readonly nombre: string; readonly retirado?: true };

export const MENSAJES_CATALOGO = {
  fueraDeLista: "Elige una opción de la lista.",
  avanceDeOtroNivel: "Este avance no corresponde al nivel elegido.",
  idiomaRepetido: "Ya agregaste este idioma.",
} as const;

// El orden de cada arreglo es el orden en pantalla (FR-005).

export const NIVELES_FORMACION = [
  { id: "tecnico", nombre: "Técnico" },
  { id: "tecnologo", nombre: "Tecnólogo" },
  { id: "universitario", nombre: "Universitario" },
] as const satisfies readonly Valor[];

// El programa académico NO es catálogo (constitución v4.0.0, II): hay demasiados programas reales. El
// estudiante lo escribe como texto libre y no se compara con requisitos.

// Universitario cuenta por semestres; técnico y tecnólogo, por etapas (FR-009).
export const AVANCES: readonly (Valor & { readonly niveles: readonly string[] })[] = [
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `sem-${i + 1}`,
    nombre: `${i + 1}.º semestre`,
    niveles: ["universitario"],
  })),
  { id: "lectiva", nombre: "Lectiva", niveles: ["tecnico", "tecnologo"] },
  { id: "productiva", nombre: "Productiva", niveles: ["tecnico", "tecnologo"] },
];

export const MODALIDADES = [
  { id: "presencial", nombre: "Presencial" },
  { id: "hibrida", nombre: "Híbrida" },
  { id: "remota", nombre: "Remota" },
] as const satisfies readonly Valor[];

export const JORNADAS = [
  { id: "tiempo-completo", nombre: "Tiempo completo" },
  { id: "medio-tiempo", nombre: "Medio tiempo" },
] as const satisfies readonly Valor[];

export const IDIOMAS = [
  { id: "ingles", nombre: "Inglés" },
  { id: "frances", nombre: "Francés" },
  { id: "portugues", nombre: "Portugués" },
  { id: "aleman", nombre: "Alemán" },
  { id: "italiano", nombre: "Italiano" },
  { id: "mandarin", nombre: "Mandarín" },
  { id: "japones", nombre: "Japonés" },
  { id: "lsc", nombre: "Lengua de señas colombiana" },
] as const satisfies readonly Valor[];

// Ordenado de menor a mayor: la comparación «igual o mayor al mínimo» depende de este orden.
export const NIVELES_MCER = [
  { id: "a1", nombre: "A1 · Principiante" },
  { id: "a2", nombre: "A2 · Básico" },
  { id: "b1", nombre: "B1 · Intermedio" },
  { id: "b2", nombre: "B2 · Intermedio alto" },
  { id: "c1", nombre: "C1 · Avanzado" },
  { id: "c2", nombre: "C2 · Maestría" },
] as const satisfies readonly Valor[];

export const SECTORES = [
  { id: "tecnologia", nombre: "Tecnología" },
  { id: "manufactura", nombre: "Manufactura" },
  { id: "comercio", nombre: "Comercio" },
  { id: "servicios-financieros", nombre: "Servicios financieros" },
  { id: "salud", nombre: "Salud" },
  { id: "educacion", nombre: "Educación" },
  { id: "construccion", nombre: "Construcción" },
  { id: "logistica-transporte", nombre: "Logística y transporte" },
  { id: "agroindustria", nombre: "Agroindustria" },
  { id: "turismo-gastronomia", nombre: "Turismo y gastronomía" },
  { id: "sector-publico", nombre: "Sector público" },
  { id: "otro", nombre: "Otro" },
] as const satisfies readonly Valor[];

/** Valores que se ofrecen en un selector, en el orden del catálogo. */
export const vigentes = <V extends Valor>(catalogo: readonly V[]): V[] => catalogo.filter((v) => !v.retirado);

/** Nombre visible de un valor, aunque esté retirado. */
export const nombreDe = (catalogo: readonly Valor[], id: string) => catalogo.find((v) => v.id === id)?.nombre;

/** Avances que aplican a un nivel de formación. */
export const avancesDe = (nivel: string) => vigentes(AVANCES).filter((a) => a.niveles.includes(nivel));

export const avanceDelNivel = (avanceId: string, nivel: string) =>
  AVANCES.find((a) => a.id === avanceId)?.niveles.includes(nivel) ?? false;

/** Esquema que acepta solo ids vigentes del catálogo (FR-001). */
export const valorDe = (catalogo: readonly Valor[]) =>
  z.string().refine((id) => vigentes(catalogo).some((v) => v.id === id), { error: MENSAJES_CATALOGO.fueraDeLista });

/** Idiomas declarados (perfil) o pedidos (vacante): cada idioma una sola vez, con su nivel MCER. */
export const idiomasSchema = z
  .array(z.strictObject({ idioma: valorDe(IDIOMAS), nivel: valorDe(NIVELES_MCER) }))
  .check((ctx) => {
    ctx.value.forEach((fila, i) => {
      if (ctx.value.findIndex((f) => f.idioma === fila.idioma) < i) {
        ctx.issues.push({ code: "custom", input: fila, path: [i, "idioma"], message: MENSAJES_CATALOGO.idiomaRepetido });
      }
    });
  });
