import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import BuscarVacantes from "./BuscarVacantes";

const vacante = (titulo: string) => ({
  id: titulo,
  titulo,
  estado: "Abierta",
  modalidad: "remota",
  ciudad: "",
  vigencia: "2027-03-01T00:00:00.000Z",
  empresa: { razonSocial: "Empresa" },
});
const lista = (titulos: string[], pagina = 1, total = titulos.length) =>
  new Response(JSON.stringify({ items: titulos.map(vacante), total, pagina }));
const unMomento = () => new Promise((r) => setTimeout(r));

describe("BuscarVacantes", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  /** La carga inicial queda pendiente; la búsqueda de «Sistemas» responde enseguida. */
  async function buscarConInicialPendiente() {
    let llegaInicial!: (r: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        url.includes("q=Sistemas")
          ? Promise.resolve(lista(["Practicante de Sistemas"]))
          : new Promise<Response>((resolve) => (llegaInicial = resolve)),
      ),
    );
    render(<BuscarVacantes />);
    fireEvent.change(screen.getByLabelText("Buscar por título"), { target: { value: "Sistemas" } });
    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));
    await screen.findByText("Practicante de Sistemas");
    return llegaInicial;
  }

  test("una respuesta anterior que llega tarde no sobrescribe la búsqueda nueva", async () => {
    const llegaInicial = await buscarConInicialPendiente();
    llegaInicial(lista(["Practicante de Contabilidad", "Practicante de Diseño"]));
    await unMomento();
    expect(screen.getByText("Practicante de Sistemas")).toBeTruthy();
    expect(screen.queryByText("Practicante de Contabilidad")).toBeNull();
  });

  test("el error de una petición anterior tampoco pisa los resultados de la nueva", async () => {
    const llegaInicial = await buscarConInicialPendiente();
    llegaInicial(new Response("{}", { status: 500 }));
    await unMomento();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText("Practicante de Sistemas")).toBeTruthy();
  });

  test("«Siguiente» pagina con los filtros aplicados; «Buscar» aplica los nuevos desde la página 1", async () => {
    const fetchFalso = vi.fn((url: string) => {
      const q = new URL(url, "http://praxis.test").searchParams;
      const pagina = Number(q.get("pagina"));
      return Promise.resolve(lista([`Página ${pagina} ${q.get("ciudad") ?? "todas"}`], pagina, 45));
    });
    vi.stubGlobal("fetch", fetchFalso);
    const ultimaRuta = () => fetchFalso.mock.calls.at(-1)![0];
    render(<BuscarVacantes />);
    await screen.findByText("Página 1 todas");

    // Se escribe la ciudad, pero no se pulsa «Buscar»: la página 2 sigue siendo de la consulta anterior.
    fireEvent.change(screen.getByLabelText("Ciudad (ubicación de la práctica)"), { target: { value: "Bello" } });
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    await screen.findByText("Página 2 todas");
    expect(ultimaRuta()).toBe("/api/vacantes?pagina=2");

    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));
    await screen.findByText("Página 1 Bello");
    expect(ultimaRuta()).toBe("/api/vacantes?pagina=1&ciudad=Bello");

    // Ya aplicado, la paginación lo conserva.
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    await screen.findByText("Página 2 Bello");
    expect(ultimaRuta()).toBe("/api/vacantes?pagina=2&ciudad=Bello");
  });

  test("sin resultados con filtros: lo dice, sugiere y «Limpiar búsqueda» vuelve a la lista completa", async () => {
    const fetchFalso = vi.fn((url: string) =>
      Promise.resolve(url.includes("ciudad=Bello") ? lista([]) : lista(["Practicante de Sistemas"])),
    );
    vi.stubGlobal("fetch", fetchFalso);
    render(<BuscarVacantes />);
    await screen.findByText("Practicante de Sistemas");
    expect(screen.getByRole("status").textContent).toBe("Página 1. 1 resultado.");

    const ciudad = screen.getByLabelText("Ciudad (ubicación de la práctica)") as HTMLInputElement;
    fireEvent.change(ciudad, { target: { value: "Bello" } });
    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));
    await screen.findByText("No hay prácticas abiertas con estos criterios.");
    // Sin resultados no hay nada que paginar.
    expect(screen.queryByRole("button", { name: "Siguiente" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Limpiar búsqueda" }));
    await screen.findByText("Practicante de Sistemas");
    expect(ciudad.value).toBe("");
    expect(fetchFalso.mock.calls.at(-1)![0]).toBe("/api/vacantes?pagina=1");
  });

  test("sin prácticas y sin filtros no ofrece limpiar una búsqueda que no existe", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(lista([]))),
    );
    render(<BuscarVacantes />);
    await screen.findByText("No hay prácticas abiertas con estos criterios.");
    expect(screen.queryByRole("button", { name: "Limpiar búsqueda" })).toBeNull();
  });

  test("mientras busca lo dice y bloquea la paginación; al llegar, el foco va al resumen", async () => {
    let llega!: (r: Response) => void;
    const fetchFalso = vi.fn((url: string) =>
      url.includes("pagina=2")
        ? new Promise<Response>((r) => (llega = r))
        : Promise.resolve(lista(["Primera"], 1, 21)),
    );
    vi.stubGlobal("fetch", fetchFalso);
    render(<BuscarVacantes />);
    await screen.findByText("Primera");
    const siguiente = screen.getByRole("button", { name: "Siguiente" }) as HTMLButtonElement;
    siguiente.focus();
    fireEvent.click(siguiente);

    expect(screen.getByRole("button", { name: "Buscando…" })).toBeTruthy();
    expect(siguiente.disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Anterior" }) as HTMLButtonElement).disabled).toBe(true);

    llega(lista(["Segunda"], 2, 21));
    await screen.findByText("Segunda");
    // «Siguiente» quedó deshabilitado en la última página: el foco no se pierde en el body.
    await waitFor(() => expect(document.activeElement?.textContent).toBe("Página 2. 21 resultados."));
    expect(screen.getByRole("button", { name: "Buscar" })).toBeTruthy();
  });

  test("si una búsqueda falla, no deja los resultados anteriores como si fueran de ella", async () => {
    const fetchFalso = vi.fn<(url: string) => Promise<Response>>(() => Promise.resolve(lista(["Vieja"])));
    vi.stubGlobal("fetch", fetchFalso);
    render(<BuscarVacantes />);
    await screen.findByText("Vieja");
    fetchFalso.mockImplementation(() => Promise.resolve(new Response('{"mensaje":"Falló"}', { status: 500 })));
    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));
    expect((await screen.findByRole("alert")).textContent).toBe("FallóReintentar");
    expect(screen.queryByText("Vieja")).toBeNull();
    expect(screen.queryByText("Cargando prácticas…")).toBeNull();
  });

  test("si falla un cambio de página, «Reintentar» pide esa misma página con los mismos filtros", async () => {
    const fetchFalso = vi.fn((url: string) => {
      const q = new URL(url, "http://praxis.test").searchParams;
      const pagina = Number(q.get("pagina"));
      return Promise.resolve(lista([`Página ${pagina} ${q.get("ciudad") ?? "todas"}`], pagina, 45));
    });
    vi.stubGlobal("fetch", fetchFalso);
    render(<BuscarVacantes />);
    await screen.findByText("Página 1 todas");
    fireEvent.change(screen.getByLabelText("Ciudad (ubicación de la práctica)"), { target: { value: "Bello" } });
    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));
    await screen.findByText("Página 1 Bello");

    fetchFalso.mockImplementationOnce(() => Promise.resolve(new Response('{"mensaje":"Sin conexión."}', { status: 500 })));
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    await screen.findByText("Sin conexión.");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    await screen.findByText("Página 2 Bello");
    expect(fetchFalso.mock.calls.at(-1)![0]).toBe("/api/vacantes?pagina=2&ciudad=Bello");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("un fallo se avisa y la búsqueda siguiente que sale bien quita el aviso", async () => {
    const fetchFalso = vi.fn<(url: string) => Promise<Response>>(() =>
      Promise.resolve(new Response("{}", { status: 500 })),
    );
    vi.stubGlobal("fetch", fetchFalso);
    render(<BuscarVacantes />);
    await screen.findByRole("alert");
    fetchFalso.mockImplementation(() => Promise.resolve(lista(["Practicante de Sistemas"])));
    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));
    await screen.findByText("Practicante de Sistemas");
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  });
});
