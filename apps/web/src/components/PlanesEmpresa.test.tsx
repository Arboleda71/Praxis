import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import PlanesEmpresa from "./PlanesEmpresa";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test("muestra el aviso de vencimiento y conserva bloqueada la compra del plan activo", async () => {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => new Response(JSON.stringify(
    url.includes("/empresa/planes") ? {
      disponible: true,
      activo: true,
      plan: "basico",
      planVenceEn: "2026-11-20T15:00:00Z",
      avisoVencimiento: "Tu plan vence pronto. Puedes renovar al vencer en Planes y pagos.",
    } : { items: [], total: 0, pagina: 1 },
  ))));
  render(<PlanesEmpresa />);
  expect(await screen.findByText(/Tu plan vence pronto/)).toBeTruthy();
  const comprar = screen.getByRole("button", { name: "Pagar Básico en sandbox" }) as HTMLButtonElement;
  expect(comprar.disabled).toBe(true);
});
