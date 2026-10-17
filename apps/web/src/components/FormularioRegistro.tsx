"use client";

import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { registroEmpresaSchema, registroEstudianteSchema } from "@praxis/contracts";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import CampoContrasena from "./CampoContrasena";

type Tipo = "estudiante" | "empresa";
type Errores = Record<string, string>;

const VACIO = { nombreCompleto: "", razonSocial: "", nit: "", correo: "", contrasena: "", confirmarContrasena: "" };

/** Primer mensaje de cada campo, para mostrarlo junto a él. */
function porCampo(issues: { path: PropertyKey[]; message: string }[]): Errores {
  const e: Errores = {};
  for (const i of issues) e[String(i.path[0] ?? "_")] ??= i.message;
  return e;
}

export default function FormularioRegistro({ tipo }: { tipo: Tipo }) {
  const router = useRouter();
  const resumen = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(VACIO);
  const [autoriza, setAutoriza] = useState(false);
  const [errores, setErrores] = useState<Errores>({});
  const [general, setGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const datos = () =>
    tipo === "estudiante"
      ? { nombreCompleto: v.nombreCompleto, correo: v.correo, contrasena: v.contrasena, confirmarContrasena: v.confirmarContrasena, autorizaDatos: autoriza }
      : { razonSocial: v.razonSocial, nit: v.nit, correo: v.correo, contrasena: v.contrasena, confirmarContrasena: v.confirmarContrasena, autorizaDatos: autoriza };

  function mostrar(e: Errores, mensaje: string | null = null) {
    setErrores(e);
    setGeneral(mensaje);
    // El resumen recibe el foco para que lectores de pantalla y teclado lleguen a los errores.
    requestAnimationFrame(() => resumen.current?.focus());
  }

  async function enviar(ev: React.FormEvent) {
    ev.preventDefault();
    const r = (tipo === "estudiante" ? registroEstudianteSchema : registroEmpresaSchema).safeParse(datos());
    if (!r.success) return mostrar(porCampo(r.error.issues));
    setEnviando(true);
    const res = await fetch(`/api/auth/registro/${tipo}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos()),
    }).catch(() => null);
    setEnviando(false);
    if (res?.status === 201) {
      router.push("/revisa-tu-correo");
      router.refresh();
      return;
    }
    const cuerpo = res ? await res.json().catch(() => ({})) : {};
    if (cuerpo.errores) return mostrar(cuerpo.errores);
    mostrar({}, cuerpo.mensaje ?? "No pudimos crear la cuenta. Revisa tu conexión e inténtalo de nuevo.");
  }

  const campo = (name: keyof typeof VACIO, label: string, extra: Record<string, unknown> = {}) => ({
    id: name,
    name,
    label,
    value: v[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [name]: e.target.value }),
    error: !!errores[name],
    helperText: errores[name] ?? (extra.ayuda as string | undefined),
    fullWidth: true,
    required: true,
    slotProps: { inputLabel: { required: false } },
    autoComplete: extra.autoComplete as string | undefined,
  });

  const n = Object.keys(errores).length;

  return (
    <Stack component="form" noValidate onSubmit={enviar} spacing={2.5}>
      <div ref={resumen} tabIndex={-1} style={{ outline: "none" }}>
        {(n > 0 || general) && (
          <Alert severity="error">
            <AlertTitle>{general ? "No pudimos crear la cuenta" : n === 1 ? "Revisa 1 campo" : `Revisa ${n} campos`}</AlertTitle>
            {general ?? "Corrige lo marcado en rojo para crear la cuenta."}
          </Alert>
        )}
      </div>
      {tipo === "estudiante" ? (
        <TextField {...campo("nombreCompleto", "Nombre completo", { autoComplete: "name" })} />
      ) : (
        <>
          <TextField {...campo("razonSocial", "Razón social", { autoComplete: "organization" })} />
          <TextField
            {...campo("nit", "NIT con dígito de verificación", {
              ayuda: "Escríbelo como aparece en tu RUT, con el dígito de verificación.",
            })}
          />
        </>
      )}
      <TextField {...campo("correo", "Correo", { autoComplete: "email" })} type="email" />
      <CampoContrasena {...campo("contrasena", "Contraseña", { ayuda: "Al menos 10 caracteres.", autoComplete: "new-password" })} />
      <CampoContrasena {...campo("confirmarContrasena", "Confirmar contraseña", { autoComplete: "new-password" })} />
      <div>
        <FormControlLabel
          sx={{ alignItems: "flex-start", mr: 0 }}
          control={
            <Checkbox
              checked={autoriza}
              onChange={(e) => setAutoriza(e.target.checked)}
              slotProps={{ input: { "aria-describedby": errores.autorizaDatos ? "autoriza-error" : undefined } }}
              sx={{ mt: -0.75 }}
            />
          }
          label={<Typography variant="body2">Autorizo el tratamiento de mis datos personales.</Typography>}
        />
        <Link href="/politica-de-datos" target="_blank" variant="body2" sx={{ display: "inline-block", ml: 4, py: 1, fontWeight: 600 }}>
          Leer la política de tratamiento de datos<span className="sr-only"> (se abre en otra pestaña)</span>
        </Link>
        {errores.autorizaDatos && (
          <FormHelperText id="autoriza-error" error sx={{ ml: 4 }}>
            {errores.autorizaDatos}
          </FormHelperText>
        )}
      </div>
      <Button type="submit" variant="contained" size="large" fullWidth disabled={enviando}>
        {enviando ? "Creando cuenta…" : "Crear cuenta"}
      </Button>
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
        ¿Ya tienes cuenta?{" "}
        <Link href="/ingresar" sx={{ fontWeight: 600, display: "inline-block", py: 1.5 }}>
          Inicia sesión
        </Link>
      </Typography>
    </Stack>
  );
}
