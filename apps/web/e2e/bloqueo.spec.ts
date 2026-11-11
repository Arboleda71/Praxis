import {
  expect,
  request as nuevoContexto,
  type APIRequestContext,
} from "@playwright/test";
import { crearCuenta, sinViolaciones, test } from "./ayudas";

// Corre al final (proyecto «bloqueo»): deja el origen de este caso bloqueado 15 minutos.
test("tras 5 intentos fallidos, el inicio de sesión se bloquea", async ({
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
  await page.getByLabel("Correo").fill(correo);
  for (let i = 0; i < 5; i++) {
    await page
      .getByLabel("Contraseña", { exact: true })
      .fill(`equivocada-${i}`);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(
      page.getByText("Correo o contraseña incorrectos"),
    ).toBeVisible();
  }
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByText("Demasiados intentos")).toBeVisible();
  // Spec 011 (PM009): el aviso dice el tiempo real que informa la API.
  await expect(
    page.getByRole("alert").filter({ hasText: "Demasiados intentos" }),
  ).toContainText(
    /espera 15 minutos e inténtalo de nuevo. El formulario se activará solo a las/,
  );
  await expect(
    page.getByRole("button", { name: "Iniciar sesión" }),
  ).toBeDisabled();
  await sinViolaciones(page);
});

// Spec 011 (FR-001): la API solo cree la IP que le declara la web de Praxis con su secreto.
test.describe("origen de la petición a través de la web", () => {
  let n = 0;
  const fallar = (req: APIRequestContext, headers: Record<string, string>) =>
    req
      .post("/api/auth/login", {
        headers,
        data: {
          correo: `nadie-${Date.now()}-${n++}@correo.co`,
          contrasena: "equivocada",
        },
      })
      .then((r) => r.status());

  test("declarar otra IP en las cabeceras de Praxis no da intentos extra", async ({
    request,
  }) => {
    const falsa = (i: number) => ({
      "x-praxis-ip": `198.51.100.${i}`,
      "x-praxis-proxy": "adivinado",
    });
    for (let i = 0; i < 30; i++)
      expect(await fallar(request, falsa(i))).toBe(401);
    expect(await fallar(request, falsa(31))).toBe(429);
  });

  test("la web entrega a la API la IP de cada visitante", async ({
    request,
  }) => {
    // En local, Next conserva el X-Forwarded-For del cliente; en Vercel la plataforma lo sobrescribe con
    // la IP real. Aquí sirve para simular visitantes distintos y comprobar que cada uno es un origen.
    const visitante = (i: number) => ({ "X-Forwarded-For": `203.0.113.${i}` });
    for (let i = 0; i < 31; i++)
      expect(await fallar(request, visitante(i))).toBe(401);
    for (let i = 0; i < 30; i++)
      expect(await fallar(request, visitante(200))).toBe(401);
    expect(await fallar(request, visitante(200))).toBe(429);
    expect(await fallar(request, visitante(201))).toBe(401);
  });
});
