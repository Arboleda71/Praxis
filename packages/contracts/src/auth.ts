import { z } from "zod";
import { leerNit } from "./nit.js";

export const CONTRASENA_MIN = 10;

const correo = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Escribe un correo válido, por ejemplo nombre@correo.co." }));

const contrasena = z.string().check((ctx) => {
  if (ctx.value.length > 128) ctx.issues.push({ code: 'custom', input: ctx.value, message: 'Usa como máximo 128 caracteres.' });
  if (ctx.value.length < CONTRASENA_MIN) {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: `Debe tener al menos ${CONTRASENA_MIN} caracteres. Llevas ${ctx.value.length}.`,
    });
  }
});

const cuenta = {
  correo,
  contrasena,
  confirmarContrasena: z.string(),
  autorizaDatos: z.literal(true, { error: "Debes aceptar la política para continuar." }),
};

const coinciden = (d: { contrasena: string; confirmarContrasena: string }) => d.contrasena === d.confirmarContrasena;
const camposContrasena = z.object({ contrasena: z.string(), confirmarContrasena: z.string() });
const noCoinciden = {
  path: ["confirmarContrasena"],
  error: "Las contraseñas no coinciden.",
  when: ({ value }: { value: unknown }) => camposContrasena.safeParse(value).success,
};

// strictObject: rechaza campos que no se piden (minimización, principio VIII).
export const registroEstudianteSchema = z
  .strictObject({
    ...cuenta,
    nombreCompleto: z.string().trim().min(3, { error: "Escribe tu nombre completo." }).max(120),
  })
  .refine(coinciden, noCoinciden);

const NIT_ERROR = {
  formato: "Escríbelo con el dígito de verificación, por ejemplo 900123456-8.",
  dv: "El dígito de verificación no corresponde a este NIT. Revísalo en tu RUT.",
} as const;

export const registroEmpresaSchema = z
  .strictObject({
    ...cuenta,
    razonSocial: z.string().trim().min(2, { error: "Escribe la razón social de la empresa." }).max(200),
    nit: z.string().transform((valor, ctx) => {
      const leido = leerNit(valor);
      if (!leido.ok) {
        ctx.issues.push({ code: "custom", input: valor, message: NIT_ERROR[leido.error] });
        return z.NEVER;
      }
      return leido;
    }),
  })
  .refine(coinciden, noCoinciden)
  .transform((d) => ({ ...d, nit: d.nit.nit, dv: d.nit.dv }));

export const loginSchema = z.strictObject({
  correo,
  contrasena: z.string().min(1, { error: "Escribe tu contraseña." }).max(128, { error: "Usa como máximo 128 caracteres." }),
});

export const tokenSchema = z.strictObject({ token: z.string().min(16).max(128) });

export type RegistroEstudiante = z.infer<typeof registroEstudianteSchema>;
export type RegistroEmpresa = z.output<typeof registroEmpresaSchema>;
export type Login = z.infer<typeof loginSchema>;

export type Rol = "estudiante" | "empresa";

/** Lo que la API devuelve de la sesión actual. */
export type SesionPublica = {
  rol: Rol;
  nombre: string;
  correo: string;
  correoConfirmado: boolean;
};
