import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import Notificaciones from "./Notificaciones";

const avisos = (texto: string) =>
  new Response(
    JSON.stringify({
      items: [{ id: "n1", texto, creadaEn: "2026-11-12T15:00:00.000Z", leidaEn: null }],
      total: 1,
      pagina: 1,
      sinLeer: 1,
    }),
  );
const fallo = () => new Response('{"mensaje":"No pudimos completar la operación."}', { status: 500 });
const actualizar = () => screen.getByRole("button", { name: "Actualizar notificaciones" });

describe("Notificaciones", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  test("una actualización que sale bien quita el aviso del fallo anterior", async () => {
    const fetchFalso = vi.fn<() => Promise<Response>>().mockResolvedValueOnce(avisos("Aviso viejo"));
    vi.stubGlobal("fetch", fetchFalso);
    render(<Notificaciones />);
    await screen.findByText("Aviso viejo");

    fetchFalso.mockResolvedValueOnce(fallo());
    fireEvent.click(actualizar());
    expect((await screen.findByRole("alert")).textContent).toBe("No pudimos completar la operación.Reintentar");
    // La lista vieja ya no corresponde a lo pedido: no se deja bajo el aviso como si fuera actual.
    expect(screen.queryByText("Aviso viejo")).toBeNull();
    expect(screen.queryByText("Cargando…")).toBeNull();

    fetchFalso.mockResolvedValueOnce(avisos("Aviso reciente"));
    fireEvent.click(actualizar());
    await screen.findByText("Aviso reciente");
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  });

  test("si falla la carga inicial, «Reintentar» vuelve a pedir y muestra los datos", async () => {
    const fetchFalso = vi.fn<() => Promise<Response>>().mockResolvedValueOnce(fallo());
    vi.stubGlobal("fetch", fetchFalso);
    render(<Notificaciones />);
    await screen.findByRole("alert");
    expect(screen.getByRole("status").textContent).toBe("");
    fetchFalso.mockResolvedValueOnce(avisos("Aviso reciente"));
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    await screen.findByText("Aviso reciente");
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  });

  test("si falla la carga inicial, actualizar con éxito muestra los datos sin el aviso", async () => {
    const fetchFalso = vi.fn<() => Promise<Response>>().mockResolvedValueOnce(fallo());
    vi.stubGlobal("fetch", fetchFalso);
    render(<Notificaciones />);
    await screen.findByRole("alert");

    fetchFalso.mockResolvedValueOnce(avisos("Aviso reciente"));
    fireEvent.click(actualizar());
    await screen.findByText("Aviso reciente");
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  });
});
