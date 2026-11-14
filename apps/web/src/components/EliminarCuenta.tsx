"use client";
import { Alert, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Paper, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { useRouter } from "next/navigation";
import CampoContrasena from "./CampoContrasena";
import { solicitar } from "@/lib/mercado";

export default function EliminarCuenta({ empresa }: { empresa: boolean }) {
  const router = useRouter();
  const [contrasena, setContrasena] = useState("");
  const [entiende, setEntiende] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  async function eliminar() {
    setOcupado(true); setError("");
    try {
      const r = await solicitar<{ archivosPendientes: boolean }>("/cuenta/supresion", "POST", { contrasena, entiende });
      router.replace(`/cuenta-eliminada${r.archivosPendientes ? "?pendientes=1" : ""}`); router.refresh();
    } catch (e) { setError((e as Error).message); setConfirmar(false); }
    finally { setOcupado(false); }
  }
  return <Stack spacing={3} sx={{ maxWidth: 720, mx: "auto", p: 2, py: 4 }}>
    <Button href={empresa ? "/empresa/perfil" : "/estudiante/perfil"}>Volver a mi perfil</Button>
    <Typography variant="h1" sx={{ fontSize: 28 }}>{empresa ? "Eliminar la cuenta de la empresa" : "Eliminar mi cuenta"}</Typography>
    <Typography>Puedes pedir que borremos tus datos personales cuando quieras. Esta acción no se puede deshacer.</Typography>
    <Paper variant="outlined" sx={{ p: 2, borderColor: "error.main" }}>
      <Typography variant="h2" sx={{ fontSize: 22 }}>Qué se borra</Typography>
      <Typography>{empresa ? "Los datos de contacto, la ficha y el logo de la empresa, sus borradores y todas sus sesiones." : "Tu nombre, correo, perfil, hoja de vida, aval y foto, incluidas las copias enviadas en tus postulaciones. Se cierran todas tus sesiones."}</Typography>
    </Paper>
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h2" sx={{ fontSize: 22 }}>Qué se conserva sin identificarte</Typography>
      <Typography>{empresa ? "Las vacantes publicadas y el historial de postulaciones. Las vacantes abiertas se cierran con motivo «cuenta eliminada» y se avisa a los candidatos. Se conserva una huella del NIT para impedir registros duplicados." : "El historial de estados y fechas. Tus postulaciones en curso pasan a Retirada y se avisa a cada empresa. Aparecerás como «Estudiante que eliminó su cuenta»."}</Typography>
    </Paper>
    {error && <Alert severity="error">{error}</Alert>}
    <Stack component="form" spacing={2} onSubmit={e => { e.preventDefault(); setConfirmar(true); }}>
      <CampoContrasena id="supresion-contrasena" label="Contraseña actual" autoComplete="current-password" required value={contrasena} onChange={e => setContrasena(e.target.value)} slotProps={{ htmlInput: { maxLength: 128 } }} />
      <FormControlLabel control={<Checkbox checked={entiende} onChange={e => setEntiende(e.target.checked)} required />} label="Entiendo que no se puede deshacer" />
      <Button type="submit" color="error" variant="contained" disabled={!entiende || !contrasena || ocupado}>Eliminar mi cuenta</Button>
    </Stack>
    <Dialog open={confirmar} onClose={() => !ocupado && setConfirmar(false)} aria-labelledby="confirmar-supresion">
      <DialogTitle id="confirmar-supresion">¿Eliminar tu cuenta definitivamente?</DialogTitle>
      <DialogContent>Anonimizaremos tu historial y eliminaremos tus datos y archivos. Si el almacenamiento no responde, la eliminación de archivos se reintentará hasta completarse.</DialogContent>
      <DialogActions><Button disabled={ocupado} onClick={() => setConfirmar(false)}>Cancelar</Button><Button color="error" variant="contained" disabled={ocupado} onClick={eliminar}>{ocupado ? "Eliminando…" : "Eliminar definitivamente"}</Button></DialogActions>
    </Dialog>
  </Stack>;
}
