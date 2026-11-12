import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { Metadata } from "next";
import FormularioOlvide from "@/components/FormularioOlvide";
import { paginaCuenta, panelCuenta } from "@/lib/estilos";

export const metadata: Metadata = { title: "Olvidé mi contraseña" };

export default function OlvideContrasena() {
  return (
    <Box sx={paginaCuenta}>
      <Stack spacing={2.5} sx={panelCuenta}>
        <FormularioOlvide />
      </Stack>
    </Box>
  );
}
