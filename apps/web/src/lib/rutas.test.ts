import { describe, expect, test } from "vitest";
import { inicioDe, safeNext } from "./rutas";

describe("safeNext", () => {
  test("acepta rutas internas", () => {
    expect(safeNext("/empresa/vacantes?x=1")).toBe("/empresa/vacantes?x=1");
  });

  test("rechaza destinos externos o vacíos", () => {
    for (const bad of [
      undefined,
      null,
      "",
      "https://evil.co",
      "//evil.co",
      "/\\evil.co",
      "empresa",
      "/%2fexterno",
      "/%5cexterno",
      "/%252fexterno",
      "/%00externo",
      "/%09/externo",
      "/\n/externo",
      "/\r/externo",
      "/\t/externo",
      "/a\\b",
      "/a/../b",
      "/%2e%2e/b",
      "javascript:alert(1)",
      " https://externo",
      "/%zz",
      "/%7fexterno",
      "/%20/externo",
    ]) {
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
