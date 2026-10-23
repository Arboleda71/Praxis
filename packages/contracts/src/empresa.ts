import { z } from "zod";
import { SECTORES, valorDe } from "./catalogos.js";
import { leerNit } from "./nit.js";

const opcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform((v) => v || null);
export const empresaSchema = z
  .strictObject({
    razonSocial: z.string().trim().min(2).max(200),
    nit: z.string(),
    sector: valorDe(SECTORES).nullable(),
    ciudad: opcional(100),
    sitioWeb: opcional(250).refine(
      (v) => !v || (/^https?:\/\//.test(v) && URL.canParse(v)),
      { error: "Escribe un enlace http o https válido." },
    ),
    descripcion: opcional(3000),
    correoContacto: z.email().nullable(),
    telefono: opcional(30).refine((v) => !v || /^[+\d\s()-]+$/.test(v), {
      error: "Revisa el teléfono de contacto.",
    }),
  })
  .transform((d, ctx) => {
    const r = leerNit(d.nit);
    if (!r.ok) {
      ctx.addIssue({
        code: "custom",
        path: ["nit"],
        message: "Revisa el NIT y su dígito de verificación.",
      });
      return z.NEVER;
    }
    return { ...d, nit: r.nit, dv: r.dv };
  });
export type FichaEmpresa = z.output<typeof empresaSchema>;
