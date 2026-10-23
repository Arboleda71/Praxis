"use client";
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { MODALIDADES, NIVELES_FORMACION } from '@praxis/contracts';
import { useEffect, useState } from 'react';
import { solicitar, type Lista, type Vacante } from '@/lib/mercado';
import { fechaCorta } from '@/lib/perfil-cliente';
export default function BuscarVacantes({ visitante = false }: { visitante?: boolean }) {
  const [lista, setLista] = useState<Lista<Vacante> | null>(null); const [error, setError] = useState('');
  const [f, setF] = useState({ q: '', nivel: '', modalidad: '', ciudad: '' });
  async function buscar(pagina = 1) { setError(''); try { if (visitante) { const items = await solicitar<Vacante[]>('/vacantes/recientes'); setLista({ items, total: items.length, pagina: 1 }); } else { const q = new URLSearchParams({ pagina: String(pagina) }); for (const [k, v] of Object.entries(f)) if (v) q.set(k, v); setLista(await solicitar(`/vacantes?${q}`)); } } catch (e) { setError((e as Error).message); } }
  // Carga inicial; los filtros se aplican al enviar el formulario.
  useEffect(() => {
    const inicial = visitante ? solicitar<Vacante[]>('/vacantes/recientes').then(items => ({ items, total: items.length, pagina: 1 })) : solicitar<Lista<Vacante>>('/vacantes?pagina=1');
    void inicial.then(setLista).catch(e => setError(e.message));
  }, [visitante]);
  return <Stack spacing={3} sx={{ maxWidth: 960, mx: 'auto', p: 2, py: 4 }}>
    <Typography variant={visitante ? 'h2' : 'h1'} sx={{ fontSize: 28 }}>{visitante ? 'Últimas cinco prácticas abiertas' : 'Buscar prácticas'}</Typography>
    {!visitante && <Stack component="form" spacing={2} onSubmit={e => { e.preventDefault(); void buscar(); }}>
      <TextField id="buscar-titulo" label="Buscar por título" value={f.q} onChange={e => setF({ ...f, q: e.target.value })} />
      <TextField id="buscar-nivel" select label="Nivel de formación" value={f.nivel} onChange={e => setF({ ...f, nivel: e.target.value })}><MenuItem value="">Todos</MenuItem>{NIVELES_FORMACION.map(n => <MenuItem key={n.id} value={n.id}>{n.nombre}</MenuItem>)}</TextField>
      <TextField id="buscar-modalidad" select label="Modalidad" value={f.modalidad} onChange={e => setF({ ...f, modalidad: e.target.value })}><MenuItem value="">Todas</MenuItem>{MODALIDADES.map(n => <MenuItem key={n.id} value={n.id}>{n.nombre}</MenuItem>)}</TextField>
      <TextField id="buscar-ciudad" label="Ciudad (ubicación de la práctica)" value={f.ciudad} onChange={e => setF({ ...f, ciudad: e.target.value })} />
      <Button type="submit" variant="contained">Buscar</Button>
    </Stack>}
    {error && <Alert severity="error">{error}</Alert>}
    {!lista ? <Typography role="status">Cargando prácticas…</Typography> : lista.items.length === 0 ? <Typography>No hay prácticas abiertas con estos criterios.</Typography> : lista.items.map(v => <Paper key={v.id} component="article" variant="outlined" sx={{ p: 2 }}><Typography variant="h2" sx={{ fontSize: 20 }}>{v.titulo}</Typography><Typography>{v.empresa?.razonSocial} · {MODALIDADES.find(m => m.id === v.modalidad)?.nombre} {v.ciudad} · Vigencia: {fechaCorta(v.vigencia)}</Typography><Button href={visitante ? `/ingresar?next=${encodeURIComponent(`/estudiante/vacantes/${v.id}`)}` : `/estudiante/vacantes/${v.id}`}>{visitante ? 'Ingresar para consultar' : 'Ver requisitos'}</Button></Paper>)}
    {!visitante && lista && <Stack direction="row" spacing={2}><Button disabled={lista.pagina === 1} onClick={() => buscar(lista.pagina - 1)}>Anterior</Button><Typography>Página {lista.pagina}. {lista.total} resultados.</Typography><Button disabled={lista.pagina * 20 >= lista.total} onClick={() => buscar(lista.pagina + 1)}>Siguiente</Button></Stack>}
  </Stack>;
}
