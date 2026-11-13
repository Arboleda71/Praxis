import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import MisVacantes from "./MisVacantes";

const vacante = (n: number) => ({
  id: `v${n}`,
  titulo: `Vacante ${n}`,
  estado: "Borrador",
  modalidad: "remota",
  ciudad: "",
  vigencia: "2027-03-01T00:00:00.000Z",
});

/** API simulada con paginación de 20 y borrado, como `/empresa/vacantes`. */
function apiFalsa(cuantas: number) {
  let vacantes = Array.from({ length: cuantas }, (_, i) => vacante(i + 1));
  return vi.fn((url: string, init?: RequestInit) => {
    if (init?.method === "DELETE") {
      vacantes = vacantes.filter((v) => !url.endsWith(`/${v.id}`));
      return Promise.resolve(new Response(null, { status: 204 }));
    }
    const pagina = Number(new URL(url, "http://praxis.test").searchParams.get("pagina"));
    const items = vacantes.slice((pagina - 1) * 20, pagina * 20);
    return Promise.resolve(new Response(JSON.stringify({ items, total: vacantes.length, pagina, cuposGratis: 2 })));
  });
}
async function eliminar(titulo: string) {
  const tarjeta = (await screen.findByText(titulo)).closest("article")!;
  fireEvent.click([...tarjeta.querySelectorAll("button")].find((b) => b.textContent === "Eliminar borrador")!);
  fireEvent.click(await screen.findByRole("button", { name: "Confirmar" }));
  // Mientras el diálogo termina de cerrarse, el resto de la página sigue oculto a los lectores de pantalla.
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
}
const siguiente = () => screen.getByRole("button", { name: "Siguiente" }) as HTMLButtonElement;

describe("MisVacantes", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  test("al eliminar el único borrador de la página 2 se muestran las 20 vacantes de la página 1", async () => {
    vi.stubGlobal("fetch", apiFalsa(21));
    render(<MisVacantes />);
    await screen.findByText("Vacante 1");
    fireEvent.click(siguiente());
    await eliminar("Vacante 21");

    await screen.findByText("Vacante 20");
    expect(document.querySelectorAll("article")).toHaveLength(20);
    expect(screen.getByText("Página 1")).toBeTruthy();
    expect(screen.queryByText(/Aún no tienes vacantes/)).toBeNull();
    expect(siguiente().disabled).toBe(true);
  });

  test("el mensaje de lista vacía aparece solo cuando no queda ninguna vacante", async () => {
    vi.stubGlobal("fetch", apiFalsa(1));
    render(<MisVacantes />);
    await eliminar("Vacante 1");
    await screen.findByText(/Aún no tienes vacantes/);
    expect(document.querySelector("article")).toBeNull();
  });

  test("tras una acción fallida, cambiar de página con éxito quita el aviso", async () => {
    const api = apiFalsa(21);
    let fallar = true;
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) =>
        url.endsWith("/publicar") && fallar
          ? ((fallar = false), Promise.resolve(new Response('{"mensaje":"No quedan cupos."}', { status: 409 })))
          : api(url, init),
      ),
    );
    render(<MisVacantes />);
    const tarjeta = (await screen.findByText("Vacante 1")).closest("article")!;
    fireEvent.click([...tarjeta.querySelectorAll("button")].find((b) => b.textContent === "Publicar")!);
    fireEvent.click(await screen.findByRole("button", { name: "Confirmar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect((await screen.findByRole("alert")).textContent).toContain("No quedan cupos.");

    fireEvent.click(siguiente());
    await screen.findByText("Vacante 21");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("si falla la carga: error con «Reintentar» (no «Revisar mi empresa») y sin «Cargando»", async () => {
    const api = apiFalsa(1);
    let fallar = true;
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) =>
        fallar
          ? ((fallar = false), Promise.resolve(new Response('{"mensaje":"Sin conexión."}', { status: 500 })))
          : api(url, init),
      ),
    );
    render(<MisVacantes />);
    expect((await screen.findByRole("alert")).textContent).toBe("Sin conexión.Reintentar");
    expect(screen.queryByText("Cargando vacantes…")).toBeNull();
    expect(screen.queryByRole("link", { name: "Revisar mi empresa" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    await screen.findByText("Vacante 1");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("eliminar en una página que sigue teniendo vacantes se queda en ella", async () => {
    vi.stubGlobal("fetch", apiFalsa(22));
    render(<MisVacantes />);
    await screen.findByText("Vacante 1");
    fireEvent.click(siguiente());
    await eliminar("Vacante 21");
    await waitFor(() => expect(screen.queryByText("Vacante 21")).toBeNull());
    expect(screen.getByText("Vacante 22")).toBeTruthy();
    expect(screen.getByText("Página 2")).toBeTruthy();
  });
});
