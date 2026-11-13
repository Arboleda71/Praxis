import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { useCarga } from "./carga";

/** `fetch` cuyas respuestas se entregan a mano, en el orden que la prueba elija. */
function fetchManual() {
  const pendientes = new Map<string, (r: Response) => void>();
  const fetchFalso = vi.fn((url: string) => new Promise<Response>((resolve) => pendientes.set(url, resolve)));
  vi.stubGlobal("fetch", fetchFalso);
  const responder = (ruta: string, r: Response) =>
    act(async () => {
      pendientes.get(`/api${ruta}`)!(r);
      await new Promise((ok) => setTimeout(ok));
    });
  return { fetchFalso, responder };
}
const json = (d: unknown) => new Response(JSON.stringify(d));
const fallo = (mensaje: string) => new Response(JSON.stringify({ mensaje }), { status: 500 });

describe("useCarga", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  test("una respuesta de una ruta anterior que llega tarde no pisa la actual", async () => {
    const { responder } = fetchManual();
    const { result, rerender } = renderHook(({ ruta }) => useCarga<{ pagina: number }>(ruta), {
      initialProps: { ruta: "/lista?pagina=2" },
    });
    rerender({ ruta: "/lista?pagina=3" });
    await responder("/lista?pagina=3", json({ pagina: 3 }));
    await responder("/lista?pagina=2", json({ pagina: 2 }));
    expect(result.current.datos).toEqual({ pagina: 3 });
  });

  test("tampoco su error: un fallo de la ruta anterior no aparece sobre los datos actuales", async () => {
    const { responder } = fetchManual();
    const { result, rerender } = renderHook(({ ruta }) => useCarga<{ pagina: number }>(ruta), {
      initialProps: { ruta: "/lista?pagina=2" },
    });
    rerender({ ruta: "/lista?pagina=3" });
    await responder("/lista?pagina=3", json({ pagina: 3 }));
    await responder("/lista?pagina=2", fallo("Sin conexión."));
    expect(result.current.error).toBe("");
    expect(result.current.datos).toEqual({ pagina: 3 });
  });

  test("al desmontar, la respuesta pendiente ya no cambia nada", async () => {
    const { responder } = fetchManual();
    const { result, unmount } = renderHook(() => useCarga<{ n: number }>("/x"));
    const antes = result.current;
    unmount();
    await responder("/x", json({ n: 1 }));
    expect(result.current).toBe(antes);
  });

  test("si la carga falla se quitan los datos viejos; «recargar» quita el error y vuelve a pedir", async () => {
    const { fetchFalso, responder } = fetchManual();
    const { result } = renderHook(() => useCarga<{ n: number }>("/x"));
    await responder("/x", json({ n: 1 }));
    expect(result.current.datos).toEqual({ n: 1 });

    act(() => result.current.recargar());
    await responder("/x", fallo("Sin conexión."));
    expect(result.current).toMatchObject({ datos: null, error: "Sin conexión." });

    act(() => result.current.recargar());
    expect(result.current.error).toBe("");
    await responder("/x", json({ n: 2 }));
    await waitFor(() => expect(result.current.datos).toEqual({ n: 2 }));
    expect(fetchFalso).toHaveBeenCalledTimes(3);
  });

  test("si `aceptar` rechaza la respuesta, no se guarda", async () => {
    const { responder } = fetchManual();
    const aceptar = vi.fn(() => false);
    const { result } = renderHook(() => useCarga<{ n: number }>("/x", aceptar));
    await responder("/x", json({ n: 1 }));
    expect(aceptar).toHaveBeenCalledWith({ n: 1 });
    expect(result.current.datos).toBeNull();
  });
});
