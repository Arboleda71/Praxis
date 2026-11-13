import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import SubidaArchivo from "./SubidaArchivo";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => "/estudiante/perfil",
}));

const actual = { nombre: "cv.pdf", bytes: 320_000, subidoEn: "2026-11-01T15:00:00.000Z" };
const ENLACE = "https://archivos.test/cv";
const conEnlace = () => new Response(JSON.stringify({ url: ENLACE }));

/** Pestaña que abre el navegador: empieza vacía y luego navega al enlace o se cierra. */
const pestanaFalsa = () => ({ opener: {} as unknown, location: { href: "" }, close: vi.fn() });

describe("SubidaArchivo · Ver", () => {
  function montar(respuestas: (Response | Error)[], { bloqueada = false } = {}) {
    const fetchFalso = vi.fn<() => Promise<Response>>();
    for (const r of respuestas)
      fetchFalso.mockImplementationOnce(() => (r instanceof Error ? Promise.reject(r) : Promise.resolve(r)));
    const pestanas: ReturnType<typeof pestanaFalsa>[] = [];
    // Al llamar a `open` se comprueba que todavía no se pidió nada: así sigue dentro del clic del usuario.
    const abrir = vi.fn(() => {
      expect(fetchFalso).toHaveBeenCalledTimes(pestanas.length);
      if (bloqueada) return null;
      const p = pestanaFalsa();
      pestanas.push(p);
      return p;
    });
    vi.stubGlobal("fetch", fetchFalso);
    vi.stubGlobal("open", abrir);
    render(<SubidaArchivo tipo="hoja-de-vida" actual={actual} etiqueta="hoja de vida" />);
    fireEvent.click(screen.getByRole("button", { name: /^Ver/ }));
    return { fetchFalso, abrir, pestanas };
  }
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  test("abre la pestaña en el clic, sin opener, y la lleva al enlace firmado", async () => {
    const { abrir, pestanas } = montar([conEnlace()]);
    expect(abrir).toHaveBeenCalledWith("", "_blank");
    await waitFor(() => expect(pestanas[0].location.href).toBe(ENLACE));
    expect(pestanas[0].opener).toBeNull();
    expect(pestanas[0].close).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("401: cierra la pestaña vacía, avisa de que la sesión venció y ofrece iniciar sesión volviendo aquí", async () => {
    const { pestanas } = montar([new Response('{"mensaje":"No autorizado"}', { status: 401 })]);
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Tu sesión venció. Inicia sesión de nuevo para ver el archivo.",
    );
    expect(pestanas[0].close).toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Iniciar sesión" }).getAttribute("href")).toBe(
      "/ingresar?next=%2Festudiante%2Fperfil",
    );
    expect(screen.queryByRole("button", { name: "Reintentar" })).toBeNull();
  });

  test.each([
    ["500", new Response("{}", { status: 500 })],
    ["sin red", new TypeError("Failed to fetch")],
    ["respuesta sin enlace", new Response("{}")],
  ])("%s: cierra la pestaña vacía, avisa y el reintento abre el documento", async (_, respuesta) => {
    const { pestanas, fetchFalso } = montar([respuesta, conEnlace()]);
    expect((await screen.findByRole("alert")).textContent).toContain(
      "No pudimos abrir el archivo. Inténtalo de nuevo.",
    );
    expect(pestanas[0].close).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    await waitFor(() => expect(pestanas[1].location.href).toBe(ENLACE));
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    expect(fetchFalso).toHaveBeenCalledTimes(2);
  });

  test("si el navegador bloquea la pestaña, lo dice y no pide el enlace", async () => {
    const { fetchFalso } = montar([conEnlace()], { bloqueada: true });
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Tu navegador bloqueó la pestaña nueva. Permite las ventanas emergentes de Praxis e inténtalo de nuevo.",
    );
    expect(fetchFalso).not.toHaveBeenCalled();
  });
});
