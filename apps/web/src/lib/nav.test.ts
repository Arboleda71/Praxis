import { describe, expect, test } from "vitest";
import { NAV, currentHref } from "./nav";

describe("NAV", () => {
  test("cada rol tiene sus destinos", () => {
    expect(NAV.estudiante.map((i) => i.label)).toEqual(["Inicio", "Mi perfil", 'Buscar', 'Postulaciones']);
    expect(NAV.empresa.map((i) => i.label)).toEqual(["Mis vacantes", "Perfil de la empresa"]);
  });
});

describe("currentHref", () => {
  test("marca el destino exacto", () => {
    expect(currentHref("/estudiante/perfil", NAV.estudiante)).toBe("/estudiante/perfil");
  });

  test("marca el destino de una subruta", () => {
    expect(currentHref("/empresa/vacantes/nueva", NAV.empresa)).toBe("/empresa/vacantes");
  });

  test("el inicio solo se marca en «/»", () => {
    expect(currentHref("/", NAV.estudiante)).toBe("/");
    expect(currentHref("/otra", NAV.estudiante)).toBe(false);
  });

  test("no confunde prefijos parciales", () => {
    expect(currentHref("/empresa/vacantes-viejas", NAV.empresa)).toBe(false);
  });

  test("ninguno en una página fuera de la barra", () => {
    expect(currentHref("/empresa/perfil", NAV.estudiante)).toBe(false);
  });
});
