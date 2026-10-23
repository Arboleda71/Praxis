import { z } from "zod";
import {
  AVANCES,
  JORNADAS,
  MENSAJES_CATALOGO,
  NIVELES_FORMACION,
  avanceDelNivel,
  idiomasSchema,
  valorDe,
} from "./catalogos.js";

// --- Perfil mínimo (IV) ---

export type CampoMinimo = "nivelFormacion" | "programa" | "hojaDeVida";

export const NOMBRES_MINIMO: Record<CampoMinimo, string> = {
  nivelFormacion: "nivel de formación",
  programa: "programa",
  hojaDeVida: "hoja de vida",
};

/** Sin estos tres datos no hay postulación. Ningún otro dato del perfil lo cambia (FR-004). */
export function perfilMinimo(p: { nivelFormacion: string | null; programa: string | null; hojaDeVida: boolean }) {
  const faltan: CampoMinimo[] = [];
  if (!p.nivelFormacion) faltan.push("nivelFormacion");
  if (!p.programa) faltan.push("programa");
  if (!p.hojaDeVida) faltan.push("hojaDeVida");
  return { completo: faltan.length === 0, faltan };
}

// --- Secciones del perfil ---

const textoOpcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: `Escribe máximo ${max} caracteres.` })
    .nullable()
    .transform((v) => v || null);

export const formacionSchema = z
  .strictObject({
    nivelFormacion: valorDe(NIVELES_FORMACION).nullable(),
    // Texto libre (constitución v4.0.0, II): cuenta para el perfil mínimo, pero no se compara.
    programa: textoOpcional(150).refine((v) => v === null || v.length >= 3, {
      error: "Escribe el nombre completo de tu programa.",
    }),
    institucion: textoOpcional(150),
    avance: valorDe(AVANCES).nullable(),
  })
  .check((ctx) => {
    const { nivelFormacion: nivel, avance } = ctx.value;
    if (!avance) return;
    const error = (campo: string, message: string) => {
      ctx.issues.push({ code: "custom", input: ctx.value, path: [campo], message });
    };
    if (!nivel) error("nivelFormacion", "Elige primero el nivel de formación.");
    else if (!avanceDelNivel(avance, nivel)) error("avance", MENSAJES_CATALOGO.avanceDeOtroNivel);
  });

export const disponibilidadSchema = z.strictObject({
  disponibleDesde: z.iso.date({ error: "Escribe una fecha válida." }).nullable(),
  jornada: valorDe(JORNADAS).nullable(),
  idiomas: idiomasSchema,
});

export const avalSchema = z.strictObject({ aval: z.boolean().nullable() });

export type Formacion = z.output<typeof formacionSchema>;
export type Disponibilidad = z.output<typeof disponibilidadSchema>;

/** Lo declarado se rotula como declarado; Praxis no verifica el aval (IX). */
export function rotuloAval(aval: boolean | null, conSoporte: boolean) {
  if (!aval) return null;
  return conSoporte ? "Aval declarado (con soporte)" : "Aval declarado (sin soporte)";
}

// --- Archivos (XIV) ---

const MB = 1024 * 1024;
export type Formato = "pdf" | "jpg" | "png";

export const LIMITES_ARCHIVO = {
  "hoja-de-vida": { formatos: ["pdf"], maxBytes: 5 * MB },
  "soporte-aval": { formatos: ["pdf"], maxBytes: 5 * MB },
  foto: { formatos: ["jpg", "png"], maxBytes: 2 * MB },
} as const satisfies Record<string, { formatos: readonly Formato[]; maxBytes: number }>;

export type TipoArchivo = keyof typeof LIMITES_ARCHIVO;
export const TIPOS_ARCHIVO = Object.keys(LIMITES_ARCHIVO) as TipoArchivo[];

const FIRMAS: [Formato, number[]][] = [
  ["pdf", [0x25, 0x50, 0x44, 0x46, 0x2d]], // %PDF-
  ["jpg", [0xff, 0xd8, 0xff]],
  ["png", [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
];

/** Formato real según los primeros bytes; el nombre y el Content-Type los controla el cliente. */
export const tipoPorContenido = (b: Uint8Array): Formato | null =>
  FIRMAS.find(([, firma]) => firma.every((x, i) => b[i] === x))?.[0] ?? null;

/** Formato según el tipo MIME del navegador, para avisar antes de subir. La API decide por contenido. */
export const formatoDeMime = (mime: string): Formato | null =>
  ({ "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png" })[mime] as Formato | undefined ?? null;

const enMB = (bytes: number) => `${(bytes / MB).toLocaleString("es-CO", { maximumFractionDigits: 1 })} MB`;

/** Mensaje para un archivo que no cumple, o null si cumple (FR-012). */
export function errorArchivo(tipo: TipoArchivo, a: { formato: Formato | null; bytes: number }): string | null {
  const limite = LIMITES_ARCHIVO[tipo];
  if (!a.formato || !(limite.formatos as readonly Formato[]).includes(a.formato)) {
    return tipo === "foto"
      ? "Solo se aceptan fotos JPG o PNG."
      : "Solo se aceptan archivos PDF. Guárdalo como PDF y vuelve a elegirlo.";
  }
  if (a.bytes > limite.maxBytes) return `Pesa ${enMB(a.bytes)} y el máximo es ${enMB(limite.maxBytes)}.`;
  return null;
}
