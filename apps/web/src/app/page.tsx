import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import RequisitosEjemplo from "@/components/RequisitosEjemplo";

const PASOS = [
  ["Completa tu perfil académico", "Programa, semestre, aval y disponibilidad. Solo lo que se usa para comparar."],
  ["Revisa cada requisito", "Ves qué cumples, qué no y qué te falta completar, sin puntajes."],
  ["Postúlate y sigue tu proceso", "Solo a lo que cumples, con el estado y el historial siempre visibles."],
];

export default function Inicio() {
  return (
    <>
      <Box component="section" sx={{ bgcolor: "background.paper" }}>
        <Container maxWidth="lg" sx={{ py: { xs: 4, md: 11 } }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 4, md: 12 }} sx={{ alignItems: { md: "center" } }}>
            <Stack spacing={{ xs: 2, md: 3 }} sx={{ flex: 1 }}>
              <Typography variant="overline" component="p" color="primary" sx={{ lineHeight: 1.5 }}>
                Prácticas profesionales · Medellín y Valle de Aburrá
              </Typography>
              <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 40 } }}>
                Encuentra tu práctica y descubre si cumples los requisitos antes de postularte
              </Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.55 }}>
                Praxis conecta a estudiantes habilitados con empresas que ofrecen prácticas profesionales. No es una
                bolsa de empleo ni reemplaza los trámites de tu institución.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ pt: 1 }}>
                <Button href="/registro/estudiante" variant="contained" size="large">
                  Soy estudiante
                </Button>
                <Button href="/registro/empresa" variant="outlined" size="large">
                  Soy empresa
                </Button>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: { xs: "center", sm: "left" } }}>
                ¿Ya tienes cuenta?{" "}
                <Link href="/ingresar" sx={{ fontWeight: 600 }}>
                  Inicia sesión
                </Link>
              </Typography>
            </Stack>

            <Stack spacing={1.5} sx={{ width: { md: 480 } }}>
              <RequisitosEjemplo />
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
                Sin puntajes ni porcentajes: cada requisito se muestra por separado.
              </Typography>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Box component="section" aria-labelledby="como-funciona">
        <Container maxWidth="lg" sx={{ py: { xs: 4, md: 9 } }}>
          <Typography id="como-funciona" variant="h2" sx={{ fontSize: { xs: 24, md: 34 }, mb: { xs: 2.5, md: 5 }, textAlign: { md: "center" } }}>
            Cómo funciona
          </Typography>
          <Stack component="ol" direction={{ xs: "column", md: "row" }} spacing={{ xs: 2.5, md: 6 }} sx={{ listStyle: "none", m: 0, p: 0 }}>
            {PASOS.map(([titulo, detalle], i) => (
              <Stack
                component="li"
                key={titulo}
                direction={{ xs: "row", md: "column" }}
                spacing={1.5}
                sx={{ flex: 1, alignItems: { xs: "flex-start", md: "center" }, textAlign: { md: "center" } }}
              >
                <Avatar
                  aria-hidden
                  sx={{
                    width: { xs: 32, md: 40 },
                    height: { xs: 32, md: 40 },
                    fontSize: { xs: 14, md: 18 },
                    fontWeight: 600,
                    bgcolor: { xs: "primary.main", md: "#DBEAFE" },
                    color: { xs: "common.white", md: "primary.main" },
                  }}
                >
                  {i + 1}
                </Avatar>
                <Box>
                  <Typography variant="h6" component="h3" sx={{ fontSize: { xs: 16, md: 20 } }}>
                    {titulo}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.5 }}>
                    {detalle}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Container>
      </Box>

      <Box component="section" sx={{ bgcolor: "#1E3A8A", color: "common.white" }}>
        <Container maxWidth="lg" sx={{ py: { xs: 4, md: 7 } }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 2, md: 6 }} sx={{ alignItems: { md: "center" } }}>
            <Stack spacing={1.25} sx={{ flex: 1 }}>
              <Typography variant="h2" sx={{ fontSize: { xs: 22, md: 28 } }}>
                ¿Tu empresa ofrece prácticas profesionales?
              </Typography>
              <Typography sx={{ color: "#DBEAFE", lineHeight: 1.5 }}>
                Publica vacantes con requisitos claros y recibe postulaciones solo de estudiantes que cumplen los
                requisitos obligatorios. Empieza gratis.
              </Typography>
            </Stack>
            <Button href="/registro/empresa" variant="contained" color="secondary" size="large">
              Crear cuenta de empresa
            </Button>
          </Stack>
        </Container>
      </Box>
    </>
  );
}
