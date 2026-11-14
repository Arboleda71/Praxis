"use client";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { useCarga } from "@/lib/carga";
import { solicitar } from "@/lib/mercado";
export default function LogoEmpresa() {
  const { datos, recargar } = useCarga<{ logoUrl: string | null; logoNombre: string | null }>("/empresa/perfil");
  const [archivo, setArchivo] = useState<File | null>(null), [ocupado, setOcupado] = useState(false), [error, setError] = useState(""), [mensaje, setMensaje] = useState("");
  async function guardar() {
    if (!archivo) return;
    setOcupado(true); setError(""); setMensaje("");
    try {
      const body = new FormData(); body.append("archivo", archivo);
      const r = await fetch("/api/empresa/logo", { method: "PUT", body });
      if (!r.ok) { const d = await r.json(); throw new Error(d.mensaje ?? "Elige un JPG o PNG de máximo 2 MB."); }
      recargar(); setArchivo(null); setMensaje("Logo guardado.");
    } catch (e) { setError((e as Error).message); } finally { setOcupado(false); }
  }
  async function quitar() {
    setOcupado(true); setError("");
    try { await solicitar("/empresa/logo", "DELETE"); recargar(); setMensaje("Logo eliminado."); }
    catch (e) { setError((e as Error).message); } finally { setOcupado(false); }
  }
  return <Stack spacing={2} component="section" aria-labelledby="logo-empresa">
    <Typography id="logo-empresa" variant="h2" sx={{ fontSize: 22 }}>Logo de la empresa (opcional)</Typography>
    {datos?.logoUrl && <Box component="img" src={datos.logoUrl} alt="Logo actual de la empresa" sx={{ width: 96, height: 96, objectFit: "contain" }} />}
    <Typography component="label" htmlFor="logo-archivo">Elige una imagen JPG o PNG de máximo 2 MB.</Typography>
    <input id="logo-archivo" type="file" accept="image/png,image/jpeg" disabled={ocupado} onChange={e => setArchivo(e.target.files?.[0] ?? null)} />
    {error && <Alert severity="error">{error}</Alert>}
    <Stack direction="row" spacing={2}><Button variant="outlined" disabled={!archivo || ocupado} onClick={guardar}>{ocupado ? "Procesando…" : "Guardar logo"}</Button>{datos?.logoUrl && <Button color="error" disabled={ocupado} onClick={quitar}>Quitar logo</Button>}</Stack>
    <Typography role="status">{mensaje}</Typography>
  </Stack>;
}
