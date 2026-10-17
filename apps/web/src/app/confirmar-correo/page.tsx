import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import LinkOffRounded from "@mui/icons-material/LinkOffRounded";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Rol } from "@praxis/contracts";
import type { Metadata } from "next";
import ReenviarEnlace from "@/components/ReenviarEnlace";
import { paginaCuenta, panelCuenta } from "@/lib/estilos";
import { API_URL, getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Confirmar correo" };

const DESTINO: Record<Rol, { href: string; texto: string; cuenta: string }> = {
  estudiante: { href: "/estudiante/perfil", texto: "Ir a mi perfil", cuenta: "estudiante" },
  empresa: { href: "/empresa/perfil", texto: "Ir al perfil de la empresa", cuenta: "empresa" },
};

async function confirmar(token: string | undefined): Promise<Rol | null> {
  if (!token) return null;
  const res = await fetch(`${API_URL}/auth/confirmar-correo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
    cache: "no-store",
  }).catch(() => null);
  return res?.ok ? ((await res.json()) as { rol: Rol }).rol : null;
}

export default async function ConfirmarCorreo({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const rol = await confirmar((await searchParams).token);
  const session = rol ? null : await getSession();
  const centro = { ...panelCuenta, alignItems: "center", textAlign: "center" } as const;

  if (rol) {
    const d = DESTINO[rol];
    return (
      <Box sx={paginaCuenta}>
        <Stack spacing={2.5} sx={centro}>
          <Avatar aria-hidden sx={{ width: 56, height: 56, bgcolor: "#EDF7ED", color: "success.main" }}>
            <CheckCircleRounded />
          </Avatar>
          <Typography variant="h1" sx={{ fontSize: { xs: 24, md: 28 } }}>
            Tu correo quedó confirmado
          </Typography>
          <Typography color="text.secondary">Ya puedes usar Praxis con tu cuenta de {d.cuenta}.</Typography>
          <Button href={d.href} variant="contained" size="large" fullWidth>
            {d.texto}
          </Button>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={paginaCuenta}>
      <Stack spacing={2.5} sx={centro}>
        <Avatar aria-hidden sx={{ width: 56, height: 56, bgcolor: "#FDEDED", color: "error.main" }}>
          <LinkOffRounded />
        </Avatar>
        <Typography variant="h1" sx={{ fontSize: { xs: 24, md: 28 } }}>
          Este enlace ya no sirve
        </Typography>
        <Typography color="text.secondary">Venció o ya se usó. Pide uno nuevo y ábrelo en las próximas 24 horas.</Typography>
        {session && !session.correoConfirmado ? (
          <ReenviarEnlace variant="contained" label="Enviar un enlace nuevo" fullWidth />
        ) : (
          <Button href="/ingresar?next=/revisa-tu-correo" variant="contained" size="large" fullWidth>
            Inicia sesión para pedir otro
          </Button>
        )}
      </Stack>
    </Box>
  );
}
