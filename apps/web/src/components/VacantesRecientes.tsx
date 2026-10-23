import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { MODALIDADES } from "@praxis/contracts";
import { API_URL } from "@/lib/session";
import { fechaLarga } from "@/lib/perfil-cliente";
type Oferta = {
  id: string;
  titulo: string;
  modalidad: string;
  ciudad: string | null;
  vigencia: string;
  empresa: { razonSocial: string };
};
/** HTML del servidor: el visitante recibe solo las cinco ofertas básicas, sin cargar el buscador. */
export default async function VacantesRecientes() {
  const res = await fetch(`${API_URL}/vacantes/recientes`, {
    cache: "no-store",
  }).catch(() => null);
  if (!res?.ok)
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        No pudimos cargar las últimas prácticas. Inténtalo de nuevo en unos
        momentos.
      </Alert>
    );
  const ofertas = (await res.json()) as Oferta[];
  return (
    <Stack
      component="section"
      spacing={3}
      sx={{ maxWidth: 960, mx: "auto", p: 2, py: 4 }}
      aria-labelledby="ultimas-practicas"
    >
      <Typography id="ultimas-practicas" variant="h2" sx={{ fontSize: 28 }}>
        Últimas cinco prácticas abiertas
      </Typography>
      {ofertas.length === 0 && (
        <Typography>No hay prácticas abiertas todavía.</Typography>
      )}
      {ofertas.map((v) => (
        <Paper key={v.id} component="article" variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h3" sx={{ fontSize: 20 }}>
            {v.titulo}
          </Typography>
          <Typography>
            {v.empresa.razonSocial} ·{" "}
            {MODALIDADES.find((m) => m.id === v.modalidad)?.nombre} {v.ciudad}.
            Vigencia: {fechaLarga(v.vigencia.slice(0, 10))}
          </Typography>
          <Button
            href={`/ingresar?next=${encodeURIComponent(`/estudiante/vacantes/${v.id}`)}`}
          >
            Ingresar para consultar
          </Button>
        </Paper>
      ))}
    </Stack>
  );
}
