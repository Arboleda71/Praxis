import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de tratamiento de datos" };

const SECCIONES = [
  ["Quién trata tus datos", "Praxis es un proyecto académico de prácticas profesionales. Mientras sea una demostración, solo usa datos ficticios."],
  ["Qué datos pedimos", "Para crear tu cuenta: nombre o razón social, NIT (empresas), correo y contraseña, que guardamos protegida. Nunca pedimos edad, sexo, estado civil ni foto."],
  ["Para qué los usamos", "Para identificarte, comparar tu perfil con los requisitos de las vacantes y avisarte sobre tus procesos. No vendemos datos ni mostramos publicidad."],
  ["Quién los ve", "Tu perfil y tu hoja de vida solo los ven las empresas a cuyas vacantes te postulas, tal como estaban al postularte."],
  ["Tus derechos (Ley 1581 de 2012)", "Puedes conocer, actualizar, rectificar y pedir la supresión de tus datos, y revocar esta autorización. Escríbenos desde el correo de tu cuenta."],
];

export default function PoliticaDeDatos() {
  return (
    <Box sx={{ bgcolor: "background.paper", py: { xs: 3, md: 7 } }}>
      <Container maxWidth="md">
        <Stack spacing={{ xs: 3, md: 3.5 }} sx={{ maxWidth: 720, mx: "auto" }}>
          <div>
            <Typography variant="h1" sx={{ fontSize: { xs: 24, md: 34 } }}>
              Política de tratamiento de datos
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Vigente desde el 17 de octubre de 2026
            </Typography>
          </div>
          <Alert severity="info">
            <AlertTitle>Proyecto académico</AlertTitle>
            Esta política describe una demostración con datos ficticios. No es un documento legal revisado.
          </Alert>
          {SECCIONES.map(([titulo, texto]) => (
            <section key={titulo}>
              <Typography variant="h2" sx={{ fontSize: { xs: 18, md: 20 }, mb: 0.75 }}>
                {titulo}
              </Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {texto}
              </Typography>
            </section>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
