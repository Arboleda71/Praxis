"use client";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useRef, useState } from "react";

export default function ConfirmacionCorreo({ token }: { token?: string }) {
  const [rol, setRol] = useState<string | null>(null);
  const [vencido, setVencido] = useState(!token);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const titulo = useRef<HTMLHeadingElement>(null);
  const pulsado = useRef(false);
  // El botón pulsado desaparece al confirmar o al saber que el enlace venció: el foco pasa al título, que
  // dice el resultado, en lugar de perderse (WCAG 2.4.3 y 4.1.3).
  useEffect(() => {
    if (pulsado.current) titulo.current?.focus();
  }, [rol, vencido]);
  async function confirmar() {
    pulsado.current = true;
    setEnviando(true);
    setError("");
    // Tres resultados (spec 011): confirmado, enlace que ya no sirve (400/410) o fallo de conexión. Solo
    // el segundo manda a pedir otro enlace; con el tercero el mismo enlace sigue sirviendo.
    try {
      const res = await fetch("/api/auth/confirmar-correo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (res.ok) setRol((await res.json()).rol);
      else if (res.status === 400 || res.status === 410) setVencido(true);
      else setError("No pudimos conectar. Inténtalo de nuevo.");
    } catch {
      setError("No pudimos conectar. Inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  }
  return (
    <Stack spacing={3} sx={{ maxWidth: 480, mx: "auto", p: 3, my: 4 }}>
      <Typography
        variant="h1"
        ref={titulo}
        tabIndex={-1}
        sx={{ fontSize: 28, outline: "none" }}
      >
        {rol
          ? "Tu correo quedó confirmado"
          : vencido
            ? "Este enlace ya no sirve"
            : "Confirma tu correo"}
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
      ) : vencido ? (
        <Button href="/ingresar?next=/revisa-tu-correo">
          Inicia sesión para pedir otro
        </Button>
      ) : (
        <>
          <Typography>
            Pulsa el botón para confirmar tu dirección de correo en Praxis.
          </Typography>
          <Button variant="contained" disabled={enviando} onClick={confirmar}>
            {enviando ? "Confirmando…" : "Confirmar mi correo"}
          </Button>
        </>
      )}
    </Stack>
  );
}
