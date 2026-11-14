"use client";
import { Alert, Button, Paper, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { errorArchivo, tipoPorContenido } from "@praxis/contracts";
import { useCarga } from "@/lib/carga";
import { AvisoError } from "./mercado-ui";
type Datos = { estado: string; cvReemplazadoEn: string | null; vacante: { titulo: string; empresa: { razonSocial: string } }; archivos: { tipo: string; nombre: string; bytes: number }[] };
export default function CambiarCv({ id }: { id: string }) {
  const router = useRouter();
  const { datos: p, error: cargaError, recargar } = useCarga<Datos>(`/postulaciones/${id}`);
  const [archivo, setArchivo] = useState<File | null>(null), [error, setError] = useState(""), [ocupado, setOcupado] = useState(false), [progreso, setProgreso] = useState(0);
  async function enviar() {
    if (!archivo) { setError("Elige un PDF de máximo 5 MB."); return; }
    const formato = tipoPorContenido(new Uint8Array(await archivo.slice(0, 8).arrayBuffer()));
    const fallo = errorArchivo("hoja-de-vida", { formato, bytes: archivo.size });
    if (fallo) { setError(fallo); return; }
    setOcupado(true); setError(""); setProgreso(0);
    const datos = new FormData(); datos.append("archivo", archivo);
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", `/api/postulaciones/${id}/cv`); xhr.timeout = 60000;
    xhr.upload.onprogress = e => { if (e.lengthComputable) setProgreso(Math.round(e.loaded * 100 / e.total)); };
    const fallar = (mensaje: string) => { setError(mensaje); setOcupado(false); };
    xhr.onerror = () => fallar("No pudimos subir el archivo. Inténtalo de nuevo.");
    xhr.ontimeout = () => fallar("La subida tardó demasiado. Inténtalo de nuevo.");
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) { router.push("/estudiante/postulaciones?cv=actualizado"); router.refresh(); }
      else {
        let mensaje = "No se pudo cambiar el CV. Actualiza para comprobar el estado de tu postulación.";
        try { mensaje = JSON.parse(xhr.responseText).mensaje ?? mensaje; } catch { /* Respuesta no JSON. */ }
        fallar(mensaje); recargar();
      }
    };
    xhr.send(datos);
  }
  const actual = p?.archivos.find(a => a.tipo === "HOJA_DE_VIDA");
  return <Stack spacing={3} sx={{ maxWidth: 720, mx: "auto", p: 2, py: 4 }}>
    <Button href="/estudiante/postulaciones">Volver a mis postulaciones</Button>
    <Typography variant="h1" sx={{ fontSize: 28 }}>Cambiar el CV de esta postulación</Typography>
    {cargaError && <AvisoError mensaje={cargaError} reintentar={recargar} />}
    {!p && !cargaError && <Typography role="status">Cargando postulación…</Typography>}
    {p && <><Typography>{p.vacante.titulo} · {p.vacante.empresa.razonSocial}</Typography>
      {p.estado !== "Enviada" ? <Alert severity="warning">La postulación está {p.estado}. El CV enviado ya no se puede cambiar.</Alert> : <>
        <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="h2" sx={{ fontSize: 22 }}>CV enviado</Typography><Typography>{actual?.nombre} · {actual ? Math.ceil(actual.bytes / 1024) : 0} KB</Typography></Paper>
        <Alert severity="info">Solo cambia la copia de esta postulación. El CV de tu perfil permanece igual. El cambio queda en el historial y se avisa a la empresa. Si empieza a revisarla durante la subida, conservaremos el CV anterior.</Alert>
        <Stack component="form" spacing={2} onSubmit={e => { e.preventDefault(); void enviar(); }}>
          <Typography component="label" htmlFor="cv-nuevo" sx={{ fontWeight: 600 }}>CV nuevo · PDF de máximo 5 MB</Typography>
          <input id="cv-nuevo" type="file" accept="application/pdf,.pdf" disabled={ocupado} onChange={e => { setArchivo(e.target.files?.[0] ?? null); setError(""); }} />
          {archivo && <Typography>Listo para enviar: {archivo.name} · {Math.ceil(archivo.size / 1024)} KB</Typography>}
          {error && <Alert severity="error">{error}</Alert>}<Typography role="status">{ocupado ? `Subiendo… ${progreso}%` : ""}</Typography>
          <Button type="submit" variant="contained" disabled={ocupado || !archivo}>Guardar nuevo CV</Button>
        </Stack>
      </>}
    </>}
  </Stack>;
}
