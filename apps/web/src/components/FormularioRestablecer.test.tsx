import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import FormularioRestablecer from "./FormularioRestablecer";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh }) }));

// Spec 012: tres resultados distintos — cambiada, enlace que ya no sirve o fallo de conexión.
describe("FormularioRestablecer", () => {
  const TOKEN = "t".repeat(43);
  const NUEVA = "contrasena-nueva-1";
  function cambiar(respuesta: Response | Error, contrasena = NUEVA, confirmar = contrasena) {
    const fetchFalso = vi.fn(() => (respuesta instanceof Error ? Promise.reject(respuesta) : Promise.resolve(respuesta)));
    vi.stubGlobal("fetch", fetchFalso);
    render(<FormularioRestablecer token={TOKEN} />);
    fireEvent.change(screen.getByLabelText("Contraseña nueva"), { target: { value: contrasena } });
    fireEvent.change(screen.getByLabelText("Confirmar contraseña nueva"), { target: { value: confirmar } });
    fireEvent.submit(screen.getByRole("button", { name: "Cambiar contraseña" }).closest("form")!);
    return fetchFalso;
  }
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    refresh.mockClear();
  });

  test("sin enlace válido no hay formulario: invita a pedir otro", () => {
    render(<FormularioRestablecer />);
    expect(screen.getByRole("heading").textContent).toBe("Este enlace ya no sirve");
    expect(screen.getByRole("link", { name: "Pedir otro enlace" }).getAttribute("href")).toBe("/olvide-contrasena");
    expect(screen.queryByLabelText("Contraseña nueva")).toBeNull();
  });

  test("cambia la contraseña, lleva el foco al resultado y manda a iniciar sesión", async () => {
    const fetchFalso = cambiar(new Response(null, { status: 204 }));
    const titulo = await screen.findByRole("heading", { name: "Tu contraseña quedó cambiada" });
    expect(document.activeElement).toBe(titulo);
    expect(screen.getByRole("link", { name: "Iniciar sesión" }).getAttribute("href")).toBe("/ingresar");
    expect(refresh).toHaveBeenCalled();
    expect(fetchFalso).toHaveBeenCalledWith(
      "/api/auth/restablecer-contrasena",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ token: TOKEN, contrasena: NUEVA, confirmarContrasena: NUEVA }),
      }),
    );
  });

  test("las reglas de la contraseña se revisan antes de enviar", () => {
    const fetchFalso = cambiar(new Response(null, { status: 204 }), "corta1", "otra");
    expect(screen.getByText("Debe tener al menos 10 caracteres. Llevas 6.")).toBeTruthy();
    expect(screen.getByText("Las contraseñas no coinciden.")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toBe("Revisa 2 campos marcados en rojo.");
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  test("enlace vencido o ya usado (410): no deja reintentar con el mismo enlace", async () => {
    cambiar(new Response(JSON.stringify({ mensaje: "Este enlace ya no sirve." }), { status: 410 }));
    await screen.findByRole("heading", { name: "Este enlace ya no sirve" });
    expect(screen.queryByRole("button", { name: "Cambiar contraseña" })).toBeNull();
  });

  test("los errores por campo de la API se muestran junto al campo", async () => {
    const errores = { contrasena: "Usa como máximo 128 caracteres." };
    cambiar(new Response(JSON.stringify({ errores }), { status: 400 }));
    expect(await screen.findByText("Usa como máximo 128 caracteres.")).toBeTruthy();
    expect(screen.getByRole("heading").textContent).toBe("Escribe tu contraseña nueva");
  });

  test.each([
    ["sin red", new TypeError("Failed to fetch")],
    ["error del servidor", new Response("<html>502</html>", { status: 502 })],
  ])("%s: avisa del fallo de conexión y el mismo enlace sigue sirviendo", async (_, respuesta) => {
    cambiar(respuesta);
    expect((await screen.findByRole("alert")).textContent).toBe("No pudimos conectar. Inténtalo de nuevo.");
    expect((screen.getByRole("button", { name: "Cambiar contraseña" }) as HTMLButtonElement).disabled).toBe(false);
  });
});
