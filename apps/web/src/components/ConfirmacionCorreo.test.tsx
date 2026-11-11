import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import ConfirmacionCorreo from "./ConfirmacionCorreo";

// Spec 011 (PM008): un fallo de conexión no es un enlace vencido.
describe("ConfirmacionCorreo", () => {
  const SIN_CONEXION = "No pudimos conectar. Inténtalo de nuevo.";
  const confirmar = () => screen.queryByRole("button", { name: "Confirmar mi correo" });
  function pulsar(respuesta: Response | Error) {
    const fetchFalso = vi.fn(() => (respuesta instanceof Error ? Promise.reject(respuesta) : Promise.resolve(respuesta)));
    vi.stubGlobal("fetch", fetchFalso);
    render(<ConfirmacionCorreo token="token-ficticio" />);
    fireEvent.click(confirmar()!);
    return fetchFalso;
  }
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  test.each([
    ["sin red", new TypeError("Failed to fetch")],
    ["error del servidor", new Response('{"mensaje":"No pudimos completar la operación."}', { status: 500 })],
    ["respuesta que no es JSON", new Response("<html>502</html>", { status: 502 })],
    ["demasiadas peticiones", new Response("{}", { status: 429 })],
  ])("%s: avisa del fallo de conexión y deja reintentar con el mismo enlace", async (_, respuesta) => {
    pulsar(respuesta);
    expect((await screen.findByRole("alert")).textContent).toBe(SIN_CONEXION);
    expect(screen.getByRole("heading").textContent).toBe("Confirma tu correo");
    expect((confirmar() as HTMLButtonElement).disabled).toBe(false);
    expect(screen.queryByText("Inicia sesión para pedir otro")).toBeNull();
  });

  test.each([410, 400])("%i: el enlace ya no sirve y se ofrece pedir otro", async (estado) => {
    pulsar(new Response('{"mensaje":"Este enlace ya no sirve."}', { status: estado }));
    expect((await screen.findByRole("heading", { name: "Este enlace ya no sirve" })).textContent).toBeTruthy();
    expect(confirmar()).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
    // El botón pulsado desapareció: el foco va al título que dice el resultado, no a la nada.
    expect(document.activeElement).toBe(screen.getByRole("heading"));
    expect(screen.getByRole("link", { name: "Inicia sesión para pedir otro" }).getAttribute("href")).toBe(
      "/ingresar?next=/revisa-tu-correo",
    );
  });

  test("tras un fallo de conexión, el reintento confirma", async () => {
    const fetchFalso = pulsar(new TypeError("Failed to fetch"));
    await screen.findByRole("alert");
    fetchFalso.mockResolvedValueOnce(new Response('{"rol":"empresa"}', { status: 200 }));
    fireEvent.click(confirmar()!);
    expect((await screen.findByRole("heading", { name: "Tu correo quedó confirmado" })).textContent).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("heading"));
    expect(screen.getByRole("link", { name: "Ir al perfil de la empresa" }).getAttribute("href")).toBe("/empresa/perfil");
    expect(fetchFalso).toHaveBeenCalledTimes(2);
  });

  test("sin token, la página ya dice que el enlace no sirve", () => {
    render(<ConfirmacionCorreo />);
    expect(screen.getByRole("heading").textContent).toBe("Este enlace ya no sirve");
    expect(confirmar()).toBeNull();
    // Al cargar no se roba el foco: solo se mueve tras una acción de la persona.
    expect(document.activeElement).toBe(document.body);
  });
});
