import { expect, type Page } from "@playwright/test";
import { crearCuenta, sinViolaciones, test } from "./ayudas";

const MB = 1024 * 1024;
const pdf = (bytes = 3000) => ({
  name: "hoja-de-vida.pdf",
  mimeType: "application/pdf",
  buffer: Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(bytes - 9, 0x20)]),
});
const png = { name: "yo.png", mimeType: "image/png", buffer: Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(300)]) };

async function elegir(page: Page, campo: RegExp, opcion: string) {
  await page.getByRole("combobox", { name: campo }).click();
  await page.getByRole("option", { name: opcion, exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  await crearCuenta(page.request, "estudiante");
});

test("perfil mínimo: guía, formación con programa en texto libre y hoja de vida", async ({ page }) => {
  await page.goto("/estudiante/perfil");
  await expect(page.getByRole("heading", { name: "Empieza por tu perfil mínimo" })).toBeVisible();
  await sinViolaciones(page);

  await page.getByRole("link", { name: "Completar mi formación" }).click();
  await expect(page.getByRole("heading", { name: "Formación", exact: true })).toBeVisible();
  await elegir(page, /Nivel de formación/, "Tecnólogo");
  await page.getByRole("textbox", { name: /Programa/ }).fill("Tecnología en análisis y desarrollo de software");
  await sinViolaciones(page);
  await page.getByRole("button", { name: "Guardar" }).click();

  await expect(page.getByText("Guardamos tu formación.")).toBeVisible();
  await expect(page.getByText("Perfil mínimo incompleto")).toBeVisible();
  await expect(page.getByText("Para postularte te falta: hoja de vida.")).toBeVisible();
  await expect(page.getByText("Tecnología en análisis y desarrollo de software")).toBeVisible();
  await sinViolaciones(page);

  await page.locator('input[type="file"]').last().setInputFiles(pdf());
  await expect(page.getByText("Perfil mínimo completo")).toBeVisible();
  await expect(page.getByText("hoja-de-vida.pdf")).toBeVisible();
  await sinViolaciones(page);
});

test("al cambiar el nivel se vacía el avance que ya no corresponde; el programa se conserva", async ({ page }) => {
  await page.goto("/estudiante/perfil/formacion");
  await elegir(page, /Nivel de formación/, "Universitario");
  await page.getByRole("textbox", { name: /Programa/ }).fill("Ingeniería Mecatrónica");
  await elegir(page, /Avance académico/, "6.º semestre");
  await elegir(page, /Nivel de formación/, "Técnico");
  await expect(page.getByText("Cambiaste el nivel: elige de nuevo el avance.")).toBeVisible();
  await expect(page.getByRole("textbox", { name: /Programa/ })).toHaveValue("Ingeniería Mecatrónica");
});

test("un programa demasiado corto se marca en su campo", async ({ page }) => {
  await page.goto("/estudiante/perfil/formacion");
  await page.getByRole("textbox", { name: /Programa/ }).fill("In");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Escribe el nombre completo de tu programa.")).toBeVisible();
  await sinViolaciones(page);
});

test("archivos: rechaza otro formato y más de 5 MB diciendo por qué", async ({ page }) => {
  await page.goto("/estudiante/perfil/hoja-de-vida");
  const input = page.locator('input[type="file"]');
  await input.setInputFiles({ name: "cv.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", buffer: Buffer.from("PK") });
  await expect(page.getByText("No subimos «cv.docx»")).toBeVisible();
  await expect(page.getByText("Solo se aceptan archivos PDF. Guárdalo como PDF y vuelve a elegirlo.")).toBeVisible();
  await sinViolaciones(page);
  await input.setInputFiles(pdf(6 * MB));
  await expect(page.getByText("Pesa 6 MB y el máximo es 5 MB.")).toBeVisible();
});

test("idiomas: un idioma repetido no se guarda y se marca en su fila", async ({ page }) => {
  await page.goto("/estudiante/perfil/disponibilidad");
  await page.getByRole("button", { name: "Agregar idioma" }).click();
  await page.getByRole("button", { name: "Agregar idioma" }).click();
  await page.getByRole("combobox", { name: "Idioma" }).nth(1).click();
  await page.getByRole("option", { name: "Inglés", exact: true }).click();
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Ya agregaste este idioma.")).toBeVisible();
  await sinViolaciones(page);

  await page.getByRole("button", { name: "Quitar Inglés" }).nth(1).click();
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Guardamos tu disponibilidad e idiomas.")).toBeVisible();
  await expect(page.getByRole("region", { name: "Idiomas" }).getByText("A1 · Principiante")).toBeVisible();
});

test("aval declarado, nunca verificado, y foto opcional", async ({ page }) => {
  await page.goto("/estudiante/perfil/aval");
  await page.getByRole("radio", { name: "Sí" }).check();
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Aval declarado (sin soporte)")).toBeVisible();
  await expect(page.getByText(/verificad/i)).toHaveCount(0);

  await page.locator('input[type="file"][accept^="image"]').setInputFiles(png);
  await expect(page.getByRole("img", { name: "Foto de perfil de Laura Gómez Restrepo" })).toBeVisible();
  await sinViolaciones(page);
  await page.getByRole("button", { name: "Quitar foto" }).click();
  await expect(page.getByRole("button", { name: "Agregar foto (opcional)" })).toBeVisible();
});
