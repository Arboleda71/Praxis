import { describe, expect, test } from "vitest";
import { loginSchema, registroEmpresaSchema, registroEstudianteSchema } from "./auth.js";

const estudiante = {
  nombreCompleto: "Laura Gómez Restrepo",
  correo: " Laura.Gomez@Correo.co ",
  contrasena: "contrasena-segura",
  confirmarContrasena: "contrasena-segura",
  autorizaDatos: true,
};

const errores = (r: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) =>
  Object.fromEntries((r.error?.issues ?? []).map((i) => [i.path.join("."), i.message]));

describe("registroEstudianteSchema", () => {
  test("acepta datos válidos y normaliza el correo", () => {
    const r = registroEstudianteSchema.safeParse(estudiante);
    expect(r.success && r.data.correo).toBe("laura.gomez@correo.co");
  });

  test("la autorización de datos es obligatoria (casilla sin marcar)", () => {
    const r = registroEstudianteSchema.safeParse({ ...estudiante, autorizaDatos: false });
    expect(errores(r).autorizaDatos).toBe("Debes aceptar la política para continuar.");
  });

  test("la contraseña tiene al menos 10 caracteres y dice cuántos lleva", () => {
    const r = registroEstudianteSchema.safeParse({ ...estudiante, contrasena: "corta1", confirmarContrasena: "corta1" });
    expect(errores(r).contrasena).toBe("Debe tener al menos 10 caracteres. Llevas 6.");
  });

  test("las contraseñas deben coincidir", () => {
    const r = registroEstudianteSchema.safeParse({ ...estudiante, confirmarContrasena: "otra-contrasena" });
    expect(errores(r).confirmarContrasena).toBe("Las contraseñas no coinciden.");
  });

  test("informa las contraseñas distintas aunque falte la autorización", () => {
    const r = registroEstudianteSchema.safeParse({ ...estudiante, confirmarContrasena: "otra-contrasena", autorizaDatos: false });
    expect(errores(r).confirmarContrasena).toBe("Las contraseñas no coinciden.");
    expect(errores(r).autorizaDatos).toBe("Debes aceptar la política para continuar.");
  });

  test("el correo debe ser válido", () => {
    const r = registroEstudianteSchema.safeParse({ ...estudiante, correo: "laura@" });
    expect(errores(r).correo).toMatch(/correo válido/);
  });

  test("no acepta campos que no pide (minimización)", () => {
    const r = registroEstudianteSchema.safeParse({ ...estudiante, edad: 20 });
    expect(r.success).toBe(false);
  });
});

describe("registroEmpresaSchema", () => {
  const { nombreCompleto: _, ...cuenta } = estudiante;
  const empresa = { ...cuenta, razonSocial: "Andina Soft S.A.S.", nit: "900.123.456-8" };

  test("normaliza el NIT", () => {
    const r = registroEmpresaSchema.safeParse(empresa);
    expect(r.success && { nit: r.data.nit, dv: r.data.dv }).toEqual({ nit: "900123456", dv: 8 });
  });

  test("explica el dígito de verificación errado", () => {
    const r = registroEmpresaSchema.safeParse({ ...empresa, nit: "900123456-7" });
    expect(errores(r).nit).toBe("El dígito de verificación no corresponde a este NIT. Revísalo en tu RUT.");
  });

  test("explica el formato del NIT", () => {
    const r = registroEmpresaSchema.safeParse({ ...empresa, nit: "900123456" });
    expect(errores(r).nit).toBe("Escríbelo con el dígito de verificación, por ejemplo 900123456-8.");
  });

  test("informa el NIT errado aunque falte la autorización", () => {
    const r = registroEmpresaSchema.safeParse({ ...empresa, nit: "900123456-7", autorizaDatos: false });
    expect(errores(r).nit).toBe("El dígito de verificación no corresponde a este NIT. Revísalo en tu RUT.");
    expect(errores(r).autorizaDatos).toBe("Debes aceptar la política para continuar.");
  });
});

describe("loginSchema", () => {
  test("pide correo y contraseña", () => {
    expect(loginSchema.safeParse({ correo: "a@b.co", contrasena: "x" }).success).toBe(true);
    expect(loginSchema.safeParse({ correo: "a@b.co", contrasena: "" }).success).toBe(false);
  });
});
