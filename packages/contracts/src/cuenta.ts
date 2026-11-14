import { z } from "zod";
export const suprimirCuentaSchema = z.strictObject({
  contrasena: z.string().min(1, "Escribe tu contraseña actual.").max(128),
  entiende: z.literal(true, { error: "Confirma que entiendes que no se puede deshacer." }),
});
export const accesoCuentaSchema = z.strictObject({
  accion: z.enum(["revocar", "restaurar"]),
  motivo: z.string().trim().min(10, "Escribe un motivo de al menos 10 caracteres.").max(1000),
});
export const cuentasAdminSchema = z.strictObject({
  pagina: z.coerce.number().int().min(1).max(100000).default(1),
  rol: z.enum(["ESTUDIANTE", "EMPRESA"]).optional(),
  acceso: z.enum(["activo", "revocado", "eliminado"]).optional(),
  q: z.string().trim().max(150).optional(),
});
export type BusquedaCuentas = z.infer<typeof cuentasAdminSchema>;
export type CambioAcceso = z.infer<typeof accesoCuentaSchema>;
export type Supresion = z.infer<typeof suprimirCuentaSchema>;
