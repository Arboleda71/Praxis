import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import VacantesRecientes from "./VacantesRecientes";

vi.mock("@/lib/session", () => ({ API_URL: "http://api.test" }));

const AVISO = "No pudimos cargar las últimas prácticas.Inténtalo de nuevo en unos momentos.";
/** Componente de servidor: se espera su HTML y luego se pinta como lo haría Next. */
async function pintar(respuesta: () => Promise<Response>) {
  vi.stubGlobal("fetch", vi.fn(respuesta));
  render(await VacantesRecientes());
}

describe("VacantesRecientes (inicio del visitante)", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  test("muestra cada oferta con sus datos básicos y el enlace a ingresar que vuelve a ella", async () => {
    await pintar(async () =>
      new Response(
        JSON.stringify([
          {
            id: "v1",
            titulo: "Practicante de QA",
            modalidad: "hibrida",
            ciudad: "Medellín",
            vigencia: "2027-04-30T00:00:00.000Z",
            empresa: { razonSocial: "Andina Soft S.A.S." },
          },
        ]),
      ),
    );
    expect(screen.getByRole("heading", { level: 3, name: "Practicante de QA" })).toBeTruthy();
    expect(screen.getByText("Andina Soft S.A.S. · Híbrida Medellín · Vigencia: 30 de abril de 2027")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ingresar para consultar" }).getAttribute("href")).toBe(
      "/ingresar?next=%2Festudiante%2Fvacantes%2Fv1",
    );
  });

  test("sin ofertas muestra el estado vacío", async () => {
    await pintar(async () => new Response("[]"));
    expect(screen.getByText("No hay prácticas abiertas todavía.")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  // El inicio nunca falla entero por este bloque: con cualquier fallo de la API se ve el aviso.
  test.each([
    ["sin red", () => Promise.reject(new TypeError("fetch failed"))],
    ["error del servidor", async () => new Response("{}", { status: 500 })],
    ["cuerpo que no es JSON", async () => new Response("<html>ok</html>")],
    ["JSON que no es una lista", async () => new Response('{"mensaje":"x"}')],
    [
      "el cuerpo no termina de llegar (tiempo agotado)",
      async () => new Response(new ReadableStream({ start: (c) => c.error(new DOMException("timeout", "TimeoutError")) })),
    ],
  ])("%s: muestra el aviso en lugar de romper el inicio", async (_, respuesta) => {
    await pintar(respuesta);
    expect(screen.getByRole("alert").textContent).toBe(AVISO);
    expect(screen.queryByRole("article")).toBeNull();
  });
});
