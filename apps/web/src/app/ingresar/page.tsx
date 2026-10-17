import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";
import FormularioIngreso from "@/components/FormularioIngreso";
import { paginaCuenta, panelCuenta } from "@/lib/estilos";
import { requireGuest } from "@/lib/session";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function Ingresar({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  await requireGuest();
  const { next } = await searchParams;
  return (
    <Box sx={paginaCuenta}>
      <Stack spacing={2.5} sx={panelCuenta}>
        <Typography variant="h1" sx={{ fontSize: { xs: 24, md: 28 } }}>
          Inicia sesión
        </Typography>
        <FormularioIngreso next={next} />
      </Stack>
    </Box>
  );
}
