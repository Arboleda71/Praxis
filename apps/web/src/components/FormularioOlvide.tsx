"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { olvideContrasenaSchema } from "@praxis/contracts";
import { useEffect, useRef, useState } from "react";

/** Pide el enlace para restablecer la contraseña (spec 012). La respuesta no dice si el correo existe. */
export default function FormularioOlvide() {
  const titulo = useRef<HTMLHeadingElement>(null);
  const alerta = useRef<HTMLDivElement>(null);
  const [correo, setCorreo] = useState("");
  const [errorCorreo, setErrorCorreo] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  // El formulario desaparece al enviar: el foco pasa al título, que dice el resultado (WCAG 2.4.3).
  useEffect(() => {
    if (enviado) titulo.current?.focus();
  }, [enviado]);

  async function enviar(ev: React.FormEvent) {
    ev.preventDefault();
    const r = olvideContrasenaSchema.safeParse({ correo });
    if (!r.success) return setErrorCorreo(r.error.issues[0].message);
    setErrorCorreo("");
    setError("");
    setEnviando(true);
    const res = await fetch("/api/auth/olvide-contrasena", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(r.data),
    }).catch(() => null);
    setEnviando(false);
    if (res?.status === 204) return setEnviado(true);
    const cuerpo = res?.status === 429 ? await res.json().catch(() => ({})) : {};
    setError(
      cuerpo.mensaje ??
        (res?.status === 429
          ? "Demasiados intentos. Espera unos minutos e inténtalo de nuevo."
          : "No pudimos conectar. Inténtalo de nuevo."),
    );
    requestAnimationFrame(() => alerta.current?.focus());
  }

  const encabezado = (texto: string) => (
    <Typography
      variant="h1"
      ref={titulo}
      tabIndex={-1}
      sx={{ fontSize: { xs: 24, md: 28 }, outline: "none" }}
    >
      {texto}
    </Typography>
  );
  const volver = (
    <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
      <Link href="/ingresar" sx={{ fontWeight: 600, display: "inline-block", py: 1.5 }}>
        Volver a iniciar sesión
      </Link>
    </Typography>
  );

  if (enviado)
    return (
      <>
        {encabezado("Revisa tu correo")}
        <Typography>
          Si el correo está registrado, te enviamos un enlace para cambiar tu contraseña. Vence en 30 minutos y
          sirve una sola vez.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          ¿No te llegó? Revisa la carpeta de spam. Puedes pedir otro enlace en un minuto.
        </Typography>
        {volver}
      </>
    );

  return (
    <Stack component="form" noValidate onSubmit={enviar} spacing={2.5}>
      {encabezado("¿Olvidaste tu contraseña?")}
      <Typography color="text.secondary">
        Escribe el correo de tu cuenta y te enviaremos un enlace para crear una contraseña nueva.
      </Typography>
      <div ref={alerta} tabIndex={-1} style={{ outline: "none" }}>
        {error && <Alert severity="error">{error}</Alert>}
      </div>
      <TextField
        id="correo"
        name="correo"
        label="Correo"
        type="email"
        autoComplete="email"
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
        error={!!errorCorreo}
        helperText={errorCorreo}
        fullWidth
      />
      <Button type="submit" variant="contained" size="large" fullWidth disabled={enviando}>
        {enviando ? "Enviando…" : "Enviar enlace"}
      </Button>
      {volver}
    </Stack>
  );
}
