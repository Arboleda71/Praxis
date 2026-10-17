import { describe, expect, test } from "vitest";
import { inicioDe, safeNext } from "./rutas";

describe("safeNext", () => {
  test("acepta rutas internas", () => {
    expect(safeNext("/empresa/vacantes?x=1")).toBe("/empresa/vacantes?x=1");
  });

  test("rechaza destinos externos o vacíos", () => {
    for (const bad of [undefined, null, "", "https://evil.co", "//evil.co", "/\\evil.co", "empresa"]) {
      expect(safeNext(bad)).toBeNull();
    }
  });
});

describe("inicioDe", () => {
  test("cada rol llega a su sección", () => {
    expect(inicioDe("estudiante")).toBe("/estudiante/perfil");
    expect(inicioDe("empresa")).toBe("/empresa/vacantes");
  });
});
