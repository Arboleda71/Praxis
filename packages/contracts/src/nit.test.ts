import { describe, expect, test } from "vitest";
import { digitoVerificacion, leerNit } from "./nit.js";

describe("digitoVerificacion (algoritmo DIAN)", () => {
  test("calcula el dígito de NIT conocidos", () => {
    expect(digitoVerificacion("900123456")).toBe(8);
    expect(digitoVerificacion("800197268")).toBe(4); // NIT de la DIAN
  });

  test("residuo 0 o 1 da el mismo residuo; si no, 11 menos el residuo", () => {
    expect(digitoVerificacion("4")).toBe(1); // 4×3 = 12, residuo 1 → 1
    expect(digitoVerificacion("15")).toBe(0); // 1×7 + 5×3 = 22, residuo 0 → 0
    expect(digitoVerificacion("22")).toBe(2); // 2×7 + 2×3 = 20, residuo 9 → 11 − 9 = 2
  });
});

describe("leerNit", () => {
  test("acepta el NIT con guion, puntos o espacios", () => {
    for (const valor of ["900123456-8", "900.123.456-8", " 900 123 456 - 8 "]) {
      expect(leerNit(valor)).toEqual({ ok: true, nit: "900123456", dv: 8 });
    }
  });

  test("rechaza un dígito de verificación que no corresponde", () => {
    expect(leerNit("900123456-7")).toEqual({ ok: false, error: "dv" });
  });

  test("rechaza formatos sin dígito de verificación o con letras", () => {
    for (const valor of ["900123456", "", "abc-1", "12-3", "9001234567890123-1"]) {
      expect(leerNit(valor)).toEqual({ ok: false, error: "formato" });
    }
  });
});
