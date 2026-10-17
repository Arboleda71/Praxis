import { expect, request as nuevoContexto, test, type Page } from "@playwright/test";
import { CONTRASENA, crearCuenta, sinViolaciones } from "./ayudas";

/** Destino de la navegación visible: enlace en la barra inferior (móvil) o pestaña de MUI Tabs (escritorio). */
const destino = (page: Page, name: string) => {
  const nav = page.getByRole("navigation", { name: "Principal" }).filter({ visible: true });
  return nav.getByRole("link", { name }).or(nav.getByRole("tab", { name }));
};

test.describe("Visitante", () => {
  test("ve el inicio, cómo entrar y nada se desborda", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Encuentra tu práctica");
    await expect(page.getByRole("link", { name: "Crear cuenta", exact: true })).toBeVisible();
    await expect(page.getByRole("banner").getByRole("link", { name: /^(Ingresar|Iniciar sesión)$/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "Inicia sesión" })).toBeVisible();
    await expect(page.getByText("Empieza gratis.", { exact: false })).toBeVisible();
    await expect(page.getByRole("link", { name: "Soy estudiante" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Soy empresa" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Política de tratamiento de datos" })).toBeVisible();
    const desborda = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(desborda).toBe(false);
    await sinViolaciones(page);
  });

  test("el primer Tab lleva a «Saltar al contenido»", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Saltar al contenido" })).toBeFocused();
  });

  test("una ruta inexistente muestra «no encontrada» con salida", async ({ page }) => {
    const res = await page.goto("/no-existe");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "No encontramos esta página" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Ir al inicio", exact: true })).toBeVisible();
    await sinViolaciones(page);
  });

  test("una sección protegida lleva a iniciar sesión y vuelve después", async ({ page, baseURL }) => {
    const otro = await nuevoContexto.newContext({ baseURL });
    const correo = await crearCuenta(otro, "empresa");
    await otro.dispose();
    await page.goto("/empresa/vacantes");
    await expect(page).toHaveURL(/\/ingresar\?next=%2Fempresa%2Fvacantes$/);
    await page.getByLabel("Correo").fill(correo);
    await page.getByLabel("Contraseña", { exact: true }).fill(CONTRASENA);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page).toHaveURL(/\/empresa\/vacantes$/);
    await expect(page.getByRole("heading", { name: "Mis vacantes" })).toBeVisible();
  });
});

test.describe("Con sesión", () => {
  test("la empresa navega por sus secciones", async ({ page }) => {
    await crearCuenta(page.request, "empresa");
    await page.goto("/empresa/vacantes");
    await expect(destino(page, "Mis vacantes")).toHaveAttribute("aria-current", "page");
    await destino(page, "Perfil de la empresa").click();
    await expect(page.getByRole("heading", { name: "Perfil de la empresa" })).toBeVisible();
    await expect(destino(page, "Perfil de la empresa")).toHaveAttribute("aria-current", "page");
    await sinViolaciones(page);
  });

  test("el estudiante tiene Inicio y Mi perfil", async ({ page }) => {
    await crearCuenta(page.request, "estudiante");
    await page.goto("/estudiante/perfil");
    await expect(destino(page, "Mi perfil")).toHaveAttribute("aria-current", "page");
    await destino(page, "Inicio").click();
    await expect(page).toHaveURL(/\/$/);
    await sinViolaciones(page);
  });

  test("otro rol ve «sin acceso» y no la sección", async ({ page }) => {
    await crearCuenta(page.request, "estudiante");
    await page.goto("/empresa/vacantes");
    await expect(page.getByRole("heading", { name: "No tienes acceso a esta sección" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Mis vacantes" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Ir a mi perfil" })).toBeVisible();
    await sinViolaciones(page);
  });

  test("el menú de cuenta se cierra con Escape y cierra la sesión", async ({ page }) => {
    const correo = await crearCuenta(page.request, "empresa");
    await page.goto("/empresa/vacantes");
    const cuenta = page.getByRole("button", { name: "Cuenta" }).filter({ visible: true });
    await cuenta.click();
    await expect(page.getByRole("menu")).toContainText(correo);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toBeHidden();
    await expect(cuenta).toBeFocused();
    await cuenta.click();
    await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("link", { name: "Crear cuenta", exact: true })).toBeVisible();
  });
});
