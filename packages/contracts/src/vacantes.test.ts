import { describe, expect, it } from "vitest";
import { evaluarElegibilidad, vacanteSchema } from "./vacantes.js";
const v = {
  titulo: "Práctica de software",
  descripcion: "Práctica académica ficticia",
  modalidad: "remota",
  ciudad: null,
  duracionMeses: 6,
  fechaInicio: "2027-02-01",
  vigencia: "2027-01-30",
  niveles: ["tecnologo"],
  programas: ["Ingeniería de sistemas"],
  avances: [],
  aval: true,
  jornada: "tiempo-completo",
  idiomas: [{ idioma: "ingles", nivel: "b2" }],
};
describe("M5: elegibilidad sin puntajes", () => {
  it("solo excluye nivel y exige perfil mínimo", () => {
    const p = {
      nivelFormacion: "tecnologo",
      programa: "Programa distinto",
      hojaDeVida: true,
      aval: false,
      disponibleDesde: null,
      jornada: null,
      avance: null,
      idiomas: [],
    };
    expect(evaluarElegibilidad(v, p).puedePostular).toBe(true);
    expect(
      evaluarElegibilidad(v, { ...p, nivelFormacion: "universitario" })
        .puedePostular,
    ).toBe(false);
    expect(
      evaluarElegibilidad(v, { ...p, hojaDeVida: false }).puedePostular,
    ).toBe(false);
    expect(evaluarElegibilidad(v, p).programas.etiqueta).toBe(
      "La empresa revisa la afinidad",
    );
  });
  it("nombra cada requisito con el catálogo, no con ids", () => {
    const p = {
      nivelFormacion: "tecnologo",
      programa: "Programa",
      hojaDeVida: true,
      aval: null,
      disponibleDesde: null,
      jornada: null,
      avance: null,
      idiomas: [],
    };
    const conAvances = {
      ...v,
      avances: [
        { nivel: "universitario", avance: "sem-6" },
        { nivel: "tecnologo", avance: "productiva" },
      ],
    };
    expect(
      evaluarElegibilidad(conAvances, p).requisitos.map((r) => r.requisito),
    ).toEqual([
      "Nivel de formación",
      "Avance universitario: 6.º semestre",
      "Avance tecnólogo: Productiva",
      "Aval declarado",
      "Jornada: Tiempo completo",
      "Disponibilidad para la fecha de inicio",
      "Idioma Inglés: B2 · Intermedio alto",
    ]);
    // Un id que ya no está en el catálogo se muestra tal cual, no desaparece.
    expect(
      evaluarElegibilidad(
        { ...v, idiomas: [{ idioma: "klingon", nivel: "b2" }] },
        p,
      ).requisitos.at(-1)?.requisito,
    ).toBe("Idioma klingon: B2 · Intermedio alto");
  });
  it("valida requisitos y no permite programas repetidos ni ciudad ausente presencial", () => {
    expect(vacanteSchema.safeParse(v).success).toBe(true);
    expect(vacanteSchema.safeParse({ ...v, niveles: [] }).success).toBe(false);
    expect(
      vacanteSchema.safeParse({ ...v, programas: ["Tecnología", "tecnologia"] })
        .success,
    ).toBe(false);
    expect(
      vacanteSchema.safeParse({ ...v, modalidad: "presencial" }).success,
    ).toBe(false);
  });
});
