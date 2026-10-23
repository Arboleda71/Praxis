import { describe, expect, test } from "vitest";
import * as contracts from "./index.js";
import {
  AVANCES,
  IDIOMAS,
  JORNADAS,
  NIVELES_FORMACION,
  avanceDelNivel,
  avancesDe,
  idiomasSchema,
  nombreDe,
  valorDe,
  vigentes,
  type Valor,
} from "./catalogos.js";

// Los catálogos exportados: cualquier arreglo de valores con id y nombre.
const catalogos = Object.entries(contracts).filter(
  (e): e is [string, readonly Valor[]] => Array.isArray(e[1]) && typeof e[1][0]?.id === "string",
);

const ficticio: readonly Valor[] = [
  { id: "uno", nombre: "Uno" },
  { id: "dos", nombre: "Dos", retirado: true },
  { id: "tres", nombre: "Tres" },
];

describe("identidad y orden (FR-003, FR-004, FR-005)", () => {
  test.each(catalogos)("%s: ids únicos en kebab-case", (_, catalogo) => {
    const ids = catalogo.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  test("vigentes excluye los retirados y conserva el orden", () => {
    expect(vigentes(ficticio).map((v) => v.id)).toEqual(["uno", "tres"]);
  });

  test("nombreDe muestra un retirado y no inventa valores", () => {
    expect(nombreDe(ficticio, "dos")).toBe("Dos");
    expect(nombreDe(ficticio, "cuatro")).toBeUndefined();
  });
});

describe("valorDe: solo valores de la lista (US1-2, SC-003)", () => {
  test("acepta un id vigente", () => {
    expect(valorDe(JORNADAS).parse("medio-tiempo")).toBe("medio-tiempo");
  });

  test("rechaza texto libre, nombres y retirados con el mismo mensaje", () => {
    for (const valor of ["Tecnólogo en lo que sea", "Tiempo completo", ""]) {
      const r = valorDe(JORNADAS).safeParse(valor);
      expect(r.error?.issues[0].message).toBe("Elige una opción de la lista.");
    }
    expect(valorDe(ficticio).safeParse("dos").success).toBe(false);
  });
});

describe("listas base (FR-007, FR-013)", () => {
  test("niveles de formación en orden", () => {
    expect(NIVELES_FORMACION.map((v) => v.nombre)).toEqual(["Técnico", "Tecnólogo", "Universitario"]);
  });

  test("idiomas de FR-013", () => {
    expect(IDIOMAS).toHaveLength(8);
  });
});

describe("avance académico por nivel (FR-009)", () => {
  test("universitario: semestres 1.º a 12.º", () => {
    expect(avancesDe("universitario").map((a) => a.id)).toEqual(Array.from({ length: 12 }, (_, i) => `sem-${i + 1}`));
  });

  test("técnico y tecnólogo: Lectiva y Productiva", () => {
    for (const nivel of ["tecnico", "tecnologo"]) {
      expect(avancesDe(nivel).map((a) => a.nombre)).toEqual(["Lectiva", "Productiva"]);
    }
  });

  test("avanceDelNivel rechaza un avance de otro nivel", () => {
    expect(avanceDelNivel("sem-3", "universitario")).toBe(true);
    expect(avanceDelNivel("sem-3", "tecnologo")).toBe(false);
    expect(avanceDelNivel("lectiva", "universitario")).toBe(false);
    expect(AVANCES.every((a) => a.niveles.length > 0)).toBe(true);
  });
});

describe("idiomasSchema (edge case: idioma repetido)", () => {
  test("acepta cada idioma una vez con su nivel", () => {
    const idiomas = [
      { idioma: "ingles", nivel: "b2" },
      { idioma: "portugues", nivel: "a2" },
    ];
    expect(idiomasSchema.parse(idiomas)).toEqual(idiomas);
  });

  test("rechaza el idioma repetido en la fila repetida", () => {
    const r = idiomasSchema.safeParse([
      { idioma: "ingles", nivel: "b2" },
      { idioma: "ingles", nivel: "c1" },
    ]);
    expect(r.error?.issues).toEqual([
      expect.objectContaining({ path: [1, "idioma"], message: "Ya agregaste este idioma." }),
    ]);
  });

  test("rechaza un nivel que no es MCER", () => {
    expect(idiomasSchema.safeParse([{ idioma: "ingles", nivel: "intermedio" }]).success).toBe(false);
  });
});

describe("ningún dato sensible ni catálogo de programas (US4, FR-006, constitución v4.0.0)", () => {
  test("los catálogos son exactamente los de data-model.md: el programa es texto libre", () => {
    expect(catalogos.map(([nombre]) => nombre).sort()).toEqual(
      ["AVANCES", "IDIOMAS", "JORNADAS", "MODALIDADES", "NIVELES_FORMACION", "NIVELES_MCER", "SECTORES"].sort(),
    );
  });

  test("ningún nombre ni valor trata datos sensibles", () => {
    const sensible = /edad|sexo|g[eé]nero|estado civil|foto|etnia|religi[oó]n|discapacidad/i;
    for (const [nombre, catalogo] of catalogos) {
      expect(nombre).not.toMatch(sensible);
      for (const v of catalogo) expect(v.nombre).not.toMatch(sensible);
    }
  });
});
