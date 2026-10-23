import { describe, expect, test } from "vitest";
import { NIVELES_MCER } from "./catalogos.js";
import {
  PROGRAMA_REVISA_EMPRESA,
  REQUISITOS_EXCLUYENTES,
  programasSolicitadosSchema,
  alMenos,
  coinciden,
  compararAvance,
  compararIdioma,
  estaEntre,
} from "./comparar.js";

describe("campo vacío → falta información, nunca no cumple (FR-016)", () => {
  test.each([undefined, ""])("declarado %j", (declarado) => {
    expect(estaEntre(["tecnologo"], declarado)).toBe("falta_informacion");
    expect(coinciden("medio-tiempo", declarado)).toBe("falta_informacion");
    expect(alMenos(NIVELES_MCER, "b1", declarado)).toBe("falta_informacion");
    expect(compararAvance({ nivel: "universitario", avance: "sem-5" }, { nivel: "universitario", avance: declarado })).toBe(
      "falta_informacion",
    );
    expect(compararAvance({ nivel: "universitario", avance: "sem-5" }, {})).toBe("falta_informacion");
  });

  test("sin idiomas declarados", () => {
    expect(compararIdioma({ idioma: "ingles", nivel: "b1" }, [])).toBe("falta_informacion");
  });
});

describe("comparación por identidad (US1-1, FR-007, FR-012)", () => {
  test("estaEntre: el declarado está entre los aceptados", () => {
    expect(estaEntre(["tecnico", "tecnologo"], "tecnologo")).toBe("cumple");
    expect(estaEntre(["tecnico", "tecnologo"], "universitario")).toBe("no_cumple");
  });

  test("coinciden: mismo id", () => {
    expect(coinciden("medio-tiempo", "medio-tiempo")).toBe("cumple");
    expect(coinciden("medio-tiempo", "tiempo-completo")).toBe("no_cumple");
  });
});

describe("niveles MCER como mínimo (US2-1, SC-002)", () => {
  const ids = NIVELES_MCER.map((v) => v.id);

  test("orden A1 < A2 < B1 < B2 < C1 < C2", () => {
    expect(ids).toEqual(["a1", "a2", "b1", "b2", "c1", "c2"]);
  });

  test("los 36 pares: cumple si el declarado es igual o mayor", () => {
    for (const [i, minimo] of ids.entries()) {
      for (const [j, declarado] of ids.entries()) {
        expect(alMenos(NIVELES_MCER, minimo, declarado), `${declarado} vs mínimo ${minimo}`).toBe(
          j >= i ? "cumple" : "no_cumple",
        );
      }
    }
  });

  test("un id que no es del catálogo es un error de programación", () => {
    expect(() => alMenos(NIVELES_MCER, "b1", "intermedio")).toThrow();
  });
});

describe("idioma (US2, FR-013)", () => {
  const declarados = [
    { idioma: "ingles", nivel: "b2" },
    { idioma: "frances", nivel: "a1" },
  ];

  test("compara el nivel del mismo idioma", () => {
    expect(compararIdioma({ idioma: "ingles", nivel: "b1" }, declarados)).toBe("cumple");
    expect(compararIdioma({ idioma: "frances", nivel: "a2" }, declarados)).toBe("no_cumple");
  });

  test("otro idioma declarado no cuenta: falta información (US2-2)", () => {
    expect(compararIdioma({ idioma: "portugues", nivel: "a1" }, declarados)).toBe("falta_informacion");
  });
});

describe("avance académico (US2-3, FR-009)", () => {
  test("semestres dentro de universitario", () => {
    const req = { nivel: "universitario", avance: "sem-5" };
    expect(compararAvance(req, { nivel: "universitario", avance: "sem-6" })).toBe("cumple");
    expect(compararAvance(req, { nivel: "universitario", avance: "sem-5" })).toBe("cumple");
    expect(compararAvance(req, { nivel: "universitario", avance: "sem-4" })).toBe("no_cumple");
  });

  test("etapas dentro de técnico y tecnólogo", () => {
    const req = { nivel: "tecnologo", avance: "lectiva" };
    expect(compararAvance(req, { nivel: "tecnologo", avance: "productiva" })).toBe("cumple");
    expect(compararAvance({ nivel: "tecnico", avance: "productiva" }, { nivel: "tecnico", avance: "lectiva" })).toBe(
      "no_cumple",
    );
  });

  test("entre niveles distintos: falta información", () => {
    expect(compararAvance({ nivel: "tecnologo", avance: "lectiva" }, { nivel: "tecnico", avance: "productiva" })).toBe(
      "falta_informacion",
    );
    expect(compararAvance({ nivel: "universitario", avance: "sem-2" }, { nivel: "tecnologo", avance: "lectiva" })).toBe(
      "falta_informacion",
    );
  });
});

describe("programas solicitados por la vacante: texto libre, sin estado automático (II, III v4.0.0)", () => {
  test("uno o varios programas, recortados", () => {
    expect(programasSolicitadosSchema.parse(["  Ingeniería de sistemas ", "Ingeniería informática"])).toEqual([
      "Ingeniería de sistemas",
      "Ingeniería informática",
    ]);
  });

  test("sin repetidos, aunque cambien tildes o mayúsculas", () => {
    const r = programasSolicitadosSchema.safeParse(["Ingeniería de Sistemas", "ingenieria de sistemas"]);
    expect(r.error?.issues[0]).toMatchObject({ path: [1], message: "Ya agregaste este programa." });
  });

  test("máximo 5 y cada uno con nombre completo", () => {
    expect(programasSolicitadosSchema.safeParse(["A", "B", "C", "D", "E", "F"].map((x) => `Programa ${x}`)).success).toBe(false);
    expect(programasSolicitadosSchema.safeParse(["TI"]).error?.issues[0].message).toBe("Escribe el nombre completo del programa.");
  });

  test("no hay comparación: se muestra al lado del programa del estudiante con el rótulo fijo", () => {
    expect(PROGRAMA_REVISA_EMPRESA).toBe("La empresa revisa la afinidad");
    expect(REQUISITOS_EXCLUYENTES).not.toContain("programa");
  });
});

test("solo el nivel de formación puede ser excluyente (FR-017, constitución v4.0.0)", () => {
  expect(REQUISITOS_EXCLUYENTES).toEqual(["nivelFormacion"]);
});
