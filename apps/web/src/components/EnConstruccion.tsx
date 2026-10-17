import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";

/** Marcador de una sección que construye otro módulo; se reemplaza cuando ese módulo existe. */
export default function EnConstruccion({ title, modulo, children }: { title: string; modulo: string; children?: React.ReactNode }) {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Typography variant="h1" sx={{ fontSize: { xs: 24, md: 34 }, mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Esta sección se construye en {modulo}.
      </Typography>
      {children}
    </Container>
  );
}
