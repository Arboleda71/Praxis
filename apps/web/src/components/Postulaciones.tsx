"use client";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  puedeRetirar,
  TAMANO_PAGINA,
  TRANSICIONES,
  type evaluarElegibilidad,
  nombreDe, NIVELES_FORMACION, AVANCES, JORNADAS, IDIOMAS, NIVELES_MCER,
} from "@praxis/contracts";
import { useState } from "react";
import { AvisoError } from "@/components/mercado-ui";
import { useCarga } from "@/lib/carga";
import { solicitar, type Lista } from "@/lib/mercado";
import { abrirEnPestana } from "@/lib/pestana";
import { fechaLarga } from "@/lib/perfil-cliente";

type Entrada = { estado: string; fecha: string; detalle?: string | null };
type Postulacion = {
  id: string;
  estado: string;
  creadaEn: string;
  cvReemplazadoEn?: string | null;
  historial: Entrada[];
  vacante: { titulo: string; empresa: { razonSocial: string } };
};
/** Instante con hora (envío, cambio de estado), en hora de Bogotá. No sirve para fechas de calendario. */
const fecha = (d: string) =>
  new Date(d).toLocaleString("es-CO", { timeZone: "America/Bogota" });
function Historial({ items }: { items: Entrada[] }) {
  return (
    <Stack component="ol" spacing={2} sx={{ pl: 3, borderLeft: 2, borderColor: "primary.main", "& li::marker": { color: "primary.main" } }}>
      {items.map((h, n) => (
        <li key={n}>
          <Typography>
            {h.estado} · {fecha(h.fecha)}{h.detalle ? ` (${h.detalle})` : ""}
          </Typography>
        </li>
      ))}
    </Stack>
  );
}

export function MisPostulaciones() {
  const [pagina, setPagina] = useState(1);
  const {
    datos: lista,
    error,
    setError,
    recargar,
  } = useCarga<Lista<Postulacion>>(`/postulaciones?pagina=${pagina}`);
  const [retirar, setRetirar] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  async function confirmar() {
    if (!retirar) return;
    setOcupado(true);
    try {
      await solicitar(`/postulaciones/${retirar}/retirar`, "POST");
      // Se vuelve a pedir la lista: el estado y el historial de la postulación cambiaron.
      recargar();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      // El diálogo se cierra también si falla: abierto, taparía el aviso con el motivo.
      setRetirar(null);
      setOcupado(false);
    }
  }
  return (
    <Stack spacing={3} sx={{ maxWidth: 900, mx: "auto", p: 2, py: 4 }}>
      <Typography variant="h1" sx={{ fontSize: 28 }}>
        Mis postulaciones
      </Typography>
      <Stack direction="row" spacing={2}>
        <Button href="/estudiante/vacantes">Buscar prácticas</Button>
        <Button href="/notificaciones">Notificaciones</Button>
      </Stack>
      {error && <AvisoError mensaje={error} reintentar={lista ? undefined : recargar} />}
      {!lista ? (
        !error && <Typography role="status">Cargando postulaciones…</Typography>
      ) : lista.items.length === 0 ? (
        <Typography>Aún no te has postulado a una práctica.</Typography>
      ) : (
        lista.items.map((p) => (
          <Paper
            component="article"
            variant="outlined"
            sx={{ p: 2 }}
            key={p.id}
          >
            <Typography variant="h2" sx={{ fontSize: 22 }}>
              {p.vacante.titulo}
            </Typography>
            <Typography>{p.vacante.empresa.razonSocial}</Typography>
            <Typography>
              Estado: <Chip label={p.estado} color={p.estado === "Seleccionada" ? "success" : p.estado === "Rechazada" || p.estado === "Retirada" ? "default" : "primary"} size="small" />
            </Typography>
            <Typography variant="h3" sx={{ fontSize: 18, mt: 2 }}>
              Historial de la postulación
            </Typography>
            <Historial items={p.historial} />
            {p.estado === "Enviada" ? <>
              <Typography>Puedes cambiar el CV enviado mientras la empresa no empiece a revisarla.</Typography>
              <Button href={`/estudiante/postulaciones/${p.id}/cv`}>Cambiar CV de esta postulación</Button>
            </> : <Typography>El CV enviado no se puede cambiar en este estado.</Typography>}
            {p.cvReemplazadoEn && <Typography>CV reemplazado el {fecha(p.cvReemplazadoEn)}.</Typography>}
            <Button
              onClick={async () => {
                try {
                  await abrirEnPestana(async () =>
                    (
                      await solicitar<{ url: string }>(
                        `/postulaciones/${p.id}/archivos/hoja-de-vida`,
                      )
                    ).url,
                  );
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              Ver copia del CV enviado
            </Button>
            {puedeRetirar(p.estado) && (
              <Button onClick={() => setRetirar(p.id)}>
                Retirar postulación
              </Button>
            )}
          </Paper>
        ))
      )}
      <Stack direction="row" spacing={2}>
        <Button disabled={pagina === 1} onClick={() => setPagina(pagina - 1)}>
          Anterior
        </Button>
        <Typography>Página {pagina}</Typography>
        <Button
          disabled={!lista || pagina * TAMANO_PAGINA >= lista.total}
          onClick={() => setPagina(pagina + 1)}
        >
          Siguiente
        </Button>
      </Stack>
      <Dialog
        open={!!retirar}
        onClose={() => !ocupado && setRetirar(null)}
        aria-labelledby="retirar-postulacion"
      >
        <DialogTitle id="retirar-postulacion">Retirar postulación</DialogTitle>
        <DialogContent>
          No podrás volver a postularte a esta vacante. El historial se
          conservará y se notificará a la empresa.
        </DialogContent>
        <DialogActions>
          <Button disabled={ocupado} onClick={() => setRetirar(null)}>
            Cancelar
          </Button>
              <Button color="error" disabled={ocupado} onClick={confirmar}>
            {ocupado ? "Retirando…" : "Confirmar retirada"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

export function Candidatos({ vacanteId }: { vacanteId: string }) {
  const [pagina, setPagina] = useState(1);
  const {
    datos: lista,
    error,
    recargar,
  } = useCarga<Lista<Postulacion>>(`/empresa/vacantes/${vacanteId}/postulaciones?pagina=${pagina}`);
  return (
    <Stack spacing={3} sx={{ maxWidth: 900, mx: "auto", p: 2, py: 4 }}>
      <Typography variant="h1" sx={{ fontSize: 28 }}>
        Postulaciones recibidas
      </Typography>
      <Typography>
        En orden de recepción. Abre una postulación para consultar su perfil y
        archivos enviados.
      </Typography>
      <Button href="/empresa/vacantes">Volver a mis vacantes</Button>
      {error && <AvisoError mensaje={error} reintentar={recargar} />}
      {!lista && !error && <Typography role="status">Cargando postulaciones…</Typography>}
      {lista?.items.length === 0 && (
        <Typography>Aún no hay postulaciones.</Typography>
      )}
      {lista?.items.map((p) => (
        <Paper component="article" variant="outlined" sx={{ p: 2 }} key={p.id}>
          <Typography variant="h2" sx={{ fontSize: 20 }}>
            Postulación del {fecha(p.creadaEn)}
          </Typography>
          <Typography>Estado: {p.estado}</Typography>
          <Button href={`/empresa/postulaciones/${p.id}`}>
            Abrir postulación
          </Button>
        </Paper>
      ))}
      <Stack direction="row" spacing={2}>
        <Button disabled={pagina === 1} onClick={() => setPagina(pagina - 1)}>
          Anterior
        </Button>
        <Typography>Página {pagina}</Typography>
        <Button
          disabled={!lista || pagina * TAMANO_PAGINA >= lista.total}
          onClick={() => setPagina(pagina + 1)}
        >
          Siguiente
        </Button>
      </Stack>
    </Stack>
  );
}

type Candidatura = Postulacion & {
  perfil: {
    nombreCompleto: string;
    programa: string;
    nivelFormacion: string;
    institucion: string | null;
    avance: string | null;
    jornada: string | null;
    aval: boolean | null;
    disponibleDesde: string | null;
    idiomas: { idioma: string; nivel: string }[];
  };
  evaluacion: ReturnType<typeof evaluarElegibilidad>;
  archivos: { tipo: string; nombre: string; bytes: number }[];
};
export function DetalleCandidato({ id }: { id: string }) {
  // Carga inicial: cargando (sin `p` ni error), error (sin `p`, con error y «Reintentar») o éxito (`p`).
  const {
    datos: p,
    setDatos: setP,
    error,
    setError,
    recargar,
  } = useCarga<Candidatura>(`/empresa/postulaciones/${id}/revisar`, undefined, "POST");
  const [estado, setEstado] = useState("");
  const [ocupado, setOcupado] = useState(false);
  async function cambiar() {
    if (!estado) return;
    setOcupado(true);
    try {
      await solicitar(`/empresa/postulaciones/${id}/estado`, "POST", {
        estado,
      });
      const d = await solicitar<Candidatura>(`/empresa/postulaciones/${id}`);
      setP(d);
      setEstado("");
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setOcupado(false);
    }
  }
  async function archivo(tipo: string) {
    try {
      await abrirEnPestana(async () =>
        (
          await solicitar<{ url: string }>(
            `/empresa/postulaciones/${id}/archivos/${{ HOJA_DE_VIDA: "hoja-de-vida", SOPORTE_AVAL: "soporte-aval", FOTO: "foto" }[tipo]}`,
          )
        ).url,
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const etiquetas = {
    cumple: "Cumple",
    no_cumple: "No cumple",
    falta_informacion: "Falta información",
  };
  return (
    <Stack spacing={3} sx={{ maxWidth: 900, mx: "auto", p: 2, py: 4 }}>
      <Button href="/empresa/vacantes">Volver a mis vacantes</Button>
      {/* Mientras carga o si falla, la página también tiene su encabezado (el mismo título de la pestaña). */}
      {!p && (
        <Typography variant="h1" sx={{ fontSize: 28 }}>
          Detalle de postulación
        </Typography>
      )}
      {error && <AvisoError mensaje={error} reintentar={p ? undefined : recargar} />}
      {!p ? (
        !error && <Typography role="status">Cargando postulación…</Typography>
      ) : (
        <>
          <Typography variant="h1" sx={{ fontSize: 28 }}>
            {p.perfil.nombreCompleto}
          </Typography>
          <Typography>
            Estado: <Chip label={p.estado} color={p.estado === "Seleccionada" ? "success" : "default"} size="small" />
          </Typography>
          <Alert severity="info">
            Copia del perfil y archivos al postularse. Los datos son declarados
            por el estudiante.
          </Alert>
          <Typography variant="h2" sx={{ fontSize: 22 }}>
            Perfil enviado
          </Typography>
          <Typography>
            Programa: {p.perfil.programa || "Datos eliminados"}. Nivel: {nombreDe(NIVELES_FORMACION, p.perfil.nivelFormacion) || "Datos eliminados"}.
            Institución: {p.perfil.institucion || "Falta información"}.
          </Typography>
          <Typography>
            Avance: {nombreDe(AVANCES, p.perfil.avance ?? "") || "Falta información"}. Jornada:{" "}
            {nombreDe(JORNADAS, p.perfil.jornada ?? "") || "Falta información"}. Aval declarado:{" "}
            {p.perfil.aval === null
              ? "Falta información"
              : p.perfil.aval
                ? "Sí"
                : "No"}
            .
          </Typography>
          <Typography>
            Disponibilidad:{" "}
            {p.perfil.disponibleDesde
              ? // Fecha de calendario guardada a medianoche UTC: se muestra el día, sin pasarlo a hora de Bogotá.
                fechaLarga(p.perfil.disponibleDesde.slice(0, 10))
              : "Falta información"}
            . Idiomas:{" "}
            {p.perfil.idiomas.map((i) => `${nombreDe(IDIOMAS, i.idioma)} ${nombreDe(NIVELES_MCER, i.nivel)}`).join(", ") ||
              "Falta información"}
            .
          </Typography>
          <Typography>
            Programas solicitados:{" "}
            {p.evaluacion.programas.solicitados.join(", ") ||
              "No especificados"}
            . Programa declarado: {p.perfil.programa}. La empresa revisa la
            afinidad.
          </Typography>
          <Stack component="ul" spacing={1} sx={{ pl: 2.5 }}>
            {p.evaluacion.requisitos.map((r, i) => (
              <li key={i}>
                <Typography>
                  {r.requisito} ({r.excluyente ? "excluyente" : "deseable"}):{" "}
                  {etiquetas[r.resultado]}
                </Typography>
              </li>
            ))}
          </Stack>
          <Stack spacing={1}>
            {p.cvReemplazadoEn && <Typography>Hoja de vida reemplazada por el estudiante el {fecha(p.cvReemplazadoEn)}.</Typography>}
            {p.archivos.map((a) => (
              <Button key={a.tipo} onClick={() => archivo(a.tipo)}>
                Ver{" "}
                {a.tipo === "FOTO"
                  ? "foto opcional"
                  : a.tipo === "HOJA_DE_VIDA"
                    ? "hoja de vida"
                    : "soporte del aval"}
                : {a.nombre}
              </Button>
            ))}
          </Stack>
          <Typography variant="h2" sx={{ fontSize: 22 }}>
            Historial
          </Typography>
          <Historial items={p.historial} />
          {(TRANSICIONES[p.estado]?.length ?? 0) > 0 && (
            <Stack
              component="form"
              spacing={2}
              onSubmit={(e) => {
                e.preventDefault();
                void cambiar();
              }}
            >
              <TextField
                id="nuevo-estado"
                label="Nuevo estado"
                select
                required
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
              >
                <MenuItem value="">Selecciona un estado</MenuItem>
                {TRANSICIONES[p.estado].map((x) => (
                  <MenuItem key={x} value={x}>
                    {x}
                  </MenuItem>
                ))}
              </TextField>
              <Typography>
                El cambio se guardará en el historial y notificará al
                estudiante.
              </Typography>
              <Button
                type="submit"
                variant="contained"
                disabled={!estado || ocupado}
              >
                {ocupado ? "Guardando…" : "Actualizar estado"}
              </Button>
            </Stack>
          )}
        </>
      )}
    </Stack>
  );
}
