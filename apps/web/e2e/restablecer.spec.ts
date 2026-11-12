import { expect, request as nuevoContexto } from "@playwright/test";
import { createHash } from "node:crypto";
import { readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  CONTRASENA,
  crearCuenta,
  sinViolaciones,
  test,
  tokenDe,
} from "./ayudas";

const NUEVA = "contrasena-nueva-1";

// Spec 012.
test.describe("Restablecer la contraseña", () => {
  test("olvida la contraseña, la cambia desde el enlace y entra con la nueva", async ({
    page,
    baseURL,
  }) => {
    // La cuenta se crea en otro contexto: este navegador empieza sin sesión.
    const otro = await nuevoContexto.newContext({
      baseURL,
      extraHTTPHeaders: { Origin: baseURL! },
    });
    const correo = await crearCuenta(otro, "estudiante");
    await otro.dispose();

    await page.goto("/ingresar");
    await page.getByRole("link", { name: "¿Olvidaste tu contraseña?" }).click();
    await expect(
      page.getByRole("heading", { name: "¿Olvidaste tu contraseña?" }),
    ).toBeVisible();
    await sinViolaciones(page);
    await page.getByLabel("Correo").fill(correo);
    await page.getByRole("button", { name: "Enviar enlace" }).click();
    await expect(
      page.getByRole("heading", { name: "Revisa tu correo" }),
    ).toBeVisible();
    await expect(page.getByText(/Si el correo está registrado/)).toBeVisible();
    await sinViolaciones(page);

    // El correo más reciente de esta cuenta es el de restablecer; el anterior fue la confirmación.
    const token = tokenDe(correo);
    await page.goto(`/restablecer-contrasena?token=${token}`);
    await expect(
      page.getByRole("heading", { name: "Escribe tu contraseña nueva" }),
    ).toBeVisible();
    await sinViolaciones(page);
    await page.getByLabel("Contraseña nueva", { exact: true }).fill(NUEVA);
    await page.getByLabel("Confirmar contraseña nueva").fill(NUEVA);
    await page.getByRole("button", { name: "Cambiar contraseña" }).click();
    await expect(
      page.getByRole("heading", { name: "Tu contraseña quedó cambiada" }),
    ).toBeVisible();
    await sinViolaciones(page);

    await page
      .getByRole("main")
      .getByRole("link", { name: "Iniciar sesión" })
      .click();
    await page.getByLabel("Correo").fill(correo);
    await page.getByLabel("Contraseña", { exact: true }).fill(CONTRASENA);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    // Filtrado por texto: el anunciador de rutas de Next también tiene role="alert".
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "Correo o contraseña incorrectos" }),
    ).toBeVisible();
    await page.getByLabel("Contraseña", { exact: true }).fill(NUEVA);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(
      page.getByRole("heading", { name: "Empieza por tu perfil mínimo" }),
    ).toBeVisible();

    // El enlace sirvió una sola vez.
    await page.goto(`/restablecer-contrasena?token=${token}`);
    await expect(
      page.getByRole("heading", { name: "Este enlace ya no sirve" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Pedir otro enlace" }),
    ).toBeVisible();
    await sinViolaciones(page);
  });

  test("un correo sin cuenta recibe la misma respuesta y ningún correo", async ({
    page,
  }) => {
    const correo = `nadie-${Date.now()}-${process.pid}@correo.co`;
    await page.goto("/olvide-contrasena");
    await page.getByLabel("Correo").fill(correo);
    await page.getByRole("button", { name: "Enviar enlace" }).click();
    await expect(
      page.getByRole("heading", { name: "Revisa tu correo" }),
    ).toBeVisible();
    await expect(page.getByText(/Si el correo está registrado/)).toBeVisible();
    const id = createHash("sha256").update(correo).digest("hex");
    expect(
      readdirSync(join(tmpdir(), "praxis-correos-e2e")).filter((f) =>
        f.includes(id),
      ),
    ).toEqual([]);
  });
});
