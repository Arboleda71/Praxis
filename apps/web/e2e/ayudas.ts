import AxeBuilder from "@axe-core/playwright";
import { expect, test as base, type APIRequestContext, type Page } from "@playwright/test";
import { digitoVerificacion } from "@praxis/contracts";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

export const CONTRASENA = "contrasena-segura";
const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

// Solo el servidor exclusivo de Playwright ofrece este control; no existe en main.ts.
export const test = base.extend<{ preparar: void }>({
  preparar: [async ({ request, baseURL }, provide) => {
    const res = await request.post('/api/__pruebas/reiniciar', { headers: { Origin: baseURL!, 'x-praxis-test': process.env.PRAXIS_TEST_CONTROL_SECRET! } });
    expect(res.status()).toBe(204);
    await provide();
  }, { auto: true }],
});
export async function sinViolaciones(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
}

let n = 0;
/** Correo único por prueba: no hace falta vaciar la base entre pruebas. */
export const correoUnico = (p = "e2e") => `${p}-${Date.now()}-${process.pid}-${n++}@correo.co`;

/** NIT aleatorio con su dígito de verificación correcto. */
export function nitUnico() {
  const nit = String(800_000_000 + Math.floor(Math.random() * 99_999_999));
  return `${nit}-${digitoVerificacion(nit)}`;
}

/**
 * Crea una cuenta por la API. Con `page.request` la cookie queda en el navegador (sesión iniciada);
 * con otro contexto, la cuenta existe pero el navegador sigue sin sesión.
 */
export async function crearCuenta(req: APIRequestContext, rol: "estudiante" | "empresa", correo = correoUnico(rol)) {
  const base = { correo, contrasena: CONTRASENA, confirmarContrasena: CONTRASENA, autorizaDatos: true };
  const datos =
    rol === "estudiante"
      ? { ...base, nombreCompleto: "Laura Gómez Restrepo" }
      : { ...base, razonSocial: "Andina Soft S.A.S.", nit: nitUnico() };
  const res = await req.post(`/api/auth/registro/${rol}`, { data: datos });
  expect(res.status()).toBe(201);
  return correo;
}

/** Token del último correo de confirmación enviado a `correo` (bandeja local de la API). */
export function tokenDe(correo: string): string {
  const dir = join(tmpdir(), "praxis-correos-e2e");
  const archivo = readdirSync(dir).filter((f) => f.includes(createHash("sha256").update(correo).digest("hex"))).sort().at(-1)!;
  return readFileSync(join(dir, archivo), "utf8").match(/token=([A-Za-z0-9_-]+)/)![1];
}

