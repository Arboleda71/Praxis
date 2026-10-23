import { expect, type Page } from "@playwright/test";
import { crearCuenta, sinViolaciones, test, tokenDe } from "./ayudas";
test("la web envía cabeceras de seguridad sin revelar el framework", async ({
  page,
}) => {
  const res = await page.goto("/");
  expect(res?.headers()["x-powered-by"]).toBeUndefined();
  expect(res?.headers()["x-content-type-options"]).toBe("nosniff");
  expect(res?.headers()["x-frame-options"]).toBe("DENY");
});
const futuro = (dias: number) =>
  new Date(Date.now() + dias * 86400000).toISOString().slice(0, 10);
async function elegir(page: Page, campo: string, opcion: string) {
  await page.getByRole("combobox", { name: campo }).click();
  await page.getByRole("option", { name: opcion, exact: true }).click();
  await expect(page.locator('[role="listbox"]')).toHaveCount(0);
}
async function sinDesborde(page: Page) {
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    ),
  ).toBe(false);
}

test("MVP: publicar → buscar → comprobar → postular → seguir → notificar → retirar", async ({
  page,
  browser,
  baseURL,
}) => {
  const titulo = `Práctica de software ficticia ${Date.now()}`;
  const correo = await crearCuenta(page.request, "empresa");
  await page.goto(`/confirmar-correo?token=${tokenDe(correo)}`);
  expect(
    (await (await page.request.get("/api/auth/sesion")).json())
      .correoConfirmado,
  ).toBe(false);
  await page.getByRole("button", { name: "Confirmar mi correo" }).click();
  await expect(
    page.getByRole("heading", { name: "Tu correo quedó confirmado" }),
  ).toBeVisible();
  await page.goto("/empresa/vacantes/nueva");
  await page.getByRole("textbox", { name: "Título", exact: true }).fill(titulo);
  await page
    .getByRole("textbox", { name: "Descripción", exact: true })
    .fill("Práctica académica con datos ficticios para validar el recorrido.");
  await page.getByLabel(/Fecha de inicio/).fill(futuro(60));
  await page.getByLabel(/Vigencia/).fill(futuro(30));
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await page.getByRole("checkbox", { name: "Tecnólogo", exact: true }).check();
  await page
    .getByLabel("Programas solicitados (opcional)")
    .fill("Programa de referencia");
  await page
    .getByRole("checkbox", { name: "Aval deseable (no excluyente)" })
    .check();
  await sinViolaciones(page);
  await sinDesborde(page);
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await page
    .getByRole("button", { name: "Guardar borrador", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Mis vacantes", exact: true }),
  ).toBeVisible();
  let tarjeta = page.getByRole("article").filter({ hasText: titulo });
  await tarjeta.getByRole("button", { name: "Publicar", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirmar", exact: true })
    .click();
  await expect(tarjeta).toContainText("Abierta");

  const contexto = await browser.newContext({
    baseURL,
    viewport: page.viewportSize()!,
    extraHTTPHeaders: { Origin: baseURL! },
  });
  try {
    await crearCuenta(contexto.request, "estudiante");
    const alumno = await contexto.newPage();
    await alumno.goto("/estudiante/perfil/formacion");
    await elegir(alumno, "Nivel de formación *", "Tecnólogo");
    await alumno
      .getByLabel("Programa *", { exact: true })
      .fill("Programa diferente al solicitado");
    await alumno.getByRole("button", { name: "Guardar", exact: true }).click();
    await expect(alumno.getByText("Perfil mínimo incompleto")).toBeVisible();
    await alumno
      .locator('input[type="file"]')
      .last()
      .setInputFiles({
        name: "cv-ficticio.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("%PDF-1.4\nHoja de vida ficticia"),
      });
    await expect(alumno.getByText("Perfil mínimo completo")).toBeVisible();
    await alumno.goto("/estudiante/vacantes");
    await alumno.getByLabel("Buscar por título").fill(titulo);
    await alumno.getByRole("button", { name: "Buscar", exact: true }).click();
    await alumno
      .getByRole("article")
      .filter({ hasText: titulo })
      .getByRole("link", { name: "Ver requisitos" })
      .click();
    await expect(
      alumno.getByText(/La empresa revisa la afinidad/),
    ).toBeVisible();
    await expect(
      alumno.getByRole("button", { name: "Postularme", exact: true }),
    ).toBeEnabled();
    await sinViolaciones(alumno);
    await sinDesborde(alumno);
    await alumno
      .getByRole("button", { name: "Postularme", exact: true })
      .click();
    await alumno
      .getByRole("dialog")
      .getByRole("button", { name: "Enviar postulación", exact: true })
      .click();
    await expect(
      alumno.getByRole("heading", { name: "Mis postulaciones", exact: true }),
    ).toBeVisible();
    await expect(
      alumno.getByRole("article").filter({ hasText: titulo }),
    ).toContainText("Enviada");

    await page.goto("/empresa/vacantes");
    tarjeta = page.getByRole("article").filter({ hasText: titulo });
    await tarjeta.getByRole("button", { name: "Cerrar vacante" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Confirmar", exact: true })
      .click();
    await expect(tarjeta).toContainText("Cerrada");
    await tarjeta.getByRole("link", { name: "Ver postulaciones" }).click();
    await page.getByRole("link", { name: "Abrir postulación" }).click();
    await expect(
      page.getByRole("heading", { name: "Laura Gómez Restrepo", exact: true }),
    ).toBeVisible();
    await elegir(page, "Nuevo estado", "En revisión");
    await page.getByRole("button", { name: "Actualizar estado" }).click();
    await expect(page.getByText("En revisión", { exact: true })).toBeVisible();
    await sinViolaciones(page);
    await sinDesborde(page);
    await alumno.reload();
    await expect(
      alumno.getByText("En revisión", { exact: true }),
    ).toBeVisible();
    await sinViolaciones(alumno);
    await alumno.goto("/notificaciones");
    await expect(
      alumno.getByText(`Postulación a ${titulo}: En revisión.`),
    ).toBeVisible();
    await sinViolaciones(alumno);
    await alumno.goto("/estudiante/postulaciones");
    await alumno.getByRole("button", { name: "Retirar postulación" }).click();
    await alumno
      .getByRole("dialog")
      .getByRole("button", { name: "Confirmar retirada" })
      .click();
    await expect(alumno.getByText("Retirada", { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText("Retirada", { exact: true })).toBeVisible();
  } finally {
    await contexto.close();
  }
});

test("planes: muestra sandbox sin simular conexión ni activación", async ({
  page,
}) => {
  await crearCuenta(page.request, "empresa");
  await page.goto("/empresa/planes");
  await expect(
    page.getByRole("heading", { name: "Planes y pagos", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/Los pagos de prueba aún no están conectados/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Pagar Básico en sandbox" }),
  ).toBeDisabled();
  await sinViolaciones(page);
  await sinDesborde(page);
});
