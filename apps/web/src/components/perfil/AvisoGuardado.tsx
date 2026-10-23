"use client";

import Snackbar from "@mui/material/Snackbar";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const MENSAJES: Record<string, string> = {
  formacion: "Guardamos tu formación.",
  disponibilidad: "Guardamos tu disponibilidad e idiomas.",
  aval: "Guardamos tu aval.",
};

/** Confirma lo guardado al volver al perfil (`?guardado=seccion`). */
export default function AvisoGuardado() {
  const params = useSearchParams();
  const router = useRouter();
  const ruta = usePathname();
  const mensaje = MENSAJES[params.get("guardado") ?? ""];
  return (
    <Snackbar
      open={!!mensaje}
      message={mensaje}
      autoHideDuration={5000}
      onClose={() => router.replace(ruta, { scroll: false })}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      sx={{ bottom: { xs: 72, md: 24 } }}
    />
  );
}
