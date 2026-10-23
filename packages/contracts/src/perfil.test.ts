import { describe, expect, test } from "vitest";
import {
  LIMITES_ARCHIVO,
  avalSchema,
  disponibilidadSchema,
  errorArchivo,
  formacionSchema,
  perfilMinimo,
  rotuloAval,
  tipoPorContenido,
} from "./perfil.js";

const MB = 1024 * 1024;
const bytes = (...b: number[]) => new Uint8Array([...b, 0, 0, 0, 0]);

describe("perfilMinimo: nivel + programa + hoja de vida (IV, FR-003)", () => {
  test("completo con los tres", () => {
    expect(perfilMinimo({ nivelFormacion: "tecnologo", programa: "tecnologia-redes", hojaDeVida: true })).toEqual({
      completo: true,
      faltan: [],
    });
  });

  test("dice qué falta, en orden", () => {
    expect(perfilMinimo({ nivelFormacion: "tecnologo", programa: null, hojaDeVida: false })).toEqual({
      completo: false,
      faltan: ["programa", "hojaDeVida"],
    });
    expect(perfilMinimo({ nivelFormacion: null, programa: null, hojaDeVida: false }).faltan).toEqual([
      "nivelFormacion",
      "programa",
      "hojaDeVida",
    ]);
  });

  test("nada más influye: foto, aval, idiomas o avance no están en la entrada (FR-004)", () => {
    const base = { nivelFormacion: "tecnico", programa: "tecnico-sistemas", hojaDeVida: true };
    const conExtras = { ...base, foto: true, aval: true, idiomas: [{ idioma: "ingles", nivel: "b1" }], avance: "lectiva" };
    expect(perfilMinimo(conExtras)).toEqual(perfilMinimo(base));
  });
});

describe("formacionSchema (FR-005, FR-009)", () => {
  const valida = {
    nivelFormacion: "tecnologo",
    programa: "  Tecnología en Análisis y Desarrollo de Software ",
    institucion: "  SENA  ",
    avance: "lectiva",
  };

  test("acepta una formación válida y recorta programa e institución", () => {
    expect(formacionSchema.parse(valida)).toEqual({
      ...valida,
      programa: "Tecnología en Análisis y Desarrollo de Software",
      institucion: "SENA",
    });
  });

  test("el programa es texto libre: cualquier programa real, de cualquier nivel (constitución v4.0.0)", () => {
    for (const programa of ["Ingeniería Mecatrónica", "Técnico en Cocina", "Bachelor of Computer Science"]) {
      expect(formacionSchema.parse({ ...valida, programa }).programa).toBe(programa);
    }
  });

  test("programa demasiado corto o largo", () => {
    expect(formacionSchema.safeParse({ ...valida, programa: "In" }).error?.issues[0]).toMatchObject({
      path: ["programa"],
      message: "Escribe el nombre completo de tu programa.",
    });
    expect(formacionSchema.safeParse({ ...valida, programa: "x".repeat(151) }).error?.issues[0].message).toBe(
      "Escribe máximo 150 caracteres.",
    );
  });

  test("todo es opcional: se puede guardar vacía", () => {
    expect(
      formacionSchema.parse({ nivelFormacion: null, programa: null, institucion: "", avance: null }),
    ).toEqual({ nivelFormacion: null, programa: null, institucion: null, avance: null });
  });

  test("el programa no depende del nivel: se guarda aunque falte el nivel", () => {
    expect(formacionSchema.safeParse({ ...valida, nivelFormacion: null, avance: null }).success).toBe(true);
  });

  test("avance sin nivel → pide el nivel", () => {
    const r = formacionSchema.safeParse({ ...valida, nivelFormacion: null });
    expect(r.error?.issues[0]).toMatchObject({ path: ["nivelFormacion"], message: "Elige primero el nivel de formación." });
  });

  test("avance de otro nivel → error en avance", () => {
    const r = formacionSchema.safeParse({ ...valida, avance: "sem-3" });
    expect(r.error?.issues).toEqual([
      expect.objectContaining({ path: ["avance"], message: "Este avance no corresponde al nivel elegido." }),
    ]);
  });

  test("valor fuera de la lista y campos de más", () => {
    expect(formacionSchema.safeParse({ ...valida, nivelFormacion: "Profesional" }).error?.issues[0].message).toBe(
      "Elige una opción de la lista.",
    );
    expect(formacionSchema.safeParse({ ...valida, edad: 22 }).success).toBe(false);
  });

  test("institución de más de 150 caracteres", () => {
    expect(formacionSchema.safeParse({ ...valida, institucion: "x".repeat(151) }).error?.issues[0].message).toBe(
      "Escribe máximo 150 caracteres.",
    );
  });
});

describe("disponibilidadSchema (FR-006, FR-007)", () => {
  test("fecha, jornada e idiomas", () => {
    const d = { disponibleDesde: "2026-11-03", jornada: "tiempo-completo", idiomas: [{ idioma: "ingles", nivel: "b1" }] };
    expect(disponibilidadSchema.parse(d)).toEqual(d);
  });

  test("vacía", () => {
    expect(disponibilidadSchema.parse({ disponibleDesde: null, jornada: null, idiomas: [] }).idiomas).toEqual([]);
  });

  test("fecha inválida", () => {
    for (const f of ["2026-02-30", "03/11/2026", "mañana"]) {
      expect(disponibilidadSchema.safeParse({ disponibleDesde: f, jornada: null, idiomas: [] }).error?.issues[0].message).toBe(
        "Escribe una fecha válida.",
      );
    }
  });

  test("idioma repetido → error en la fila", () => {
    const r = disponibilidadSchema.safeParse({
      disponibleDesde: null,
      jornada: null,
      idiomas: [
        { idioma: "ingles", nivel: "b1" },
        { idioma: "ingles", nivel: "c1" },
      ],
    });
    expect(r.error?.issues[0]).toMatchObject({ path: ["idiomas", 1, "idioma"], message: "Ya agregaste este idioma." });
  });
});

describe("aval (FR-008, FR-016)", () => {
  test("sí, no o sin responder", () => {
    for (const aval of [true, false, null]) expect(avalSchema.parse({ aval })).toEqual({ aval });
  });

  test("rótulo declarado, nunca verificado (IX)", () => {
    expect(rotuloAval(true, true)).toBe("Aval declarado (con soporte)");
    expect(rotuloAval(true, false)).toBe("Aval declarado (sin soporte)");
    expect(rotuloAval(false, false)).toBeNull();
    expect(rotuloAval(null, false)).toBeNull();
  });
});

describe("archivos (FR-011, FR-012)", () => {
  test("tipo por contenido, no por nombre", () => {
    expect(tipoPorContenido(bytes(0x25, 0x50, 0x44, 0x46, 0x2d))).toBe("pdf");
    expect(tipoPorContenido(bytes(0xff, 0xd8, 0xff))).toBe("jpg");
    expect(tipoPorContenido(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe("png");
    expect(tipoPorContenido(bytes(0x50, 0x4b, 0x03, 0x04))).toBeNull(); // .docx (zip)
    expect(tipoPorContenido(new Uint8Array())).toBeNull();
  });

  test("límites de la constitución (XIV)", () => {
    expect(LIMITES_ARCHIVO["hoja-de-vida"]).toMatchObject({ formatos: ["pdf"], maxBytes: 5 * MB });
    expect(LIMITES_ARCHIVO["soporte-aval"]).toMatchObject({ formatos: ["pdf"], maxBytes: 5 * MB });
    expect(LIMITES_ARCHIVO.foto).toMatchObject({ formatos: ["jpg", "png"], maxBytes: 2 * MB });
  });

  test("el error dice el motivo y el límite", () => {
    expect(errorArchivo("hoja-de-vida", { formato: "pdf", bytes: 300_000 })).toBeNull();
    expect(errorArchivo("hoja-de-vida", { formato: null, bytes: 300_000 })).toBe(
      "Solo se aceptan archivos PDF. Guárdalo como PDF y vuelve a elegirlo.",
    );
    expect(errorArchivo("hoja-de-vida", { formato: "pdf", bytes: 7.2 * MB })).toBe("Pesa 7,2 MB y el máximo es 5 MB.");
    expect(errorArchivo("foto", { formato: "pdf", bytes: 1000 })).toBe("Solo se aceptan fotos JPG o PNG.");
    expect(errorArchivo("foto", { formato: "png", bytes: 3 * MB })).toBe("Pesa 3 MB y el máximo es 2 MB.");
  });
});
