"use client";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { solicitar, type Lista } from "@/lib/mercado";
type Aviso = {
  id: string;
  texto: string;
  creadaEn: string;
  leidaEn: string | null;
};
export default function Notificaciones() {
  const [lista, setLista] = useState<
    (Lista<Aviso> & { sinLeer: number }) | null
  >(null);
  const [pagina, setPagina] = useState(1);
  const [error, setError] = useState("");
  useEffect(() => {
    void solicitar<Lista<Aviso> & { sinLeer: number }>(
      `/notificaciones?pagina=${pagina}`,
    )
      .then(setLista)
      .catch((e) => setError(e.message));
  }, [pagina]);
  async function actualizar() {
    try {
      const d = await solicitar<Lista<Aviso> & { sinLeer: number }>(
        `/notificaciones?pagina=${pagina}`,
      );
      setLista(d);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function leer(id: string) {
    try {
      await solicitar(`/notificaciones/${id}/leer`, "POST");
      await actualizar();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <Stack spacing={3} sx={{ maxWidth: 900, mx: "auto", p: 2, py: 4 }}>
      <Typography variant="h1" sx={{ fontSize: 28 }}>
        Notificaciones
      </Typography>
      <Typography role="status">
        {lista ? `${lista.sinLeer} sin leer` : "Cargando…"}
      </Typography>
      <Button onClick={actualizar}>Actualizar notificaciones</Button>
      {error && <Alert severity="error">{error}</Alert>}
      {lista?.items.length === 0 && (
        <Typography>No tienes notificaciones todavía.</Typography>
      )}
      {lista?.items.map((n) => (
        <Paper component="article" variant="outlined" sx={{ p: 2 }} key={n.id}>
          <Typography>{n.texto}</Typography>
          <Typography>
            {n.leidaEn ? "Leída" : "Sin leer"} ·{" "}
            {new Date(n.creadaEn).toLocaleString("es-CO", {
              timeZone: "America/Bogota",
            })}
          </Typography>
          {!n.leidaEn && (
            <Button onClick={() => leer(n.id)}>Marcar como leída</Button>
          )}
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
