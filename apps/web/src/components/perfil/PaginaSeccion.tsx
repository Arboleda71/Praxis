import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { paginaCuenta, panelCuenta } from "@/lib/estilos";
import Box from "@mui/material/Box";

/** Marco de las páginas de edición: como los formularios de M1 (tarjeta de 560 px en escritorio). */
export default function PaginaSeccion({ titulo, intro, children }: { titulo: string; intro?: string; children: React.ReactNode }) {
  return (
    <Box sx={paginaCuenta}>
      <Stack spacing={2.5} sx={{ ...(panelCuenta as object), maxWidth: { md: 560 } }}>
        <Button href="/estudiante/perfil" startIcon={<ArrowBackRounded />} sx={{ alignSelf: "flex-start", ml: -1 }}>
          Volver a mi perfil
        </Button>
        <div>
          <Typography variant="h1" sx={{ fontSize: { xs: 24, md: 28 } }}>
            {titulo}
          </Typography>
          {intro && (
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              {intro}
            </Typography>
          )}
        </div>
        {children}
      </Stack>
    </Box>
  );
}
