import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";
import FormularioRegistro from "@/components/FormularioRegistro";
import { paginaCuenta, panelCuenta } from "@/lib/estilos";
import { requireGuest } from "@/lib/session";

export const metadata: Metadata = { title: "Crear cuenta de estudiante" };

export default async function RegistroEstudiante() {
  await requireGuest();
  return (
    <Box sx={paginaCuenta}>
      <Stack spacing={2.5} sx={panelCuenta}>
        <Button href="/registro" startIcon={<ArrowBackRounded />} sx={{ alignSelf: "flex-start", ml: -1 }}>
          Cambiar tipo de cuenta
        </Button>
        <Typography variant="h1" sx={{ fontSize: { xs: 24, md: 28 } }}>
          Crea tu cuenta de estudiante
        </Typography>
        <Typography color="text.secondary">
          Es gratis, siempre. Tu perfil y tu hoja de vida solo los verán las empresas a cuyas vacantes te postules.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Todos los campos son obligatorios.
        </Typography>
        <FormularioRegistro tipo="estudiante" />
      </Stack>
    </Box>
  );
}
