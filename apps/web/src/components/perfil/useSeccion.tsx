"use client";

import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { guardarSeccion, type Errores } from "@/lib/perfil-cliente";

type Seccion = "formacion" | "disponibilidad" | "aval";
type Esquema = { safeParse(v: unknown): { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } } };

/** Validar con el esquema de contracts, guardar y volver al perfil; errores por campo con resumen enfocado (X). */
export function useSeccion(seccion: Seccion, esquema: Esquema) {
  const router = useRouter();
  const resumen = useRef<HTMLDivElement>(null);
  const [errores, setErrores] = useState<Errores>({});
  const [general, setGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function mostrar(e: Errores, mensaje: string | null = null) {
    setErrores(e);
    setGeneral(mensaje);
    requestAnimationFrame(() => resumen.current?.focus());
  }

  async function guardar(datos: unknown) {
    const r = esquema.safeParse(datos);
    if (!r.success) {
      const e: Errores = {};
      for (const i of r.error!.issues) e[i.path.join(".") || "_"] ??= i.message;
      return mostrar(e);
    }
    setEnviando(true);
    const res = await guardarSeccion(seccion, datos);
    if (!res.ok) {
      setEnviando(false);
      return mostrar(res.errores, res.mensaje ?? null);
    }
    router.push(`/estudiante/perfil?guardado=${seccion}`);
    router.refresh();
  }

  const n = Object.keys(errores).length;
  const Resumen = (
    <div ref={resumen} tabIndex={-1} style={{ outline: "none" }}>
      {(n > 0 || general) && (
        <Alert severity="error">
          <AlertTitle>{general ? "No se guardó" : n === 1 ? "No se guardó. Revisa el campo marcado." : `No se guardó. Revisa los ${n} campos marcados.`}</AlertTitle>
          {general}
        </Alert>
      )}
    </div>
  );

  const Acciones = (
    <Stack direction={{ xs: "column", md: "row-reverse" }} spacing={1} sx={{ justifyContent: { md: "flex-start" } }}>
      <Button type="submit" variant="contained" disabled={enviando} sx={{ minWidth: { md: 120 } }}>
        {enviando ? "Guardando…" : "Guardar"}
      </Button>
      <Button href="/estudiante/perfil">Cancelar</Button>
    </Stack>
  );

  /** Props comunes de un campo: error y ayuda en `helperText`. */
  const campo = (nombre: string, ayuda?: string) => ({
    id: nombre,
    error: !!errores[nombre],
    helperText: errores[nombre] ?? ayuda,
    fullWidth: true,
  });

  return { errores, guardar, enviando, Resumen, Acciones, campo };
}
