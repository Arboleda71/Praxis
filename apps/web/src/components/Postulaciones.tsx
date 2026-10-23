"use client";
import Alert from "@mui/material/Alert";
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
  TRANSICIONES,
  type evaluarElegibilidad,
} from "@praxis/contracts";
import { useEffect, useState } from "react";
import { solicitar, type Lista } from "@/lib/mercado";

type Entrada = { estado: string; fecha: string };
type Postulacion = {
  id: string;
  estado: string;
  creadaEn: string;
  historial: Entrada[];
  vacante: { titulo: string; empresa: { razonSocial: string } };
};
const fecha = (d: string) =>
  new Date(d).toLocaleString("es-CO", { timeZone: "America/Bogota" });
function Historial({ items }: { items: Entrada[] }) {
  return (
    <Stack component="ol" spacing={1} sx={{ pl: 3 }}>
      {items.map((h, n) => (
        <li key={n}>
          <Typography>
            {h.estado} · {fecha(h.fecha)}
          </Typography>
        </li>
      ))}
    </Stack>
  );
}

export function MisPostulaciones() {
  const [lista, setLista] = useState<Lista<Postulacion> | null>(null);
  const [pagina, setPagina] = useState(1);
  const [error, setError] = useState("");
  const [retirar, setRetirar] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  useEffect(() => {
    void solicitar<Lista<Postulacion>>(`/postulaciones?pagina=${pagina}`)
      .then(setLista)
      .catch((e) => setError(e.message));
  }, [pagina]);
  async function confirmar() {
    if (!retirar) return;
    setOcupado(true);
    try {
      await solicitar(`/postulaciones/${retirar}/retirar`, "POST");
      const datos = await solicitar<Lista<Postulacion>>(
        `/postulaciones?pagina=${pagina}`,
      );
      setLista(datos);
      setRetirar(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
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
      {error && <Alert severity="error">{error}</Alert>}
      {!lista ? (
        <Typography role="status">Cargando postulaciones…</Typography>
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
              Estado: <strong>{p.estado}</strong>
            </Typography>
            <Typography variant="h3" sx={{ fontSize: 18, mt: 2 }}>
              Historial de la postulación
            </Typography>
            <Historial items={p.historial} />
            <Button
              onClick={async () => {
                try {
                  const d = await solicitar<{ url: string }>(
                    `/postulaciones/${p.id}/archivos/hoja-de-vida`,
                  );
                  window.open(d.url, "_blank", "noopener");
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
          disabled={!lista || pagina * 20 >= lista.total}
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
          <Button disabled={ocupado} onClick={confirmar}>
            {ocupado ? "Retirando…" : "Confirmar retirada"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

export function Candidatos({ vacanteId }: { vacanteId: string }) {
  const [lista, setLista] = useState<Lista<Postulacion> | null>(null);
  const [pagina, setPagina] = useState(1);
  const [error, setError] = useState("");
  useEffect(() => {
    void solicitar<Lista<Postulacion>>(
      `/empresa/vacantes/${vacanteId}/postulaciones?pagina=${pagina}`,
    )
      .then(setLista)
      .catch((e) => setError(e.message));
  }, [vacanteId, pagina]);
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
      {error && <Alert severity="error">{error}</Alert>}
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
          disabled={!lista || pagina * 20 >= lista.total}
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
  const [p, setP] = useState<Candidatura | null>(null);
  const [error, setError] = useState("");
  const [estado, setEstado] = useState("");
  const [ocupado, setOcupado] = useState(false);
  useEffect(() => {
    void solicitar<Candidatura>(`/empresa/postulaciones/${id}`)
      .then(setP)
      .catch((e) => setError(e.message));
  }, [id]);
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
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setOcupado(false);
    }
  }
  async function archivo(tipo: string) {
    try {
      const d = await solicitar<{ url: string }>(
        `/empresa/postulaciones/${id}/archivos/${{ HOJA_DE_VIDA: "hoja-de-vida", SOPORTE_AVAL: "soporte-aval", FOTO: "foto" }[tipo]}`,
      );
      window.open(d.url, "_blank", "noopener");
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
      {error && <Alert severity="error">{error}</Alert>}
      {!p ? (
        <Typography role="status">Cargando postulación…</Typography>
      ) : (
        <>
          <Typography variant="h1" sx={{ fontSize: 28 }}>
            {p.perfil.nombreCompleto}
          </Typography>
          <Typography>
            Estado: <strong>{p.estado}</strong>
          </Typography>
          <Alert severity="info">
            Copia del perfil y archivos al postularse. Los datos son declarados
            por el estudiante.
          </Alert>
          <Typography variant="h2" sx={{ fontSize: 22 }}>
            Perfil enviado
          </Typography>
          <Typography>
            Programa: {p.perfil.programa}. Nivel: {p.perfil.nivelFormacion}.
            Institución: {p.perfil.institucion || "Falta información"}.
          </Typography>
          <Typography>
            Avance: {p.perfil.avance || "Falta información"}. Jornada:{" "}
            {p.perfil.jornada || "Falta información"}. Aval declarado:{" "}
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
              ? fecha(p.perfil.disponibleDesde)
              : "Falta información"}
            . Idiomas:{" "}
            {p.perfil.idiomas.map((i) => `${i.idioma} ${i.nivel}`).join(", ") ||
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
