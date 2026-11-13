import {
  expect,
  request as nuevoContexto,
  type APIRequestContext,
} from "@playwright/test";
import { CONTRASENA, crearCuenta, sinViolaciones, test, tokenDe } from "./ayudas";

/** M6 en el navegador: lo que solo se ve recorriendo la web (sesión, redirecciones, teclado). */
const futuro = (dias: number) =>
  new Date(Date.now() + dias * 86400000).toISOString().slice(0, 10);

/** Una empresa confirmada publica una vacante por la API; devuelve su id y título. */
async function publicada(api: APIRequestContext) {
  const correo = await crearCuenta(api, "empresa");
  expect(
    (await api.post("/api/auth/confirmar-correo", { data: { token: tokenDe(correo) } })).status(),
  ).toBe(200);
  const titulo = `Práctica M6 ${Date.now()}`;
  const creada = await api.post("/api/empresa/vacantes", {
    data: {
      titulo,
      descripcion: "Práctica académica con datos ficticios.",
      modalidad: "remota",
      ciudad: null,
      duracionMeses: 6,
      fechaInicio: futuro(60),
      vigencia: futuro(30),
      niveles: ["tecnologo"],
      programas: [],
      avances: [],
      aval: false,
      jornada: "tiempo-completo",
      idiomas: [],
    },
  });
  expect(creada.status()).toBe(201);
  const { id } = (await creada.json()) as { id: string };
  expect((await api.post(`/api/empresa/vacantes/${id}/publicar`)).status()).toBe(201);
  return { id, titulo };
}

test.describe("M6", () => {
  test("T1: el visitante ve la práctica en el inicio, ingresa y vuelve a ella; con sesión el bloque no aparece", async ({
    page,
    baseURL,
  }) => {
    const api = await nuevoContexto.newContext({ baseURL, extraHTTPHeaders: { Origin: baseURL! } });
    const { id, titulo } = await publicada(api);
    await api.dispose();
    const alumno = await nuevoContexto.newContext({ baseURL, extraHTTPHeaders: { Origin: baseURL! } });
    const correo = await crearCuenta(alumno, "estudiante");
    await alumno.dispose();

    await page.goto("/");
    const bloque = page.getByRole("region", { name: "Últimas cinco prácticas abiertas" });
    // La base del navegador es compartida: puede haber menos de cinco abiertas, nunca más.
    expect(await bloque.getByRole("article").count()).toBeLessThanOrEqual(5);
    const oferta = bloque.getByRole("article").filter({ hasText: titulo });
    await expect(oferta).toContainText("Remota · Vigencia:");
    // Sin búsqueda ni filtros para el visitante.
    await expect(page.getByLabel("Buscar por título")).toHaveCount(0);
    await sinViolaciones(page);

    await oferta.getByRole("link", { name: "Ingresar para consultar" }).click();
    await expect(page).toHaveURL(new RegExp(`/ingresar\\?next=%2Festudiante%2Fvacantes%2F${id}$`));
    await page.getByLabel("Correo").fill(correo);
    await page.getByLabel("Contraseña", { exact: true }).fill(CONTRASENA);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page).toHaveURL(new RegExp(`/estudiante/vacantes/${id}$`));
    await expect(page.getByRole("heading", { level: 1, name: titulo })).toBeVisible();

    await page.goto("/");
    await expect(page.getByRole("region", { name: "Últimas cinco prácticas abiertas" })).toHaveCount(0);
  });

  test("T3: sin perfil mínimo no puede postularse y se le lleva a completarlo", async ({ page, baseURL }) => {
    const api = await nuevoContexto.newContext({ baseURL, extraHTTPHeaders: { Origin: baseURL! } });
    const { id } = await publicada(api);
    await api.dispose();
    await crearCuenta(page.request, "estudiante");

    await page.goto(`/estudiante/vacantes/${id}`);
    await expect(page.getByText("Tu programa: Falta información.")).toBeVisible();
    await expect(
      page.getByRole("listitem").filter({ hasText: "Nivel de formación" }),
    ).toContainText("Falta información");
    await expect(page.getByRole("button", { name: "Postularme" })).toBeDisabled();
    await sinViolaciones(page);
    await page.getByRole("link", { name: "Completar perfil" }).click();
    await expect(page).toHaveURL(/\/estudiante\/perfil$/);
  });

  test("T4: el diálogo de postulación se usa con teclado y Escape no envía nada", async ({ page, baseURL }) => {
    const api = await nuevoContexto.newContext({ baseURL, extraHTTPHeaders: { Origin: baseURL! } });
    const { id } = await publicada(api);
    await api.dispose();
    await crearCuenta(page.request, "estudiante");
    expect(
      (
        await page.request.put("/api/perfil/formacion", {
          data: { nivelFormacion: "tecnologo", programa: "Programa libre", avance: null, institucion: null },
        })
      ).status(),
    ).toBe(200);
    expect(
      (
        await page.request.put("/api/perfil/archivos/hoja-de-vida", {
          multipart: { archivo: { name: "cv.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\nFicticio") } },
        })
      ).status(),
    ).toBe(200);

    await page.goto(`/estudiante/vacantes/${id}`);
    const postularme = page.getByRole("button", { name: "Postularme" });
    await postularme.focus();
    await page.keyboard.press("Enter");
    const dialogo = page.getByRole("dialog", { name: "Enviar postulación" });
    await expect(dialogo).toBeVisible();
    // El foco queda dentro del diálogo mientras está abierto.
    await expect.poll(() => dialogo.evaluate((d) => d.contains(document.activeElement))).toBe(true);
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("Tab");
      expect(await dialogo.evaluate((d) => d.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(dialogo).toHaveCount(0);
    // Al cerrar, el foco vuelve al botón que abrió el diálogo y no se envió nada.
    await expect(postularme).toBeFocused();
    expect((await (await page.request.get("/api/postulaciones")).json()).total).toBe(0);
  });
});
