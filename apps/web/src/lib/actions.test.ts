// @vitest-environment node
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const jar = vi.hoisted(() => ({ get: vi.fn(), delete: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => jar }));
vi.mock("next/navigation", () => ({
  redirect: (a: string) => {
    throw new Error(`REDIRECT ${a}`);
  },
}));

import { logout } from "./actions";

// Spec 011 (PM005): la cookie solo se borra cuando la API confirmó el cierre.
describe("logout", () => {
  const fetchFalso = vi.fn();
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchFalso);
    jar.get.mockReturnValue({ value: "token-ficticio" });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetAllMocks();
  });

  test.each([
    ["no responde", () => Promise.reject(new TypeError("fetch failed"))],
    ["agota el tiempo", () => Promise.reject(new DOMException("timeout", "TimeoutError"))],
    ["responde 500", () => Promise.resolve(new Response("{}", { status: 500 }))],
    ["rechaza el origen", () => Promise.resolve(new Response("{}", { status: 403 }))],
  ])("si la API %s, devuelve el aviso y conserva la cookie", async (_, respuesta) => {
    fetchFalso.mockImplementation(respuesta);
    expect(await logout()).toEqual({ error: "No pudimos cerrar tu sesión. Inténtalo de nuevo." });
    expect(jar.delete).not.toHaveBeenCalled();
  });

  test("si la API confirma, borra la cookie y va al inicio", async () => {
    fetchFalso.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(logout()).rejects.toThrow("REDIRECT /");
    expect(jar.delete).toHaveBeenCalledWith("praxis_sesion");
    const [url, opciones] = fetchFalso.mock.calls[0];
    expect(url).toMatch(/\/auth\/logout$/);
    expect(opciones.headers.cookie).toBe("praxis_sesion=token-ficticio");
    expect(opciones.signal).toBeInstanceOf(AbortSignal);
  });

  test("sin cookie no llama a la API y va al inicio", async () => {
    jar.get.mockReturnValue(undefined);
    await expect(logout()).rejects.toThrow("REDIRECT /");
    expect(fetchFalso).not.toHaveBeenCalled();
  });
});
