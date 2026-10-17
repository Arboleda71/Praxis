import MarkEmailUnreadRounded from "@mui/icons-material/MarkEmailUnreadRounded";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ReenviarEnlace from "@/components/ReenviarEnlace";
import { paginaCuenta, panelCuenta } from "@/lib/estilos";
import { inicioDe } from "@/lib/rutas";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Revisa tu correo" };

export default async function RevisaTuCorreo() {
  const session = await getSession();
  if (!session) redirect("/ingresar?next=/revisa-tu-correo");
  if (session.correoConfirmado) redirect(inicioDe(session.rol));

  return (
    <Box sx={paginaCuenta}>
      <Stack spacing={2.5} sx={{ ...panelCuenta, alignItems: "center", textAlign: "center" }}>
        <Avatar aria-hidden sx={{ width: 56, height: 56, bgcolor: "#DBEAFE", color: "primary.main" }}>
          <MarkEmailUnreadRounded />
        </Avatar>
        <Typography variant="h1" sx={{ fontSize: { xs: 24, md: 28 } }}>
          Revisa tu correo
        </Typography>
        <Typography color="text.secondary">
          Enviamos un enlace a <b>{session.correo}</b>. Ábrelo en las próximas 24 horas para confirmar tu correo.
        </Typography>
        {session.rol === "empresa" && (
          <Alert severity="info" sx={{ textAlign: "left", width: "100%" }}>
            <AlertTitle>Lo necesitas para publicar vacantes</AlertTitle>
            Mientras tanto puedes completar el perfil de tu empresa.
          </Alert>
        )}
        <ReenviarEnlace fullWidth />
        <Typography variant="body2" color="text.secondary">
          ¿No te llegó? Revisa la carpeta de spam. Puedes pedir un enlace nuevo cada minuto.
        </Typography>
      </Stack>
    </Box>
  );
}
