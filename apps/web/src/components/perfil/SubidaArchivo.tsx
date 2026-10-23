"use client";

import PictureAsPdfRounded from "@mui/icons-material/PictureAsPdfRounded";
import UploadFileRounded from "@mui/icons-material/UploadFileRounded";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { LIMITES_ARCHIVO, errorArchivo, formatoDeMime, type TipoArchivo } from "@praxis/contracts";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import type { ArchivoMeta } from "@/lib/perfil";
import { fechaCorta, subirArchivo, tamano, verArchivo } from "@/lib/perfil-cliente";

type Estado =
  | { fase: "quieto" }
  | { fase: "subiendo"; nombre: string; bytes: number; pct: number; cancelar: () => void }
  | { fase: "rechazado"; nombre: string; mensaje: string }
  | { fase: "subido" };

const ACCEPT = { pdf: "application/pdf", jpg: "image/jpeg", png: "image/png" };

/** Elegir, subir con progreso, ver y reemplazar un PDF del perfil (hoja de vida o soporte del aval). */
export default function SubidaArchivo({ tipo, actual, etiqueta }: { tipo: TipoArchivo; actual: ArchivoMeta | null; etiqueta: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const [estado, setEstado] = useState<Estado>({ fase: "quieto" });
  const limite = LIMITES_ARCHIVO[tipo];

  async function elegido(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    // Aviso inmediato; la API vuelve a comprobar por contenido.
    const previo = errorArchivo(tipo, { formato: formatoDeMime(archivo.type), bytes: archivo.size });
    if (previo) return setEstado({ fase: "rechazado", nombre: archivo.name, mensaje: previo });
    const { promesa, cancelar } = subirArchivo(tipo, archivo, (pct) => setEstado((s) => (s.fase === "subiendo" ? { ...s, pct } : s)));
    setEstado({ fase: "subiendo", nombre: archivo.name, bytes: archivo.size, pct: 0, cancelar });
    const r = await promesa;
    if (r === "cancelada") return setEstado({ fase: "quieto" });
    if (!r.ok) return setEstado({ fase: "rechazado", nombre: archivo.name, mensaje: r.errores.archivo ?? r.mensaje ?? "" });
    setEstado({ fase: "subido" });
    router.refresh();
  }

  const elegir = (texto: string, variant: "contained" | "outlined" | "text") => (
    <Button variant={variant} onClick={() => input.current?.click()} startIcon={variant === "contained" ? <UploadFileRounded /> : undefined}>
      {texto}
      <span className="sr-only"> ({etiqueta})</span>
    </Button>
  );

  return (
    <Stack spacing={2}>
      <input
        ref={input}
        type="file"
        hidden
        accept={limite.formatos.map((f) => ACCEPT[f]).join(",")}
        onChange={elegido}
        aria-describedby={`${id}-reglas`}
      />

      <div role="status" aria-live="polite">
        {estado.fase === "rechazado" && (
          <Alert severity="error">
            <AlertTitle>No subimos «{estado.nombre}»</AlertTitle>
            {estado.mensaje}
          </Alert>
        )}
        {estado.fase === "subido" && actual && (
          <Alert severity="success">
            <AlertTitle>{etiqueta[0].toUpperCase() + etiqueta.slice(1)} subida</AlertTitle>
            Ya está en tu perfil.
          </Alert>
        )}
      </div>

      {estado.fase === "subiendo" ? (
        <Stack spacing={1.5} sx={{ p: 1.5, border: 1, borderColor: "grey.300", borderRadius: 2 }}>
          <Typography sx={{ fontWeight: 600, overflowWrap: "anywhere" }}>{estado.nombre}</Typography>
          <Typography variant="caption" color="text.secondary">
            Subiendo… {estado.pct} % de {tamano(estado.bytes)}
          </Typography>
          <LinearProgress variant="determinate" value={estado.pct} aria-label={`Progreso de la subida de ${estado.nombre}`} />
          <Button onClick={estado.cancelar} sx={{ alignSelf: "flex-start" }}>
            Cancelar subida
          </Button>
        </Stack>
      ) : actual ? (
        <>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", p: 1.5, border: 1, borderColor: "grey.300", borderRadius: 2 }}>
            <PictureAsPdfRounded aria-hidden sx={{ color: "error.main", fontSize: 32 }} />
            <div>
              <Typography sx={{ fontWeight: 600, overflowWrap: "anywhere" }}>{actual.nombre}</Typography>
              <Typography variant="caption" color="text.secondary">
                PDF · {tamano(actual.bytes)} · subido el {fechaCorta(actual.subidoEn)}
              </Typography>
            </div>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => verArchivo(tipo)}>
              Ver<span className="sr-only"> {etiqueta} (se abre en otra pestaña)</span>
            </Button>
            {elegir("Reemplazar", "text")}
          </Stack>
        </>
      ) : (
        <Box sx={{ p: 2.5, border: 1, borderColor: "divider", borderRadius: 2, bgcolor: "background.default", textAlign: "center" }}>
          <Stack spacing={1.25} sx={{ alignItems: "center" }}>
            <UploadFileRounded aria-hidden color="primary" sx={{ fontSize: 32 }} />
            <Typography id={`${id}-reglas`} color="text.secondary">
              PDF de máximo {limite.maxBytes / (1024 * 1024)} MB
            </Typography>
            {elegir("Elegir archivo", "contained")}
          </Stack>
        </Box>
      )}
    </Stack>
  );
}
