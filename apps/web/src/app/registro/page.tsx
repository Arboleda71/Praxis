import ApartmentRounded from "@mui/icons-material/ApartmentRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import SchoolRounded from "@mui/icons-material/SchoolRounded";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";
import { paginaCuenta } from "@/lib/estilos";
import { requireGuest } from "@/lib/session";

export const metadata: Metadata = { title: "Crear cuenta" };

const TIPOS = [
  { href: "/registro/estudiante", Icon: SchoolRounded, titulo: "Soy estudiante", texto: "Busca prácticas, revisa requisito por requisito y sigue tus postulaciones. Siempre gratis." },
  { href: "/registro/empresa", Icon: ApartmentRounded, titulo: "Soy empresa", texto: "Practicantes que ya cumplen tus requisitos. Empieza gratis." },
];

export default async function ElegirTipo() {
  await requireGuest();
  return (
    <Box sx={paginaCuenta}>
      <Stack spacing={2.5} sx={{ maxWidth: 760, mx: "auto" }}>
        <Typography variant="h1" sx={{ fontSize: { xs: 24, md: 28 } }}>
          Crea tu cuenta
        </Typography>
        <Typography color="text.secondary">Elige cómo vas a usar Praxis. El tipo de cuenta no se puede cambiar después.</Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          {TIPOS.map(({ href, Icon, titulo, texto }) => (
            <Card key={href} variant="outlined" sx={{ flex: 1, borderColor: "divider" }}>
              <CardActionArea href={href} sx={{ p: 2.5, display: "flex", gap: 2, alignItems: "center", justifyContent: "flex-start", height: "100%" }}>
                <Avatar aria-hidden sx={{ width: 44, height: 44, bgcolor: "#DBEAFE", color: "primary.main" }}>
                  <Icon />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" component="h2" sx={{ fontSize: 18 }}>
                    {titulo}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {texto}
                  </Typography>
                </Box>
                <ChevronRightRounded aria-hidden sx={{ color: "text.secondary" }} />
              </CardActionArea>
            </Card>
          ))}
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
          ¿Ya tienes cuenta?{" "}
          <Link href="/ingresar" sx={{ fontWeight: 600, display: "inline-block", py: 1.5 }}>
            Inicia sesión
          </Link>
        </Typography>
      </Stack>
    </Box>
  );
}
