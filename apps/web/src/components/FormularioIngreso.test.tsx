import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import FormularioIngreso from "./FormularioIngreso";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

// Spec 011 (PM009): el bloqueo dura lo que diga la API y el formulario vuelve solo.
describe("FormularioIngreso: bloqueo por intentos", () => {
  const boton = () => screen.getByRole("button", { name: "Iniciar sesión" }) as HTMLButtonElement;
  async function intentar(cuerpo: unknown, estado = 429) {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(cuerpo), { status: estado })));
    render(<FormularioIngreso />);
    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "laura@correo.co" } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "equivocada" } });
    fireEvent.submit(boton().closest("form")!);
    await act(() => vi.advanceTimersByTimeAsync(0));
  }
  const pasan = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  test("muestra el tiempo real que falta y se reactiva solo al cumplirse", async () => {
    await intentar({ mensaje: "Demasiados intentos.", segundos: 120 });
    expect(screen.getByRole("alert").textContent).toContain("espera 2 minutos");
    expect(boton().disabled).toBe(true);

    await pasan(119_000);
    expect(boton().disabled).toBe(true);

    await pasan(2_000);
    expect(boton().disabled).toBe(false);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("status").textContent).toBe("Ya puedes intentarlo de nuevo.");
    // El foco estaba en el aviso, que desapareció: pasa al botón.
    expect(document.activeElement).toBe(boton());
  });

  test("un tiempo desmedido no deja el formulario apagado más de una hora", async () => {
    await intentar({ segundos: 1e12 });
    expect(screen.getByRole("alert").textContent).toContain("espera 60 minutos");
    await pasan(3_601_000);
    expect(boton().disabled).toBe(false);
  });

  test("un minuto se dice en singular", async () => {
    await intentar({ segundos: 45 });
    expect(screen.getByRole("alert").textContent).toContain("espera 1 minuto e");
  });

  test("si la respuesta no trae el tiempo, espera 15 minutos", async () => {
    await intentar("no es json");
    expect(screen.getByRole("alert").textContent).toContain("espera 15 minutos");
    await pasan(14 * 60_000);
    expect(boton().disabled).toBe(true);
    await pasan(61_000);
    expect(boton().disabled).toBe(false);
  });

  test("el tiempo corre aunque la pestaña haya estado dormida", async () => {
    await intentar({ segundos: 600 });
    // El equipo se suspende: el reloj salta sin que corran los temporizadores.
    vi.setSystemTime(Date.now() + 601_000);
    await pasan(1_000);
    expect(boton().disabled).toBe(false);
  });

  test("un error de credenciales no bloquea el formulario", async () => {
    await intentar({ mensaje: "Correo o contraseña incorrectos." }, 401);
    expect(screen.getByRole("alert").textContent).toContain("Correo o contraseña incorrectos");
    expect(boton().disabled).toBe(false);
  });
});
