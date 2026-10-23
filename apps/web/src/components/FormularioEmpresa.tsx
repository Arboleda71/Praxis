"use client";
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { empresaSchema, SECTORES, type FichaEmpresa } from '@praxis/contracts';
import { useEffect, useRef, useState } from 'react';
import ReenviarEnlace from './ReenviarEnlace';

type Datos = Omit<FichaEmpresa, 'dv'>;
const campos = [['razonSocial', 'Razón social'], ['nit', 'NIT con dígito de verificación'], ['ciudad', 'Ciudad'], ['sitioWeb', 'Sitio web'], ['descripcion', 'Descripción'], ['correoContacto', 'Correo de contacto'], ['telefono', 'Teléfono de contacto']] as const;
export default function FormularioEmpresa() {
  const [v, setV] = useState<Datos | null>(null);
  const [confirmado, setConfirmado] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const resumen = useRef<HTMLDivElement>(null);
  async function cargar() {
    setError('');
    try {
      const res = await fetch('/api/empresa/perfil');
      if (!res.ok) throw new Error();
      const d = await res.json();
      setV({ razonSocial: d.razonSocial, nit: `${d.nit}-${d.dv}`, sector: d.sector, ciudad: d.ciudad, sitioWeb: d.sitioWeb, descripcion: d.descripcion, correoContacto: d.correoContacto, telefono: d.telefono });
      setConfirmado(d.correoConfirmado);
    } catch { setError('No pudimos cargar tu empresa. Inténtalo de nuevo.'); }
  }
  useEffect(() => { void cargar(); }, []);
  async function guardar(e: React.FormEvent) {
    e.preventDefault(); if (!v) return;
    setMensaje(''); setError('');
    const r = empresaSchema.safeParse(v);
    if (!r.success) { setErrores(Object.fromEntries(r.error.issues.map(i => [i.path.join('.'), i.message]))); requestAnimationFrame(() => resumen.current?.focus()); return; }
    setErrores({}); setGuardando(true);
    try {
      const res = await fetch('/api/empresa/perfil', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(v) });
      if (res.ok) setMensaje('Guardamos el perfil de la empresa.');
      else { const d = await res.json(); setErrores(d.errores ?? {}); setError(d.mensaje ?? 'Revisa los campos indicados.'); }
    } catch { setError('No pudimos guardar. Revisa tu conexión.'); }
    finally { setGuardando(false); }
  }
  return <Stack spacing={3} sx={{ maxWidth: 720, mx: 'auto', px: 2, py: 4 }}>
    <Typography variant="h1" sx={{ fontSize: 28 }}>Perfil de la empresa</Typography>
    <Typography>Datos declarados por la empresa</Typography>
    {error && <Alert severity="error">{error}</Alert>}
    {!v ? <Button onClick={cargar}>Volver a cargar el perfil</Button> : <>
      <Alert severity={confirmado ? 'success' : 'warning'}>
        Para publicar vacantes necesitas: correo {confirmado ? 'confirmado' : 'pendiente de confirmación'} y NIT válido. Los cupos se comprueban al publicar.
      </Alert>
      {!confirmado && <ReenviarEnlace />}
      <Stack component="form" noValidate onSubmit={guardar} spacing={2.5}>
        {Object.keys(errores).length > 0 && <Alert severity="error" ref={resumen} tabIndex={-1}>Revisa los campos indicados antes de guardar.</Alert>}
        {campos.map(([k, etiqueta]) => <TextField key={k} id={`empresa-${k}`} label={etiqueta} required={k === 'razonSocial' || k === 'nit'} value={v[k] ?? ''} onChange={e => setV({ ...v, [k]: e.target.value || (k === 'nit' || k === 'razonSocial' ? '' : null) })} error={!!errores[k]} helperText={errores[k] ?? (k === 'nit' ? 'Se comprueba el formato y el dígito; no representa una certificación.' : ' ')} multiline={k === 'descripcion'} minRows={k === 'descripcion' ? 3 : undefined} />)}
        <TextField id="empresa-sector" select label="Sector" value={v.sector ?? ''} onChange={e => setV({ ...v, sector: e.target.value || null })} error={!!errores.sector} helperText={errores.sector}>
          <MenuItem value="">Sin elegir</MenuItem>{SECTORES.map(s => <MenuItem key={s.id} value={s.id}>{s.nombre}</MenuItem>)}
        </TextField>
        <Button variant="contained" type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar perfil de empresa'}</Button>
        <Typography role="status">{mensaje}</Typography>
      </Stack>
    </>}
  </Stack>;
}
