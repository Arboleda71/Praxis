import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { evaluarElegibilidad } from "@praxis/contracts";
import { afterEach, describe, expect, test, vi } from "vitest";
import DetalleVacante from "./DetalleVacante";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const vacante = {
  id: "v1",
  titulo: "Practicante de desarrollo backend",
  descripcion: "Apoyarás al equipo de pagos.",
  estado: "Abierta",
  modalidad: "hibrida",
  ciudad: "Medellín",
  duracionMeses: 6,
  fechaInicio: "2027-02-02T00:00:00.000Z",
  vigencia: "2027-01-15T00:00:00.000Z",
  niveles: ["tecnologo", "universitario"],
  programas: ["Tecnología en desarrollo de software", "Ingeniería de sistemas"],
  avances: [{ nivel: "tecnologo", avance: "productiva" }],
  aval: true,
  jornada: "tiempo-completo",
  idiomas: [{ idioma: "ingles", nivel: "b1" }],
  empresa: {
    razonSocial: "Andina Soft S.A.S.",
    ciudad: "Medellín",
    correoContacto: "talento@andinasoft.co",
    telefono: "(604) 444 5566",
    sitioWeb: "https://andinasoft.co",
  },
};
const perfil = {
  nivelFormacion: "tecnologo" as string | null,
  programa: "Tecnología en análisis y desarrollo de software" as string | null,
  hojaDeVida: true,
  avance: "productiva" as string | null,
  aval: true,
  jornada: "tiempo-completo",
  disponibleDesde: "2027-01-10",
  idiomas: [] as { idioma: string; nivel: string }[],
};
/** La respuesta de `/vacantes/:id`, con la evaluación real de contracts para ese perfil. */
const detalle = (p: Partial<typeof perfil> = {}, extra: object = {}) =>
  new Response(
    JSON.stringify({
      ...vacante,
      evaluacion: evaluarElegibilidad({ ...vacante, fechaInicio: "2027-02-02" }, { ...perfil, ...p }),
      postulación: null,
      ...extra,
    }),
  );
const fallo = (mensaje: string, status = 409) => new Response(JSON.stringify({ mensaje }), { status });
const postularme = () => screen.getByRole("button", { name: "Postularme" }) as HTMLButtonElement;
/** Fila de un requisito: su nombre, si excluye y su resultado. */
const requisito = (nombre: string) => screen.getByText(nombre).closest("li")!;

describe("DetalleVacante", () => {
  function montar(...respuestas: Response[]) {
    const fetchFalso = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>();
    for (const r of respuestas) fetchFalso.mockResolvedValueOnce(r);
    vi.stubGlobal("fetch", fetchFalso);
    render(<DetalleVacante id="v1" />);
    return fetchFalso;
  }
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    push.mockClear();
  });

  test("puede postularse: cada requisito por separado, con nombres del catálogo y su resultado", async () => {
    montar(detalle());
    await screen.findByRole("heading", { name: vacante.titulo });
    expect(screen.getByText("Abierta")).toBeTruthy();
    expect(screen.getByText("Híbrida Medellín · 6 meses · Inicio: 2 de febrero de 2027")).toBeTruthy();
    expect(screen.getByText("Medellín · talento@andinasoft.co · (604) 444 5566")).toBeTruthy();

    // El programa no tiene estado automático (II): solo se muestran los dos y quién decide.
    expect(screen.getByText("Programas solicitados: Tecnología en desarrollo de software; Ingeniería de sistemas.")).toBeTruthy();
    expect(screen.getByText("Tu programa: Tecnología en análisis y desarrollo de software.")).toBeTruthy();
    expect(screen.getByText("La empresa revisa la afinidad.")).toBeTruthy();

    const filas = screen.getAllByRole("listitem").map((li) => li.textContent);
    expect(filas).toEqual([
      "Nivel de formaciónExcluyente · Niveles aceptados: Tecnólogo, UniversitarioCumple",
      "Avance tecnólogo: ProductivaDeseableCumple",
      "Aval declaradoDeseableCumple",
      "Jornada: Tiempo completoDeseableCumple",
      "Disponibilidad para la fecha de inicioDeseableCumple",
      "Idioma Inglés: B1 · IntermedioDeseableFalta información",
    ]);
    // Sin puntajes ni porcentajes (III).
    expect(document.body.textContent).not.toMatch(/%|\d+ de \d+ requisitos/);
    expect(postularme().disabled).toBe(false);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("nivel no aceptado: es lo único que bloquea y se dice por qué", async () => {
    montar(detalle({ nivelFormacion: "tecnico", avance: "productiva" }));
    await screen.findByRole("heading", { name: vacante.titulo });
    expect(within(requisito("Nivel de formación")).getByText("No cumple")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toBe(
      "Tu nivel de formación no está entre los aceptados.Puedes consultar otras prácticas.",
    );
    expect(postularme().disabled).toBe(true);
  });

  test("un deseable que no se cumple no bloquea la postulación", async () => {
    montar(detalle({ aval: false, jornada: "medio-tiempo" }));
    await screen.findByRole("heading", { name: vacante.titulo });
    expect(within(requisito("Aval declarado")).getByText("No cumple")).toBeTruthy();
    expect(within(requisito("Jornada: Tiempo completo")).getByText("No cumple")).toBeTruthy();
    expect(postularme().disabled).toBe(false);
  });

  test("perfil mínimo incompleto: pide completarlo y lleva al perfil", async () => {
    montar(detalle({ nivelFormacion: null, programa: null, hojaDeVida: false }));
    await screen.findByRole("heading", { name: vacante.titulo });
    expect(screen.getByText("Tu programa: Falta información.")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toBe(
      "Completa tu perfil mínimo: nivel de formación, programa y hoja de vida.",
    );
    expect(screen.getByRole("link", { name: "Completar perfil" }).getAttribute("href")).toBe("/estudiante/perfil");
    expect(postularme().disabled).toBe(true);
  });

  test("ya se postuló: muestra el estado y lleva al seguimiento", async () => {
    montar(detalle({}, { postulación: { id: "p1", estado: "En revisión" } }));
    await screen.findByRole("heading", { name: vacante.titulo });
    expect(screen.getByRole("alert").textContent).toBe("Ya te postulaste. Estado: En revisión.");
    expect(screen.getByRole("link", { name: "Seguir mi postulación" }).getAttribute("href")).toBe(
      "/estudiante/postulaciones",
    );
    expect(postularme().disabled).toBe(true);
  });

  test("una vacante cerrada no deja postularse y dice por qué", async () => {
    montar(detalle({}, { estado: "Cerrada" }));
    await screen.findByRole("heading", { name: vacante.titulo });
    expect(screen.getByText("Cerrada")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toBe("Esta vacante ya no recibe postulaciones.");
    expect(postularme().disabled).toBe(true);
  });

  test("nivel no aceptado y perfil incompleto: se dicen las dos cosas, no solo la primera", async () => {
    montar(detalle({ nivelFormacion: "tecnico", avance: null, hojaDeVida: false }));
    await screen.findByRole("heading", { name: vacante.titulo });
    const avisos = screen.getAllByRole("alert").map((a) => a.textContent);
    expect(avisos).toEqual([
      "Completa tu perfil mínimo: nivel de formación, programa y hoja de vida.",
      "Tu nivel de formación no está entre los aceptados.Puedes consultar otras prácticas.",
    ]);
  });

  test("confirmar envía la postulación una vez y lleva a Mis postulaciones", async () => {
    const fetchFalso = montar(detalle(), new Response(null, { status: 204 }));
    fireEvent.click(await screen.findByRole("button", { name: "Postularme" }));
    const dialogo = await screen.findByRole("dialog", { name: "Enviar postulación" });
    expect(dialogo.textContent).toContain("Solo puedes postularte una vez a esta vacante, aunque después te retires.");
    expect(fetchFalso).toHaveBeenCalledTimes(1);

    fireEvent.click(within(dialogo).getByRole("button", { name: "Enviar postulación" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/estudiante/postulaciones"));
    // Mientras la página cambia, el botón sigue bloqueado: un segundo clic no reenvía.
    const enviando = within(dialogo).getByRole("button", { name: "Enviando…" }) as HTMLButtonElement;
    expect(enviando.disabled).toBe(true);
    fireEvent.click(enviando);
    expect(fetchFalso).toHaveBeenCalledTimes(2);
    expect(fetchFalso).toHaveBeenLastCalledWith("/api/vacantes/v1/postulaciones", expect.objectContaining({ method: "POST" }));
  });

  test("cancelar cierra el diálogo sin enviar nada", async () => {
    const fetchFalso = montar(detalle());
    fireEvent.click(await screen.findByRole("button", { name: "Postularme" }));
    fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(fetchFalso).toHaveBeenCalledTimes(1);
    expect(push).not.toHaveBeenCalled();
  });

  test("la vacante ya no recibe postulaciones: el motivo va en el diálogo y al cerrar se ve el estado actual", async () => {
    const fetchFalso = montar(
      detalle(),
      fallo("Esta vacante ya no recibe postulaciones."),
      detalle({}, { estado: "Cerrada" }),
    );
    fireEvent.click(await screen.findByRole("button", { name: "Postularme" }));
    const dialogo = await screen.findByRole("dialog");
    fireEvent.click(within(dialogo).getByRole("button", { name: "Enviar postulación" }));

    expect((await within(dialogo).findByRole("alert")).textContent).toBe("Esta vacante ya no recibe postulaciones.");
    expect(within(dialogo).queryByRole("button", { name: "Enviar postulación" })).toBeNull();
    expect(push).not.toHaveBeenCalled();

    fireEvent.click(within(dialogo).getByRole("button", { name: "Cerrar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await screen.findByText("Cerrada");
    expect(postularme().disabled).toBe(true);
    expect(fetchFalso).toHaveBeenCalledTimes(3);
  });

  test("envío rechazado y la recarga también falla: no deja la vacante vieja, ofrece «Reintentar»", async () => {
    montar(detalle(), fallo("Esta vacante ya no recibe postulaciones."), fallo("Sin conexión.", 500), detalle({}, { estado: "Cerrada" }));
    fireEvent.click(await screen.findByRole("button", { name: "Postularme" }));
    const dialogo = await screen.findByRole("dialog");
    fireEvent.click(within(dialogo).getByRole("button", { name: "Enviar postulación" }));
    await within(dialogo).findByRole("alert");
    fireEvent.click(within(dialogo).getByRole("button", { name: "Cerrar" }));

    expect((await screen.findByRole("alert")).textContent).toContain("Sin conexión.");
    // Nada de la vacante vieja («Abierta» con «Postularme» activo) bajo el error.
    expect(screen.queryByRole("heading", { name: vacante.titulo })).toBeNull();
    expect(screen.queryByRole("button", { name: "Postularme" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    await screen.findByText("Cerrada");
    expect(postularme().disabled).toBe(true);
  });

  test("si falla la carga, muestra solo el error con «Reintentar» y al recuperarse abre la vacante", async () => {
    montar(fallo("No pudimos completar la operación.", 500), detalle());
    expect(screen.getByText("Cargando vacante…")).toBeTruthy();
    expect((await screen.findByRole("alert")).textContent).toContain("No pudimos completar la operación.");
    expect(screen.queryByText("Cargando vacante…")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    await screen.findByRole("heading", { name: vacante.titulo });
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  });

  test("mientras carga y si falla hay un encabezado de página; con la vacante, solo su título", async () => {
    montar(fallo("No pudimos completar la operación.", 500), detalle());
    const h1 = () => screen.getAllByRole("heading", { level: 1 }).map((h) => h.textContent);
    expect(h1()).toEqual(["Requisitos de la práctica"]);
    await screen.findByRole("alert");
    expect(h1()).toEqual(["Requisitos de la práctica"]);

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    await screen.findByRole("heading", { name: vacante.titulo });
    expect(h1()).toEqual([vacante.titulo]);
  });

  test("el sitio web de la empresa se enlaza solo si es http o https", async () => {
    const enlace = () => screen.queryByRole("link", { name: /Sitio web de la empresa/ });
    montar(detalle());
    await screen.findByRole("heading", { name: vacante.titulo });
    expect(enlace()?.getAttribute("href")).toBe("https://andinasoft.co");
    cleanup();

    // Un dato antiguo o sembrado: ni un esquema ejecutable ni un texto que no es una dirección llegan al `href`.
    for (const sitioWeb of ["javascript:alert(1)", "andinasoft.co"]) {
      montar(detalle({}, { empresa: { ...vacante.empresa, sitioWeb } }));
      await screen.findByRole("heading", { name: vacante.titulo });
      expect(enlace()).toBeNull();
      cleanup();
    }
  });
});
