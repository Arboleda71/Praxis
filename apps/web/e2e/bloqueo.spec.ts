import { expect, request as nuevoContexto, test } from "@playwright/test";
import { crearCuenta, sinViolaciones } from "./ayudas";

// Corre al final (proyecto «bloqueo»): deja la IP local bloqueada 15 minutos.
test("tras 5 intentos fallidos, el inicio de sesión se bloquea", async ({ page, baseURL }) => {
  const otro = await nuevoContexto.newContext({ baseURL });
  const correo = await crearCuenta(otro, "estudiante");
  await otro.dispose();
  await page.goto("/ingresar");
  await page.getByLabel("Correo").fill(correo);
  for (let i = 0; i < 5; i++) {
    await page.getByLabel("Contraseña", { exact: true }).fill(`equivocada-${i}`);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page.getByText("Correo o contraseña incorrectos")).toBeVisible();
  }
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByText("Demasiados intentos")).toBeVisible();
  await expect(page.getByRole("button", { name: "Iniciar sesión" })).toBeDisabled();
  await sinViolaciones(page);
});
