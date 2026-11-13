import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import FormularioOlvide from "./FormularioOlvide";

// Spec 012: la respuesta nunca dice si el correo tiene cuenta.
describe("FormularioOlvide", () => {
  function pedir(respuesta: Response | Error, correo = "laura@correo.co") {
    const fetchFalso = vi.fn(() => (respuesta instanceof Error ? Promise.reject(respuesta) : Promise.resolve(respuesta)));
    vi.stubGlobal("fetch", fetchFalso);
    render(<FormularioOlvide />);
    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: correo } });
    fireEvent.submit(screen.getByRole("button", { name: "Enviar enlace" }).closest("form")!);
    return fetchFalso;
  }
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  test("al enviar muestra el mismo mensaje neutro y lleva el foco al título", async () => {
    const fetchFalso = pedir(new Response(null, { status: 204 }), " Laura@Correo.co ");
    const titulo = await screen.findByRole("heading", { name: "Revisa tu correo" });
    expect(screen.getByText(/Si el correo está registrado, te enviamos un enlace/)).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(titulo));
    expect(screen.queryByLabelText("Correo")).toBeNull();
    expect(fetchFalso).toHaveBeenCalledWith(
      "/api/auth/olvide-contrasena",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ correo: "laura@correo.co" }) }),
    );
  });

  test("un correo mal escrito se corrige en el campo y no se envía", () => {
    const fetchFalso = pedir(new Response(null, { status: 204 }), "laura");
    expect(screen.getByText("Escribe un correo válido, por ejemplo nombre@correo.co.")).toBeTruthy();
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  test("demasiadas solicitudes: muestra cuánto esperar y deja el formulario", async () => {
    const mensaje = "Demasiados intentos. Espera 42 minutos e inténtalo de nuevo.";
    pedir(new Response(JSON.stringify({ mensaje, segundos: 2500 }), { status: 429 }));
    expect((await screen.findByRole("alert")).textContent).toBe(mensaje);
    expect(screen.getByLabelText("Correo")).toBeTruthy();
  });

  test.each([
    ["sin red", new TypeError("Failed to fetch")],
    ["error del servidor", new Response("<html>502</html>", { status: 502 })],
  ])("%s: avisa del fallo de conexión y deja reintentar", async (_, respuesta) => {
    pedir(respuesta);
    expect((await screen.findByRole("alert")).textContent).toBe("No pudimos conectar. Inténtalo de nuevo.");
    expect((screen.getByRole("button", { name: "Enviar enlace" }) as HTMLButtonElement).disabled).toBe(false);
  });
});
