import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import BottomNav from "./BottomNav";

const nav = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname }));

describe("BottomNav", () => {
  afterEach(cleanup);

  test("la empresa ve sus dos destinos y el actual se anuncia", () => {
    nav.pathname = "/empresa/vacantes";
    render(<BottomNav role="empresa" />);
    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.textContent)).toEqual(["Mis vacantes", "Perfil de la empresa"]);
    expect(screen.getByRole("link", { name: "Mis vacantes" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Perfil de la empresa" }).getAttribute("aria-current")).toBeNull();
  });

  test("el estudiante tiene Inicio y Mi perfil", () => {
    nav.pathname = "/estudiante/perfil";
    render(<BottomNav role="estudiante" />);
    expect(screen.getByRole("link", { name: "Inicio" }).getAttribute("href")).toBe("/");
    expect(screen.getByRole("link", { name: "Mi perfil" }).getAttribute("aria-current")).toBe("page");
  });

  test("fuera de la barra ningún destino es el actual", () => {
    nav.pathname = "/empresa/perfil";
    render(<BottomNav role="estudiante" />);
    for (const link of screen.getAllByRole("link")) expect(link.getAttribute("aria-current")).toBeNull();
  });
});
