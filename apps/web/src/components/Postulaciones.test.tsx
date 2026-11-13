import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { Candidatos, DetalleCandidato, MisPostulaciones } from "./Postulaciones";

const candidatura = () =>
  new Response(
    JSON.stringify({
      id: "p1",
      estado: "Enviada",
      creadaEn: "2026-11-12T15:00:00.000Z",
      historial: [{ estado: "Enviada", fecha: "2026-11-12T15:00:00.000Z" }],
      vacante: { titulo: "Practicante", empresa: { razonSocial: "Empresa" } },
      perfil: {
        nombreCompleto: "Ana Pérez",
        programa: "Ingeniería de Sistemas",
        nivelFormacion: "universitario",
        institucion: null,
        avance: null,
        jornada: null,
        aval: null,
        // Así lo guarda la copia de la postulación: el día a medianoche UTC (31 de enero, 7:00 p. m. en Bogotá).
        disponibleDesde: "2027-02-01T00:00:00.000Z",
        idiomas: [],
      },
      evaluacion: { programas: { solicitados: [] }, requisitos: [] },
      archivos: [],
    }),
  );
const fallo = () => new Response('{"mensaje":"No pudimos completar la operación."}', { status: 500 });
const CARGANDO = "Cargando postulación…";

describe("DetalleCandidato", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  test("la disponibilidad se muestra como fecha de calendario, no un día antes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(candidatura())),
    );
    render(<DetalleCandidato id="p1" />);
    const linea = await screen.findByText(/Disponibilidad:/);
    expect(linea.textContent).toContain("Disponibilidad: 1 de febrero de 2027.");
    expect(linea.textContent).not.toContain("31");
    // Los eventos con hora siguen en hora de Bogotá: las 15:00 UTC son las 10:00 a. m.
    expect(screen.getByText(/Enviada · .*10:00/)).toBeTruthy();
  });

  test("si falla la carga, muestra solo el error con «Reintentar» y al recuperarse abre el detalle", async () => {
    const fetchFalso = vi.fn<() => Promise<Response>>().mockResolvedValueOnce(fallo());
    vi.stubGlobal("fetch", fetchFalso);
    render(<DetalleCandidato id="p1" />);
    expect(screen.getByText(CARGANDO)).toBeTruthy();

    expect((await screen.findByRole("alert")).textContent).toContain("No pudimos completar la operación.");
    expect(screen.queryByText(CARGANDO)).toBeNull();

    fetchFalso.mockResolvedValueOnce(candidatura());
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    await screen.findByRole("heading", { name: "Ana Pérez" });
    await waitFor(() => expect(screen.queryByText("No pudimos completar la operación.")).toBeNull());
    expect(screen.queryByRole("button", { name: "Reintentar" })).toBeNull();
    expect(screen.queryByText(CARGANDO)).toBeNull();
    expect(fetchFalso).toHaveBeenCalledTimes(2);
  });

  test("si el reintento vuelve a fallar, sigue el error sin «Cargando»", async () => {
    const fetchFalso = vi.fn<() => Promise<Response>>(() => Promise.resolve(fallo()));
    vi.stubGlobal("fetch", fetchFalso);
    render(<DetalleCandidato id="p1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Reintentar" }));
    await waitFor(() => expect(fetchFalso).toHaveBeenCalledTimes(2));
    await screen.findByRole("button", { name: "Reintentar" });
    expect(screen.queryByText(CARGANDO)).toBeNull();
  });

  test("mientras carga y si falla hay un encabezado de página; con la postulación, solo el nombre", async () => {
    const fetchFalso = vi.fn<() => Promise<Response>>().mockResolvedValueOnce(fallo());
    vi.stubGlobal("fetch", fetchFalso);
    render(<DetalleCandidato id="p1" />);
    const h1 = () => screen.getAllByRole("heading", { level: 1 }).map((h) => h.textContent);
    expect(h1()).toEqual(["Detalle de postulación"]);
    await screen.findByRole("alert");
    expect(h1()).toEqual(["Detalle de postulación"]);

    fetchFalso.mockResolvedValueOnce(candidatura());
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    await screen.findByRole("heading", { name: "Ana Pérez" });
    expect(h1()).toEqual(["Ana Pérez"]);
  });
});

const postulacion = (estado: string) => ({
  id: "p1",
  estado,
  creadaEn: "2026-11-12T15:00:00.000Z",
  historial: [{ estado, fecha: "2026-11-12T15:00:00.000Z" }],
  vacante: { titulo: "Practicante de QA", empresa: { razonSocial: "Andina Soft S.A.S." } },
});
const listaDe = (...items: object[]) => new Response(JSON.stringify({ items, total: items.length, pagina: 1 }));
const falla = (mensaje: string, status = 500) => new Response(JSON.stringify({ mensaje }), { status });

describe("MisPostulaciones", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  test("si falla la carga: solo el error con «Reintentar», sin «Cargando»; al reintentar aparece la lista", async () => {
    const fetchFalso = vi.fn<() => Promise<Response>>().mockResolvedValueOnce(falla("Sin conexión."));
    vi.stubGlobal("fetch", fetchFalso);
    render(<MisPostulaciones />);
    expect((await screen.findByRole("alert")).textContent).toBe("Sin conexión.Reintentar");
    expect(screen.queryByText("Cargando postulaciones…")).toBeNull();
    fetchFalso.mockResolvedValueOnce(listaDe(postulacion("Enviada")));
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    await screen.findByText("Practicante de QA");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("retirar con error y luego con éxito: el aviso se va y se ve el nuevo estado", async () => {
    const fetchFalso = vi.fn<() => Promise<Response>>().mockResolvedValueOnce(listaDe(postulacion("Enviada")));
    vi.stubGlobal("fetch", fetchFalso);
    render(<MisPostulaciones />);
    const retirar = async () => {
      fireEvent.click(await screen.findByRole("button", { name: "Retirar postulación" }));
      fireEvent.click(await screen.findByRole("button", { name: "Confirmar retirada" }));
    };
    fetchFalso.mockResolvedValueOnce(falla("No se pudo retirar.", 409));
    await retirar();
    expect((await screen.findByRole("alert")).textContent).toBe("No se pudo retirar.");
    // Con la lista a la vista, el error es de la acción: no se ofrece reintentar la carga.
    expect(screen.queryByRole("button", { name: "Reintentar" })).toBeNull();

    fetchFalso.mockResolvedValueOnce(new Response(null, { status: 204 }));
    fetchFalso.mockResolvedValueOnce(listaDe(postulacion("Retirada")));
    await retirar();
    await screen.findByText("Retirada");
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  });
});

describe("Candidatos", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  test("mientras carga lo dice; si falla, error con «Reintentar» y al reintentar aparece la lista", async () => {
    const fetchFalso = vi.fn<() => Promise<Response>>().mockResolvedValueOnce(falla("Sin conexión."));
    vi.stubGlobal("fetch", fetchFalso);
    render(<Candidatos vacanteId="v1" />);
    expect(screen.getByText("Cargando postulaciones…")).toBeTruthy();
    expect((await screen.findByRole("alert")).textContent).toBe("Sin conexión.Reintentar");
    expect(screen.queryByText("Cargando postulaciones…")).toBeNull();
    fetchFalso.mockResolvedValueOnce(listaDe(postulacion("Enviada")));
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    await screen.findByRole("link", { name: "Abrir postulación" });
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
