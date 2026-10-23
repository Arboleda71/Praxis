"use client";

import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { loginSchema, type SesionPublica } from "@praxis/contracts";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { inicioDe, safeNext } from "@/lib/rutas";
import CampoContrasena from "./CampoContrasena";

type Aviso = { titulo: string; texto: string; bloqueado?: boolean } | null;

export default function FormularioIngreso({ next }: { next?: string }) {
  const router = useRouter();
  const alerta = useRef<HTMLDivElement>(null);
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState<Aviso>(null);
  const [enviando, setEnviando] = useState(false);
  useEffect(() => {
    if (!aviso?.bloqueado) return;
    const reloj = setTimeout(() => setAviso(null), 15 * 60_000);
    return () => clearTimeout(reloj);
  }, [aviso?.bloqueado]);

  function avisar(a: Aviso) {
    setAviso(a);
    requestAnimationFrame(() => alerta.current?.focus());
  }

  async function enviar(ev: React.FormEvent) {
    ev.preventDefault();
    const r = loginSchema.safeParse({ correo, contrasena });
    if (!r.success) {
      const e: Record<string, string> = {};
      for (const i of r.error.issues) e[String(i.path[0])] ??= i.message;
      return setErrores(e);
    }
    setErrores({});
    setEnviando(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(r.data),
    }).catch(() => null);
    setEnviando(false);
    if (res?.status === 200) {
      const { sesion } = (await res.json()) as { sesion: SesionPublica };
      router.push(safeNext(next) ?? inicioDe(sesion.rol));
      router.refresh();
    } else if (res?.status === 429) {
      avisar({
        titulo: "Demasiados intentos",
        texto: "Por seguridad, espera 15 minutos e inténtalo de nuevo.",
        bloqueado: true,
      });
    } else if (res?.status === 401) {
      avisar({
        titulo: "Correo o contraseña incorrectos",
        texto: "Revisa los datos e inténtalo de nuevo.",
      });
    } else {
      avisar({
        titulo: "No pudimos iniciar sesión",
        texto: "Revisa tu conexión e inténtalo de nuevo.",
      });
    }
  }

  return (
    <Stack component="form" noValidate onSubmit={enviar} spacing={2.5}>
      <div ref={alerta} tabIndex={-1} style={{ outline: "none" }}>
        {aviso && (
          <Alert severity="error">
            <AlertTitle>{aviso.titulo}</AlertTitle>
            {aviso.texto}
          </Alert>
        )}
      </div>
      <TextField
        id="correo"
        name="correo"
        label="Correo"
        type="email"
        autoComplete="email"
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
        error={!!errores.correo}
        helperText={errores.correo}
        fullWidth
      />
      <CampoContrasena
        id="contrasena"
        name="contrasena"
        label="Contraseña"
        autoComplete="current-password"
        value={contrasena}
        onChange={(e) => setContrasena(e.target.value)}
        error={!!errores.contrasena}
        helperText={errores.contrasena}
        fullWidth
      />
      <Button
        type="submit"
        variant="contained"
        size="large"
        fullWidth
        disabled={enviando || aviso?.bloqueado}
      >
        {enviando ? "Iniciando sesión…" : "Iniciar sesión"}
      </Button>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ textAlign: "center" }}
      >
        ¿No tienes cuenta?{" "}
        <Link
          href="/registro"
          sx={{ fontWeight: 600, display: "inline-block", py: 1.5 }}
        >
          Crear cuenta
        </Link>
      </Typography>
    </Stack>
  );
}
