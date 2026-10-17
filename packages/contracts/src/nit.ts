// Pesos de la DIAN, aplicados de derecha a izquierda sobre los dígitos del NIT.
const PESOS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];

/** Dígito de verificación de la DIAN para un NIT (solo dígitos, sin el DV). */
export function digitoVerificacion(nit: string): number {
  const suma = [...nit].reverse().reduce((acc, d, i) => acc + Number(d) * PESOS[i], 0);
  const residuo = suma % 11;
  return residuo > 1 ? 11 - residuo : residuo;
}

export type NitLeido = { ok: true; nit: string; dv: number } | { ok: false; error: "formato" | "dv" };

/** Lee «900.123.456-8»: puntos y espacios se ignoran; el dígito de verificación va después del guion. */
export function leerNit(valor: string): NitLeido {
  const m = valor.replace(/[.\s]/g, "").match(/^(\d{6,15})-(\d)$/);
  if (!m) return { ok: false, error: "formato" };
  const [, nit, dv] = m;
  return digitoVerificacion(nit) === Number(dv) ? { ok: true, nit, dv: Number(dv) } : { ok: false, error: "dv" };
}
