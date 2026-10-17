"use client";

import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Props = { variant?: "outlined" | "contained" | "text"; label?: string; fullWidth?: boolean; color?: "primary" | "inherit" };

/** Pide un enlace de confirmación nuevo: uno por minuto; el anterior deja de servir. */
export default function ReenviarEnlace({ variant = "outlined", label = "Reenviar enlace", fullWidth, color = "primary" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [segundos, setSegundos] = useState(0);
  const [estado, setEstado] = useState<"inicial" | "enviado" | "error">("inicial");

  useEffect(() => {
    if (segundos <= 0) return;
    const t = setTimeout(() => setSegundos((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [segundos]);

  async function reenviar() {
    const res = await fetch("/api/auth/reenviar-confirmacion", { method: "POST" }).catch(() => null);
    if (res?.status === 204) {
      setEstado("enviado");
      setSegundos(60);
    } else if (res?.status === 429) {
      setSegundos((await res.json()).segundos ?? 60);
    } else if (res?.status === 401) {
      router.push(`/ingresar?next=${encodeURIComponent(pathname)}`);
    } else if (res?.status === 409) {
      router.refresh(); // ya estaba confirmado
    } else {
      setEstado("error");
    }
  }

  return (
    <Stack spacing={2} sx={{ width: fullWidth ? "100%" : "auto" }}>
      <div aria-live="polite">
        {estado === "enviado" && (
          <Alert severity="success">
            <AlertTitle>Enviamos un enlace nuevo</AlertTitle>
            El enlace anterior ya no sirve. Usa el más reciente.
          </Alert>
        )}
        {estado === "error" && <Alert severity="error">No pudimos enviar el enlace. Inténtalo de nuevo en un momento.</Alert>}
      </div>
      <Button variant={variant} color={color} fullWidth={fullWidth} size={fullWidth ? "large" : "medium"} disabled={segundos > 0} onClick={reenviar}>
        {segundos > 0 ? `Reenviar en ${segundos} s` : label}
      </Button>
    </Stack>
  );
}
