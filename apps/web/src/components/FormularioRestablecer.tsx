"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { restablecerContrasenaSchema } from "@praxis/contracts";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import CampoContrasena from "./CampoContrasena";

type Errores = Record<string, string>;

/** Escribe la contraseña nueva desde el enlace del correo (spec 012). Sin `token`, el enlace ya no sirve. */
export default function FormularioRestablecer({ token }: { token?: string }) {
  const router = useRouter();
  const titulo = useRef<HTMLHeadingElement>(null);
  const alerta = useRef<HTMLDivElement>(null);
  const enviado = useRef(false);
  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [errores, setErrores] = useState<Errores>({});
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [hecho, setHecho] = useState(false);
  const [vencido, setVencido] = useState(!token);
  // El formulario desaparece al terminar: el foco pasa al título, que dice el resultado (WCAG 2.4.3).
  useEffect(() => {
    if (enviado.current) titulo.current?.focus();
  }, [hecho, vencido]);

  function mostrar(e: Errores, general = "") {
    setErrores(e);
    setError(general);
    requestAnimationFrame(() => alerta.current?.focus());
  }

  async function enviar(ev: React.FormEvent) {
    ev.preventDefault();
    const r = restablecerContrasenaSchema.safeParse({ token, contrasena, confirmarContrasena: confirmar });
    if (!r.success) {
      const e: Errores = {};
      for (const i of r.error.issues) e[String(i.path[0])] ??= i.message;
      // Un token mal formado no es un error de campo: el enlace no sirve.
      if (e.token) return setVencido(true);
      return mostrar(e);
    }
    setErrores({});
    setError("");
    setEnviando(true);
    enviado.current = true;
    const res = await fetch("/api/auth/restablecer-contrasena", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(r.data),
    }).catch(() => null);
    setEnviando(false);
    if (res?.status === 204) {
      setHecho(true);
      // Se cerraron todas las sesiones, también la de este navegador si la había: la cabecera se actualiza.
      router.refresh();
    } else if (res?.status === 410) setVencido(true);
    else if (res?.status === 400) {
      const { errores: e = {} } = await res.json().catch(() => ({}));
      if (e.token || !Object.keys(e).length) setVencido(true);
      else mostrar(e);
    } else mostrar({}, "No pudimos conectar. Inténtalo de nuevo.");
  }

  const n = Object.keys(errores).length;
  return (
    <>
      <Typography
        variant="h1"
        ref={titulo}
        tabIndex={-1}
        sx={{ fontSize: { xs: 24, md: 28 }, outline: "none" }}
      >
        {hecho ? "Tu contraseña quedó cambiada" : vencido ? "Este enlace ya no sirve" : "Escribe tu contraseña nueva"}
      </Typography>
      {hecho ? (
        <>
          <Typography>Por seguridad cerramos todas tus sesiones. Entra con la contraseña nueva.</Typography>
          <Button variant="contained" size="large" href="/ingresar">
            Iniciar sesión
          </Button>
        </>
      ) : vencido ? (
        <>
          <Typography>
            Los enlaces para cambiar la contraseña vencen en 30 minutos y sirven una sola vez. Tu contraseña no
            cambió.
          </Typography>
          <Button variant="contained" size="large" href="/olvide-contrasena">
            Pedir otro enlace
          </Button>
        </>
      ) : (
        <Stack component="form" noValidate onSubmit={enviar} spacing={2.5}>
          <div ref={alerta} tabIndex={-1} style={{ outline: "none" }}>
            {(n > 0 || error) && (
              <Alert severity="error">
                {error || (n === 1 ? "Revisa 1 campo marcado en rojo." : `Revisa ${n} campos marcados en rojo.`)}
              </Alert>
            )}
          </div>
          <CampoContrasena
            id="contrasena"
            name="contrasena"
            label="Contraseña nueva"
            autoComplete="new-password"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            error={!!errores.contrasena}
            helperText={errores.contrasena ?? "Al menos 10 caracteres."}
            fullWidth
          />
          <CampoContrasena
            id="confirmarContrasena"
            name="confirmarContrasena"
            label="Confirmar contraseña nueva"
            autoComplete="new-password"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            error={!!errores.confirmarContrasena}
            helperText={errores.confirmarContrasena}
            fullWidth
          />
          <Button type="submit" variant="contained" size="large" fullWidth disabled={enviando}>
            {enviando ? "Guardando…" : "Cambiar contraseña"}
          </Button>
        </Stack>
      )}
    </>
  );
}
