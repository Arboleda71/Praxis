import LinkOffRounded from "@mui/icons-material/LinkOffRounded";
import LockRounded from "@mui/icons-material/LockRounded";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Role } from "@/lib/nav";

type Props = { icon: React.ReactNode; title: string; text: string; href: string; action: string };

/** Página de error que explica qué pasó y ofrece a dónde ir. */
export default function Aviso({ icon, title, text, href, action }: Props) {
  return (
    <Container maxWidth="sm" sx={{ py: { xs: 10, md: 16 } }}>
      <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center" }}>
        <Avatar aria-hidden sx={{ width: 64, height: 64, bgcolor: "#DBEAFE", color: "primary.main" }}>
          {icon}
        </Avatar>
        <Typography variant="h1" sx={{ fontSize: { xs: 24, md: 34 } }}>
          {title}
        </Typography>
        <Typography color="text.secondary">{text}</Typography>
        <Button href={href} variant="contained">
          {action}
        </Button>
      </Stack>
    </Container>
  );
}

export function NoEncontrada() {
  return (
    <Aviso
      icon={<LinkOffRounded fontSize="large" />}
      title="No encontramos esta página"
      text="Puede que el enlace esté mal escrito o que la página ya no exista."
      href="/"
      action="Ir al inicio"
    />
  );
}

const HOME: Record<Role, { href: string; action: string; otra: string; propia: string }> = {
  estudiante: { href: "/estudiante/perfil", action: "Ir a mi perfil", otra: "empresa", propia: "estudiante" },
  empresa: { href: "/empresa/vacantes", action: "Ir a mis vacantes", otra: "estudiante", propia: "empresa" },
};

/** Se muestra cuando un usuario con sesión entra a una sección de otro rol. No revela datos de la sección. */
export function SinAcceso({ role }: { role: Role }) {
  const h = HOME[role];
  return (
    <Aviso
      icon={<LockRounded fontSize="large" />}
      title="No tienes acceso a esta sección"
      text={`Esta sección es para cuentas de ${h.otra}. Con tu cuenta de ${h.propia} puedes seguir desde aquí.`}
      href={h.href}
      action={h.action}
    />
  );
}
