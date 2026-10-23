import { expect, request as nuevoContexto } from "@playwright/test";
import {
  CONTRASENA,
  correoUnico,
  crearCuenta,
  nitUnico,
  sinViolaciones,
  test,
  tokenDe,
} from "./ayudas";

test.describe("Crear cuenta", () => {
  test("elegir tipo lleva a cada formulario", async ({ page }) => {
    await page.goto("/registro");
    await sinViolaciones(page);
    await page.getByRole("link", { name: /Soy empresa/ }).click();
    await expect(
      page.getByRole("heading", { name: "Crea la cuenta de tu empresa" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Cambiar tipo de cuenta" }).click();
    await page.getByRole("link", { name: /Soy estudiante/ }).click();
    await expect(
      page.getByRole("heading", { name: "Crea tu cuenta de estudiante" }),
    ).toBeVisible();
  });

  test("estudiante: se registra, confirma el correo y llega a su perfil", async ({
    page,
  }) => {
    const correo = correoUnico("estudiante");
    await page.goto("/registro/estudiante");
    await sinViolaciones(page);
    await page.getByLabel("Nombre completo").fill("Laura Gómez Restrepo");
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
    await expect(
      page.getByRole("main").getByText(correo, { exact: true }),
    ).toBeVisible();
    await sinViolaciones(page);

    await page.goto(`/confirmar-correo?token=${tokenDe(correo)}`);
    await page.getByRole("button", { name: "Confirmar mi correo" }).click();
    await expect(
      page.getByRole("heading", { name: "Tu correo quedó confirmado" }),
    ).toBeVisible();
    await sinViolaciones(page);
    await page.getByRole("link", { name: "Ir a mi perfil" }).click();
    await expect(
      page.getByRole("heading", { name: "Empieza por tu perfil mínimo" }),
    ).toBeVisible();
    await expect(page.getByText("Confirma tu correo")).toHaveCount(0);
  });

  test("estudiante: los errores aparecen junto a cada campo y el resumen recibe el foco", async ({
    page,
  }) => {
    await page.goto("/registro/estudiante");
    await page.getByLabel("Nombre completo").fill("Laura Gómez");
    await page.getByLabel("Correo").fill("laura@");
    await page.getByLabel("Contraseña", { exact: true }).fill("corta1");
    await page.getByLabel("Confirmar contraseña").fill("otra");
    await page.getByRole("button", { name: "Crear cuenta" }).click();

    await expect(page.getByText("Revisa 4 campos")).toBeVisible();
    await expect(
      page.getByText("Debe tener al menos 10 caracteres. Llevas 6."),
    ).toBeVisible();
    await expect(page.getByText("Las contraseñas no coinciden.")).toBeVisible();
    await expect(
      page.getByText("Debes aceptar la política para continuar."),
    ).toBeVisible();
    await expect(page.getByLabel("Correo")).toHaveAccessibleDescription(
      /correo válido/,
    );
    await sinViolaciones(page);
  });

  test("un correo ya registrado se rechaza junto al campo", async ({
    page,
    baseURL,
  }) => {
    const otro = await nuevoContexto.newContext({
      baseURL,
      extraHTTPHeaders: { Origin: baseURL! },
    });
    const correo = await crearCuenta(otro, "estudiante");
    await otro.dispose();
    await page.goto("/registro/estudiante");
    await page.getByLabel("Nombre completo").fill("Laura Gómez");
    await page.getByLabel("Correo").fill(correo);
    await page.getByLabel("Contraseña", { exact: true }).fill(CONTRASENA);
    await page.getByLabel("Confirmar contraseña").fill(CONTRASENA);
    await page
      .getByRole("checkbox", { name: /Autorizo el tratamiento/ })
      .check();
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(
      page.getByText("Este correo ya tiene una cuenta. Inicia sesión."),
    ).toBeVisible();
  });

  test("empresa: el NIT se valida con el dígito de la DIAN y luego crea la cuenta", async ({
    page,
  }) => {
    const nit = nitUnico();
    const malo = nit.slice(0, -1) + ((Number(nit.at(-1)) + 1) % 10);
    await page.goto("/registro/empresa");
    await page.getByLabel("Razón social").fill("Andina Soft S.A.S.");
    await page.getByLabel("NIT con dígito de verificación").fill(malo);
    await page.getByLabel("Correo").fill(correoUnico("empresa"));
    await page.getByLabel("Contraseña", { exact: true }).fill(CONTRASENA);
    await page.getByLabel("Confirmar contraseña").fill(CONTRASENA);
    await page
      .getByRole("checkbox", { name: /Autorizo el tratamiento/ })
      .check();
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(
      page.getByText(
        "El dígito de verificación no corresponde a este NIT. Revísalo en tu RUT.",
      ),
    ).toBeVisible();

    await page.getByLabel("NIT con dígito de verificación").fill(nit);
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(
      page.getByRole("heading", { name: "Revisa tu correo" }),
    ).toBeVisible();
    await expect(
      page.getByText("Lo necesitas para publicar vacantes"),
    ).toBeVisible();
  });
});

test.describe("Confirmar el correo", () => {
  test("un enlace inválido o vencido explica qué hacer", async ({ page }) => {
    await page.goto("/confirmar-correo?token=este-token-no-existe-0000");
    await expect(
      page.getByRole("heading", { name: "Este enlace ya no sirve" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Inicia sesión para pedir otro" }),
    ).toBeVisible();
    await sinViolaciones(page);
  });

  test("con sesión sin confirmar se ve el aviso y se puede reenviar", async ({
    page,
  }) => {
    await crearCuenta(page.request, "estudiante");
    await page.goto("/estudiante/perfil");
    await expect(page.getByText("Confirma tu correo")).toBeVisible();
    await sinViolaciones(page);
  });

  test("reenviar el enlace pide esperar un minuto", async ({ page }) => {
    await crearCuenta(page.request, "empresa");
    await page.goto("/revisa-tu-correo");
    await page.getByRole("button", { name: "Reenviar enlace" }).click();
    await expect(
      page.getByRole("button", { name: /Reenviar en \d+ s/ }),
    ).toBeDisabled();
  });
});

test.describe("Iniciar sesión", () => {
  test("con error genérico y luego con datos correctos", async ({
    page,
    baseURL,
  }) => {
    const otro = await nuevoContexto.newContext({
      baseURL,
      extraHTTPHeaders: { Origin: baseURL! },
    });
    const correo = await crearCuenta(otro, "estudiante");
    await otro.dispose();
    await page.goto("/ingresar");
    await sinViolaciones(page);
    await page.getByLabel("Correo").fill(correo);
    await page.getByLabel("Contraseña", { exact: true }).fill("equivocada");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(
      page.getByText("Correo o contraseña incorrectos"),
    ).toBeVisible();
    await sinViolaciones(page);

    await page.getByLabel("Contraseña", { exact: true }).fill(CONTRASENA);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page).toHaveURL(/\/estudiante\/perfil$/);
  });

  test("con sesión, ingresar y crear cuenta llevan a la sección del rol", async ({
    page,
  }) => {
    await crearCuenta(page.request, "empresa");
    await page.goto("/ingresar");
    await expect(page).toHaveURL(/\/empresa\/vacantes$/);
    await page.goto("/registro");
    await expect(page).toHaveURL(/\/empresa\/vacantes$/);
  });
});

test("la política de datos se puede leer", async ({ page }) => {
  await page.goto("/politica-de-datos");
  await expect(
    page.getByRole("heading", { name: "Política de tratamiento de datos" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Tus derechos/ }),
  ).toBeVisible();
  await sinViolaciones(page);
});

test("la contraseña se puede mostrar y ocultar", async ({ page }) => {
  await page.goto("/ingresar");
  const campo = page.getByLabel("Contraseña", { exact: true });
  await campo.fill(CONTRASENA);
  await expect(campo).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Mostrar contraseña" }).click();
  await expect(campo).toHaveAttribute("type", "text");
});

test.describe("NIT repetido", () => {
  test("una sola cuenta por empresa", async ({ page, baseURL }) => {
    const otro = await nuevoContexto.newContext({
      baseURL,
      extraHTTPHeaders: { Origin: baseURL! },
    });
    const nit = nitUnico();
    const r = await otro.post("/api/auth/registro/empresa", {
      data: {
        razonSocial: "Andina Soft S.A.S.",
        nit,
        correo: correoUnico("empresa"),
        contrasena: CONTRASENA,
        confirmarContrasena: CONTRASENA,
        autorizaDatos: true,
      },
    });
    expect(r.status()).toBe(201);
    await otro.dispose();
    await page.goto("/registro/empresa");
    await page.getByLabel("Razón social").fill("Otra S.A.S.");
    await page.getByLabel("NIT con dígito de verificación").fill(nit);
    await page.getByLabel("Correo").fill(correoUnico("empresa"));
    await page.getByLabel("Contraseña", { exact: true }).fill(CONTRASENA);
    await page.getByLabel("Confirmar contraseña").fill(CONTRASENA);
    await page
      .getByRole("checkbox", { name: /Autorizo el tratamiento/ })
      .check();
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(
      page.getByText("Ya existe una cuenta para este NIT."),
    ).toBeVisible();
  });
});
