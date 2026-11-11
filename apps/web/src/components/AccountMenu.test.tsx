import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import AccountMenu from "./AccountMenu";

const acciones = vi.hoisted(() => ({ logout: vi.fn() }));
vi.mock("@/lib/actions", () => acciones);

// Spec 011 (PM005): si no se pudo cerrar la sesión, se avisa y la persona sigue viéndose dentro.
describe("AccountMenu: cerrar sesión", () => {
  const ERROR = "No pudimos cerrar tu sesión. Inténtalo de nuevo.";
  async function cerrarSesion() {
    fireEvent.click(screen.getAllByRole("button", { name: /Cuenta/ })[0]);
    fireEvent.click(await screen.findByRole("menuitem", { name: "Cerrar sesión" }));
  }
  afterEach(() => {
    cleanup();
    acciones.logout.mockReset();
  });

  test("si la API falla, avisa y deja reintentar", async () => {
    acciones.logout.mockResolvedValueOnce({ error: ERROR }).mockResolvedValueOnce(undefined);
    render(<AccountMenu name="Laura Gómez" email="laura@correo.co" />);

    await cerrarSesion();
    expect((await screen.findByRole("alert")).textContent).toBe(ERROR);
    // Sigue dentro: la cuenta continúa visible y el menú se puede volver a abrir.
    expect(screen.getAllByRole("button", { name: /Cuenta/ }).length).toBeGreaterThan(0);

    await cerrarSesion();
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    expect(acciones.logout).toHaveBeenCalledTimes(2);
  });

  test("un segundo fallo seguido vuelve a mostrar el aviso", async () => {
    acciones.logout.mockResolvedValue({ error: ERROR });
    render(<AccountMenu name="Laura Gómez" email="laura@correo.co" />);
    await cerrarSesion();
    const primero = await screen.findByRole("alert");
    await cerrarSesion();
    await waitFor(() => expect(acciones.logout).toHaveBeenCalledTimes(2));
    const segundo = await screen.findByRole("alert");
    expect(segundo.textContent).toBe(ERROR);
    // Es un aviso nuevo, no el mismo nodo: así los lectores de pantalla lo vuelven a anunciar.
    expect(segundo).not.toBe(primero);
  });

  test("si sale bien, no muestra ningún aviso", async () => {
    acciones.logout.mockResolvedValue(undefined);
    render(<AccountMenu name="Laura Gómez" email="laura@correo.co" />);
    await cerrarSesion();
    await waitFor(() => expect(acciones.logout).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
