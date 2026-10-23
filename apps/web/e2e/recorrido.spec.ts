import { expect } from "@playwright/test";
import {
  CONTRASENA,
  correoUnico,
  nitUnico,
  sinViolaciones,
  test,
  tokenDe,
} from "./ayudas";

for (const rol of ["estudiante", "empresa"] as const) {
  test(`${rol}: registro, confirmación, cierre y reingreso con navegación protegida`, async ({
    page,
  }) => {
    const correo = correoUnico(`recorrido-${rol}`);
    const perfil =
      rol === "estudiante" ? "/estudiante/perfil" : "/empresa/perfil";
    // M3: un perfil de estudiante recién creado muestra la guía del perfil mínimo.
    const titulo =
      rol === "estudiante"
        ? "Empieza por tu perfil mínimo"
        : "Perfil de la empresa";
    await page.goto(`/registro/${rol}`);
    await page
      .getByLabel(rol === "estudiante" ? "Nombre completo" : "Razón social")
      .fill("Cuenta ficticia de prueba");
    if (rol === "empresa")
      await page.getByLabel("NIT con dígito de verificación").fill(nitUnico());
    await page.getByLabel("Correo").fill(correo);
    await page.getByLabel("Contraseña", { exact: true }).fill(CONTRASENA);
    await page.getByLabel("Confirmar contraseña").fill(CONTRASENA);
    await page
      .getByRole("checkbox", { name: /Autorizo el tratamiento/ })
      .check();
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(
      page.getByRole("heading", { name: "Revisa tu correo" }),
    ).toBeVisible();
    await page.goto(`/confirmar-correo?token=${tokenDe(correo)}`);
    await page.getByRole("button", { name: "Confirmar mi correo" }).click();
    await expect(
      page.getByRole("heading", { name: "Tu correo quedó confirmado" }),
    ).toBeVisible();
    await sinViolaciones(page);
    await page
      .getByRole("link", {
        name:
          rol === "estudiante"
            ? "Ir a mi perfil"
            : "Ir al perfil de la empresa",
      })
      .click();
    await expect(
      page.getByRole("heading", { name: titulo, exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Confirma tu correo")).toHaveCount(0);
    await sinViolaciones(page);

    const sesion = (await page.context().cookies()).find(
      (cookie) => cookie.name === "praxis_sesion",
    )!;
    await page
      .getByRole("button", { name: "Cuenta" })
      .filter({ visible: true })
      .click();
    await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL(/\/$/);
    // La cookie anterior tampoco permite recuperar la sesión terminada en el servidor.
    const cerrada = await page.request.get("/api/auth/sesion", {
      headers: { Cookie: `${sesion.name}=${sesion.value}` },
    });
    expect(cerrada.status()).toBe(401);

    await page.goto(perfil);
    await expect(page).toHaveURL(
      new RegExp(`/ingresar\\?next=${encodeURIComponent(perfil)}$`),
    );
    await page.getByLabel("Correo").fill(correo);
    await page.getByLabel("Contraseña", { exact: true }).fill(CONTRASENA);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(
      page.getByRole("heading", { name: titulo, exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Confirma tu correo")).toHaveCount(0);

    await page.goto(
      rol === "estudiante" ? "/empresa/vacantes" : "/estudiante/perfil",
    );
    await expect(
      page.getByRole("heading", { name: "No tienes acceso a esta sección" }),
    ).toBeVisible();
  });
}
