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
  const boton = useRef<HTMLButtonElement>(null);
  const moverFoco = useRef(false);
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState<Aviso>(null);
  const [enviando, setEnviando] = useState(false);
  // Fin del bloqueo según el tiempo restante que informa la API (spec 011), no 15 minutos fijos.
  const [hasta, setHasta] = useState<number | null>(null);
  const [reactivado, setReactivado] = useState(false);
  useEffect(() => {
    if (hasta === null) return;
    // Se compara con la hora cada segundo: un temporizador largo se atrasa si la pestaña duerme.
    const reloj = setInterval(() => {
      if (Date.now() < hasta) return;
      // El foco estaba en el aviso, que va a desaparecer: pasa al botón cuando vuelva a funcionar (WCAG 2.4.3).
      moverFoco.current = !!alerta.current?.contains(document.activeElement);
      setHasta(null);
      setAviso(null);
      setReactivado(true);
    }, 1000);
    return () => clearInterval(reloj);
  }, [hasta]);
  useEffect(() => {
    if (reactivado && moverFoco.current) boton.current?.focus();
    moverFoco.current = false;
  }, [reactivado]);

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
    setReactivado(false);
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
      const cuerpo = await res.json().catch(() => ({}));
      // El bloqueo más largo de la API es una hora; un valor raro no deja el formulario apagado para siempre.
      const s = Number(cuerpo.segundos);
      const segundos = s > 0 ? Math.min(s, 3600) : 900;
      const fin = Date.now() + segundos * 1000;
      const minutos = Math.ceil(segundos / 60);
      const hora = new Date(fin).toLocaleTimeString("es-CO", {
        hour: "numeric",
        minute: "2-digit",
      });
      setHasta(fin);
      avisar({
        titulo: "Demasiados intentos",
        texto: `Por seguridad, espera ${minutos} ${minutos === 1 ? "minuto" : "minutos"} e inténtalo de nuevo. El formulario se activará solo a las ${hora}.`,
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
      <div role="status">
        {reactivado && (
          <Typography variant="body2">Ya puedes intentarlo de nuevo.</Typography>
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
        ref={boton}
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
