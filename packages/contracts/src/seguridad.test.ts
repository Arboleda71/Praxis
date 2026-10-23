import { describe, expect, it } from "vitest";
import { loginSchema, registroEstudianteSchema } from "./auth.js";
describe("003: límites antes de argon2", () => {
  it("rechaza 129 caracteres en ingreso y registro", () => {
    const d = { correo: "ficticio@example.test", contrasena: "x".repeat(129) };
    expect(loginSchema.safeParse(d).success).toBe(false);
    expect(
      registroEstudianteSchema.safeParse({
        ...d,
        confirmarContrasena: d.contrasena,
        nombreCompleto: "Nombre Ficticio",
        autorizaDatos: true,
      }).success,
    ).toBe(false);
  });
});
