"use client";

import AddAPhotoRounded from "@mui/icons-material/AddAPhotoRounded";
import PhotoCameraRounded from "@mui/icons-material/PhotoCameraRounded";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { errorArchivo, formatoDeMime } from "@praxis/contracts";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { quitarArchivo, subirArchivo } from "@/lib/perfil-cliente";

type Props = { nombre: string; titulo: string; fotoUrl: string | null };

/** Nombre y foto opcional (constitución v3.0.0, VII). Sin foto, la inicial. */
export default function EncabezadoPerfil({ nombre, titulo, fotoUrl }: Props) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function elegida(e: React.ChangeEvent<HTMLInputElement>) {
    const foto = e.target.files?.[0];
    e.target.value = "";
    if (!foto) return;
    const previo = errorArchivo("foto", { formato: formatoDeMime(foto.type), bytes: foto.size });
    if (previo) return setError(previo);
    setError(null);
    setPct(0);
    const r = await subirArchivo("foto", foto, setPct).promesa;
    setPct(null);
    if (r !== "cancelada" && !r.ok) return setError(r.errores.archivo ?? r.mensaje ?? null);
    router.refresh();
  }

  async function quitar() {
    const r = await quitarArchivo("foto");
    if (!r.ok) return setError(r.mensaje ?? null);
    router.refresh();
  }

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={{ xs: 2, md: 3 }} sx={{ alignItems: "center" }}>
        <Avatar
          src={fotoUrl ?? undefined}
          alt={fotoUrl ? `Foto de perfil de ${nombre}` : undefined}
          sx={{ width: { xs: 72, md: 96 }, height: { xs: 72, md: 96 }, bgcolor: "primary.main", fontSize: { xs: 30, md: 40 } }}
        >
          <span aria-hidden>{nombre.trim()[0]?.toUpperCase()}</span>
        </Avatar>
        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
          <Typography variant="h1" sx={{ fontSize: { xs: 22, md: 32 } }}>
            {titulo}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            <input ref={input} type="file" hidden accept="image/jpeg,image/png" onChange={elegida} />
            <Button
              onClick={() => input.current?.click()}
              startIcon={fotoUrl ? <PhotoCameraRounded /> : <AddAPhotoRounded />}
              disabled={pct !== null}
              sx={{ ml: -1 }}
            >
              {fotoUrl ? "Cambiar foto" : "Agregar foto (opcional)"}
            </Button>
            {fotoUrl && (
              <Button onClick={quitar} color="inherit" disabled={pct !== null}>
                Quitar foto
              </Button>
            )}
          </Stack>
          <Typography variant="caption" color="text.secondary">
            Opcional. La ven solo las empresas a cuyas vacantes te postules. JPG o PNG, máximo 2 MB.
          </Typography>
        </Stack>
      </Stack>
      {pct !== null && <LinearProgress variant="determinate" value={pct} aria-label="Progreso de la subida de la foto" />}
      <div role="status" aria-live="polite">
        {error && <Alert severity="error">{error}</Alert>}
      </div>
    </Stack>
  );
}
