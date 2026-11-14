"use client";
import { Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { TAMANO_PAGINA, accesoCuentaSchema } from "@praxis/contracts";
import { useCarga } from "@/lib/carga";
import { solicitar, type Lista } from "@/lib/mercado";
import { AvisoError, EstadoVacio } from "./mercado-ui";
import PeopleRounded from "@mui/icons-material/PeopleRounded";

type Cuenta = { id: string; correo: string; rol: string; creadaEn: string; correoConfirmadoEn: string | null; accesoRevocadoEn: string | null; eliminadaEn: string | null; empresa: { razonSocial: string; nit: string; dv: number } | null; cambiosAcceso?: { id: string; accion: string; motivo: string; fecha: string; responsable: { correo: string } }[] };
const fecha = (v: string) => new Date(v).toLocaleString("es-CO", { timeZone: "America/Bogota" });
const estado = (c: Cuenta) => c.eliminadaEn ? "Cuenta eliminada" : c.accesoRevocadoEn ? "Acceso revocado" : "Acceso activo";
export function CuentasAdmin() {
  const [rol, setRol] = useState("ESTUDIANTE"), [acceso, setAcceso] = useState("");
  const [q, setQ] = useState(""), [busqueda, setBusqueda] = useState(""), [pagina, setPagina] = useState(1);
  const params = new URLSearchParams({ rol, pagina: String(pagina), q: busqueda });
  if (acceso) params.set("acceso", acceso);
  const { datos, error, recargar } = useCarga<Lista<Cuenta>>(`/admin/cuentas?${params}`);
  return <Stack spacing={3} sx={{ maxWidth: 1080, mx: "auto", p: 2, py: 4 }}>
    <Typography variant="h1" sx={{ fontSize: 28 }}>Cuentas registradas</Typography>
    <Alert severity="info">Solo ves los datos de la cuenta y su acceso. No puedes consultar perfiles, CV, vacantes ni postulaciones.</Alert>
    <Stack direction={{ xs: "column", md: "row" }} spacing={2} component="form" onSubmit={e => { e.preventDefault(); setBusqueda(q); setPagina(1); }}>
      <TextField id="admin-rol" select label="Tipo de cuenta" value={rol} onChange={e => { setRol(e.target.value); setPagina(1); }}><MenuItem value="ESTUDIANTE">Estudiantes</MenuItem><MenuItem value="EMPRESA">Empresas</MenuItem></TextField>
      <TextField id="admin-acceso" select label="Estado de acceso" value={acceso} onChange={e => { setAcceso(e.target.value); setPagina(1); }}><MenuItem value="">Todos</MenuItem><MenuItem value="activo">Activo</MenuItem><MenuItem value="revocado">Revocado</MenuItem><MenuItem value="eliminado">Eliminado</MenuItem></TextField>
      <TextField id="admin-buscar" label="Buscar por correo, empresa o NIT" value={q} onChange={e => setQ(e.target.value)} />
      <Button type="submit" variant="contained">Buscar cuentas</Button>
    </Stack>
    {error && <AvisoError mensaje={error} reintentar={recargar} />}
    {!datos && !error && <Typography role="status">Cargando cuentas…</Typography>}
    {datos?.total === 0 && <EstadoVacio icono={<PeopleRounded />} mensaje="No hay cuentas que coincidan con la búsqueda." />}
    {datos?.items.map(c => <Paper component="article" variant="outlined" sx={{ p: 2 }} key={c.id}>
      <Stack spacing={1}><Typography variant="h2" sx={{ fontSize: 20, overflowWrap: "anywhere" }}>{c.empresa?.razonSocial ?? c.correo}</Typography>
      <Typography sx={{ overflowWrap: "anywhere" }}>{c.correo}</Typography><Typography>Registro: {fecha(c.creadaEn)}</Typography><Chip sx={{ alignSelf: "start" }} label={estado(c)} />
      <Button href={`/admin/cuentas/${c.id}`}>Ver cuenta</Button></Stack>
    </Paper>)}
    <Stack direction="row" spacing={2}><Button disabled={pagina === 1} onClick={() => setPagina(pagina - 1)}>Anterior</Button><Typography>Página {pagina}</Typography><Button disabled={!datos || pagina * TAMANO_PAGINA >= datos.total} onClick={() => setPagina(pagina + 1)}>Siguiente</Button></Stack>
  </Stack>;
}
export function DetalleCuentaAdmin({ id }: { id: string }) {
  const { datos: c, error, setError, setDatos, recargar } = useCarga<Cuenta>(`/admin/cuentas/${id}`);
  const [abrir, setAbrir] = useState(false), [motivo, setMotivo] = useState(""), [ocupado, setOcupado] = useState(false);
  const accion = c?.accesoRevocadoEn ? "restaurar" : "revocar";
  async function guardar() {
    const validado = accesoCuentaSchema.safeParse({ accion, motivo });
    if (!validado.success) { setError(validado.error.issues[0].message); return; }
    setOcupado(true);
    try { setDatos(await solicitar<Cuenta>(`/admin/cuentas/${id}/acceso`, "POST", validado.data)); setAbrir(false); setMotivo(""); setError(""); }
    catch (e) { setError((e as Error).message); } finally { setOcupado(false); }
  }
  return <Stack spacing={3} sx={{ maxWidth: 720, mx: "auto", p: 2, py: 4 }}>
    <Button href="/admin/cuentas">Volver a cuentas</Button><Typography variant="h1" sx={{ fontSize: 28 }}>Cuenta y control de acceso</Typography>
    {error && !abrir && <AvisoError mensaje={error} reintentar={recargar} />}
    {!c && !error && <Typography role="status">Cargando cuenta…</Typography>}
    {c && <><Paper variant="outlined" sx={{ p: 2 }}><Stack spacing={2}>
      <Typography variant="h2" sx={{ fontSize: 22, overflowWrap: "anywhere" }}>{c.empresa?.razonSocial ?? c.correo}</Typography><Typography sx={{ overflowWrap: "anywhere" }}>Correo: {c.correo} · {c.correoConfirmadoEn ? "confirmado" : "sin confirmar"}</Typography>
      <Typography>Rol: {c.rol === "EMPRESA" ? "Empresa" : "Estudiante"}</Typography><Typography>Registro: {fecha(c.creadaEn)}</Typography>
      {c.empresa && !c.eliminadaEn && <Typography>NIT: {c.empresa.nit}-{c.empresa.dv}</Typography>}<Chip label={estado(c)} sx={{ alignSelf: "start" }} />
      {!c.eliminadaEn && <Button color={accion === "revocar" ? "error" : "primary"} variant="contained" onClick={() => { setAbrir(true); setError(""); }}>{accion === "revocar" ? "Revocar acceso" : "Restaurar acceso"}</Button>}
    </Stack></Paper>
    <Typography variant="h2" sx={{ fontSize: 22 }}>Historial de acceso</Typography><Typography>Cuenta creada · {fecha(c.creadaEn)}</Typography>
    {c.cambiosAcceso?.map(h => <Paper key={h.id} variant="outlined" sx={{ p: 2, overflowWrap: "anywhere" }}><Typography>{h.accion === "revocar" ? "Acceso revocado" : "Acceso restaurado"} · {fecha(h.fecha)}</Typography><Typography>Responsable: {h.responsable.correo}</Typography><Typography>Motivo: {h.motivo}</Typography></Paper>)}</>}
    <Dialog open={abrir} onClose={() => !ocupado && setAbrir(false)} aria-labelledby="admin-confirmar">
      <DialogTitle id="admin-confirmar">{accion === "revocar" ? "Revocar acceso" : "Restaurar acceso"}</DialogTitle>
      <DialogContent><Stack spacing={2} sx={{ pt: 1 }}><Typography>{accion === "revocar" ? "Se cerrarán todas sus sesiones. Sus datos no se borran. Sus vacantes dejan de mostrarse mientras el acceso esté revocado." : "La cuenta podrá volver a iniciar sesión. Las sesiones anteriores no se recuperan."}</Typography>
        <TextField autoFocus id="admin-motivo" label="Motivo" required multiline minRows={3} value={motivo} onChange={e => setMotivo(e.target.value)} helperText="Queda en el historial con tu cuenta como responsable. Entre 10 y 1000 caracteres." />{error && <Alert severity="error">{error}</Alert>}</Stack></DialogContent>
      <DialogActions><Button disabled={ocupado} onClick={() => setAbrir(false)}>Cancelar</Button><Button color={accion === "revocar" ? "error" : "primary"} variant="contained" disabled={ocupado} onClick={guardar}>{ocupado ? "Guardando…" : "Confirmar cambio de acceso"}</Button></DialogActions>
    </Dialog>
  </Stack>;
}
