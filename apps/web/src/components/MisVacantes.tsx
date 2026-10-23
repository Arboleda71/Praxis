"use client";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { solicitar, type Lista, type Vacante } from "@/lib/mercado";
import { fechaLarga } from "@/lib/perfil-cliente";

export default function MisVacantes() {
  const [lista, setLista] = useState<Lista<Vacante> | null>(null);
  const [pagina, setPagina] = useState(1);
  const [error, setError] = useState("");
  const [accion, setAccion] = useState<{
    id: string;
    tipo: "publicar" | "cerrar" | "eliminar";
  } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  async function cargar(p: number) {
    try {
      const datos = await solicitar<Lista<Vacante>>(
        `/empresa/vacantes?pagina=${p}`,
      );
      setLista(datos);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void solicitar<Lista<Vacante>>(`/empresa/vacantes?pagina=${pagina}`)
      .then(setLista)
      .catch((e) => setError(e.message));
  }, [pagina]);
  async function confirmar() {
    if (!accion) return;
    setOcupado(true);
    setError("");
    try {
      await solicitar(
        `/empresa/vacantes/${accion.id}${accion.tipo === "eliminar" ? "" : `/${accion.tipo}`}`,
        accion.tipo === "eliminar" ? "DELETE" : "POST",
      );
      setAccion(null);
      await cargar(pagina);
    } catch (e) {
      setError((e as Error).message);
      setAccion(null);
    } finally {
      setOcupado(false);
    }
  }
  return (
    <Stack spacing={3} sx={{ maxWidth: 960, mx: "auto", p: 2, py: 4 }}>
      <Typography variant="h1" sx={{ fontSize: 28 }}>
        Mis vacantes
      </Typography>
      <Typography>
        Te quedan {lista?.cuposGratis ?? "…"} de 2 publicaciones gratis en estos
        6 meses.
      </Typography>
      <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
        <Button href="/empresa/vacantes/nueva" variant="contained">
          Crear vacante
        </Button>
        <Button href="/empresa/planes">Planes y pagos</Button>
        <Button href="/notificaciones">Notificaciones</Button>
      </Stack>
      {error && (
        <Alert severity="error">
          {error} <Button href="/empresa/perfil">Revisar mi empresa</Button>
        </Alert>
      )}
      {!lista ? (
        <Typography role="status">Cargando vacantes…</Typography>
      ) : lista.items.length === 0 ? (
        <Typography>
          Aún no tienes vacantes. Crea tu primer borrador.
        </Typography>
      ) : (
        lista.items.map((v) => (
          <Paper
            component="article"
            variant="outlined"
            key={v.id}
            sx={{ p: 2 }}
          >
            <Stack spacing={1.5}>
              <Typography variant="h2" sx={{ fontSize: 20 }}>
                {v.titulo}
              </Typography>
              <Typography>
                Estado: {v.estado}
                {v.motivoCierre ? ` (${v.motivoCierre})` : ""}. Vigencia:{" "}
                {fechaLarga(v.vigencia.slice(0, 10))}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                <Button href={`/empresa/vacantes/${v.id}`}>
                  {v.estado === "Borrador" ? "Editar borrador" : "Ver vacante"}
                </Button>
                {v.estado === "Borrador" && (
                  <>
                    <Button
                      onClick={() => setAccion({ id: v.id, tipo: "publicar" })}
                    >
                      Publicar
                    </Button>
                    <Button
                      onClick={() => setAccion({ id: v.id, tipo: "eliminar" })}
                    >
                      Eliminar borrador
                    </Button>
                  </>
                )}
                {v.estado === "Abierta" && (
                  <Button
                    onClick={() => setAccion({ id: v.id, tipo: "cerrar" })}
                  >
                    Cerrar vacante
                  </Button>
                )}
                {v.estado !== "Borrador" && (
                  <Button href={`/empresa/vacantes/${v.id}/postulaciones`}>
                    Ver postulaciones
                  </Button>
                )}
              </Stack>
            </Stack>
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
        open={!!accion}
        onClose={() => !ocupado && setAccion(null)}
        aria-labelledby="confirmar-vacante"
      >
        <DialogTitle id="confirmar-vacante">
          {accion?.tipo === "publicar"
            ? "Publicar vacante"
            : accion?.tipo === "cerrar"
              ? "Cerrar vacante"
              : "Eliminar borrador"}
        </DialogTitle>
        <DialogContent>
          {accion?.tipo === "publicar"
            ? "Publicar consume un cupo. Los requisitos quedarán fijos y no podrás cambiarlos."
            : accion?.tipo === "cerrar"
              ? "No podrás reabrirla. Las postulaciones en curso seguirán disponibles."
              : "Se eliminará este borrador."}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAccion(null)} disabled={ocupado}>
            Cancelar
          </Button>
          <Button onClick={confirmar} disabled={ocupado}>
            {ocupado ? "Procesando…" : "Confirmar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
