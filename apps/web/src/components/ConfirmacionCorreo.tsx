"use client";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";

export default function ConfirmacionCorreo({ token }: { token?: string }) {
  const [rol, setRol] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  async function confirmar() {
    setEnviando(true);
    setError("");
    try {
      const res = await fetch("/api/auth/confirmar-correo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const r = await res.json();
      if (res.ok) setRol(r.rol);
      else setError(r.mensaje ?? "Este enlace ya no sirve.");
    } catch {
      setError("No pudimos conectar. Inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  }
  return (
    <Stack spacing={3} sx={{ maxWidth: 480, mx: "auto", p: 3, my: 4 }}>
      <Typography variant="h1" sx={{ fontSize: 28 }}>
        {rol
          ? "Tu correo quedó confirmado"
          : token
            ? "Confirma tu correo"
            : "Este enlace ya no sirve"}
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {rol ? (
        <Button
          component="a"
          variant="contained"
          href={rol === "empresa" ? "/empresa/perfil" : "/estudiante/perfil"}
        >
          {rol === "empresa" ? "Ir al perfil de la empresa" : "Ir a mi perfil"}
        </Button>
      ) : token ? (
        <>
          <Typography>
            Pulsa el botón para confirmar tu dirección de correo en Praxis.
          </Typography>
          <Button variant="contained" disabled={enviando} onClick={confirmar}>
            {enviando ? "Confirmando…" : "Confirmar mi correo"}
          </Button>
        </>
      ) : (
        <Button href="/ingresar?next=/revisa-tu-correo">
          Inicia sesión para pedir otro
        </Button>
      )}
    </Stack>
  );
}
