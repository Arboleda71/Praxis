import WorkOutlineRounded from "@mui/icons-material/WorkOutlineRounded";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { EstadoVacio, TarjetaVacante } from "@/components/mercado-ui";
import { resumenVacante } from "@/lib/mercado";
import { API_URL } from "@/lib/session";

type Oferta = {
  id: string;
  titulo: string;
  modalidad: string;
  ciudad: string | null;
  vigencia: string;
  empresa: { razonSocial: string };
};

/**
 * Bloque del inicio para el visitante (mockups M6 · Grupo 1): las cinco ofertas básicas, sin búsqueda ni
 * filtros. HTML del servidor: no carga el buscador.
 */
export default async function VacantesRecientes() {
  // Si la API no responde (o su cuerpo no llega o no es JSON), el inicio se muestra igual con el aviso en
  // lugar de quedarse colgado o fallar entero. El límite cubre también la lectura del cuerpo.
  const ofertas = await fetch(`${API_URL}/vacantes/recientes`, {
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  })
    .then((res) => (res.ok ? (res.json() as Promise<Oferta[]>) : null))
    .then((d) => (Array.isArray(d) ? d : null))
    .catch(() => null);
  return (
    <Stack
      component="section"
      spacing={{ xs: 2, md: 2.5 }}
      sx={{ width: "100%", maxWidth: 720, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 3, md: 5 } }}
      aria-labelledby="ultimas-practicas"
    >
      <Typography id="ultimas-practicas" variant="h2" sx={{ fontSize: 20 }}>
        Últimas cinco prácticas abiertas
      </Typography>
      {!ofertas ? (
        <Alert severity="warning">
          <AlertTitle>No pudimos cargar las últimas prácticas.</AlertTitle>
          Inténtalo de nuevo en unos momentos.
        </Alert>
      ) : ofertas.length === 0 ? (
        <EstadoVacio icono={<WorkOutlineRounded fontSize="large" />} mensaje="No hay prácticas abiertas todavía." />
      ) : (
        ofertas.map((v) => (
          <TarjetaVacante
            key={v.id}
            encabezado="h3"
            titulo={v.titulo}
            datos={resumenVacante(v)}
            href={`/ingresar?next=${encodeURIComponent(`/estudiante/vacantes/${v.id}`)}`}
            accion="Ingresar para consultar"
          />
        ))
      )}
    </Stack>
  );
}
