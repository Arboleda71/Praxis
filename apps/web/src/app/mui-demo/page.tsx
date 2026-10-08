"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

export default function MuiDemoPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12 font-sans">
      <Stack spacing={3}>
        <Typography variant="h4" component="h1">
          Praxis · Material UI
        </Typography>
        <Typography>
          Componentes con el tema global, la fuente Geist y utilidades de Tailwind.
        </Typography>
        <Alert severity="success">
          Material UI está integrado. Esta página es una demostración visual.
        </Alert>
        <Card variant="outlined" className="rounded-2xl p-6">
          <Stack spacing={3}>
            <Typography variant="h6" component="h2">
              Componentes de ejemplo
            </Typography>
            <TextField
              id="demo-name"
              label="Nombre"
              placeholder="Escribe tu nombre"
              helperText="Campo de prueba; no se envían datos."
              fullWidth
            />
            <TextField
              id="demo-email"
              label="Correo electrónico"
              type="email"
              variant="filled"
              fullWidth
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button variant="contained" type="button">Primario</Button>
              <Button variant="outlined" color="secondary" type="button">
                Secundario
              </Button>
              <Button variant="text" disabled>Deshabilitado</Button>
            </Stack>
            <Alert severity="info">
              El borde redondeado y el espaciado de esta tarjeta usan Tailwind CSS 4.
            </Alert>
          </Stack>
        </Card>
      </Stack>
    </main>
  );
}
