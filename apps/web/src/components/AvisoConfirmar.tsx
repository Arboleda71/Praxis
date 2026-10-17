"use client";

import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Container from "@mui/material/Container";
import type { Rol } from "@praxis/contracts";
import { usePathname } from "next/navigation";
import ReenviarEnlace from "./ReenviarEnlace";

/** Aviso persistente mientras el correo no esté confirmado (FR-010). */
export default function AvisoConfirmar({ correo, rol }: { correo: string; rol: Rol }) {
  // En estas páginas el mismo mensaje ya es el contenido principal.
  if (["/revisa-tu-correo", "/confirmar-correo"].includes(usePathname())) return null;
  return (
    <Alert severity="warning" square sx={{ py: 1.5 }} slotProps={{ message: { sx: { width: "100%" } } }}>
      <Container maxWidth="lg" disableGutters sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: { md: 2 }, alignItems: { md: "center" } }}>
        <div style={{ flex: 1 }}>
          <AlertTitle sx={{ mb: 0 }}>Confirma tu correo</AlertTitle>
          Te enviamos un enlace a {correo}.{rol === "empresa" && " Lo necesitas para publicar vacantes."}
        </div>
        <ReenviarEnlace variant="text" color="inherit" />
      </Container>
    </Alert>
  );
}
