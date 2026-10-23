import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import FaltaInformacion from "./FaltaInformacion";

type Props = { titulo: string; editar?: string; children: React.ReactNode };

export default function SeccionPerfil({ titulo, editar, children }: Props) {
  return (
    <Paper component="section" variant="outlined" aria-labelledby={`seccion-${titulo}`} sx={{ p: 2, borderRadius: 2 }}>
      <Stack spacing={1.5}>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <Typography id={`seccion-${titulo}`} variant="h2" sx={{ fontSize: 18 }}>
            {titulo}
          </Typography>
          {editar && (
            <Button href={editar} aria-label={`Editar ${titulo.toLowerCase()}`}>
              Editar
            </Button>
          )}
        </Stack>
        {children}
      </Stack>
    </Paper>
  );
}

/** Etiqueta y valor; sin valor, «Falta información» con enlace a la sección. */
export function Campo({ etiqueta, valor, completar }: { etiqueta: string; valor: string | null | undefined; completar?: string }) {
  return (
    <div>
      <Typography variant="caption" color="text.secondary" component="p">
        {etiqueta}
      </Typography>
      {valor ? <Typography>{valor}</Typography> : <FaltaInformacion href={completar} campo={etiqueta.toLowerCase()} />}
    </div>
  );
}
