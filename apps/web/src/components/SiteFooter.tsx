import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Logo from "./Logo";

export default function SiteFooter() {
  return (
    <Box component="footer" sx={{ bgcolor: "text.primary", color: "common.white", py: { xs: 4, md: 5 } }}>
      <Container maxWidth="lg">
        <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 2.5, md: 5 }} sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}>
          <Stack spacing={1}>
            <Logo light />
            <Typography variant="body2" sx={{ color: "grey.300" }}>
              Portal de prácticas profesionales · Piloto Medellín y Valle de Aburrá
            </Typography>
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 1.5, md: 4 }}>
            <Link href="/politica-de-datos" variant="body2" color="inherit">
              Política de tratamiento de datos
            </Link>
            <Typography variant="body2" sx={{ color: "grey.300" }}>
              Proyecto académico · datos ficticios
            </Typography>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
