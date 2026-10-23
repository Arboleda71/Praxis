"use client";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PLANES, type Plan } from "@praxis/contracts";
import { useEffect, useState } from "react";
import { solicitar, type Lista } from "@/lib/mercado";
type Configuracion = {
  disponible: boolean;
  activo: boolean;
  plan: Plan | null;
  planVenceEn: string | null;
};
type Pago = {
  id: string;
  plan: Plan;
  montoCentavos: number;
  estado: string;
  creadaEn: string;
};
const cop = (centavos: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(centavos / 100);
export default function PlanesEmpresa() {
  const [config, setConfig] = useState<Configuracion | null>(null);
  const [lista, setLista] = useState<Lista<Pago> | null>(null);
  const [pagina, setPagina] = useState(1);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  useEffect(() => {
    void Promise.all([
      solicitar<Configuracion>("/empresa/planes"),
      solicitar<Lista<Pago>>(`/empresa/pagos?pagina=${pagina}`),
    ])
      .then(([c, l]) => {
        setConfig(c);
        setLista(l);
      })
      .catch((e) => setError(e.message));
  }, [pagina]);
  async function actualizar() {
    try {
      const [c, l] = await Promise.all([
        solicitar<Configuracion>("/empresa/planes"),
        solicitar<Lista<Pago>>(`/empresa/pagos?pagina=${pagina}`),
      ]);
      setConfig(c);
      setLista(l);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function comprar(plan: Plan) {
    setError("");
    setOcupado(true);
    try {
      const r = await solicitar<{ url: string }>("/empresa/pagos", "POST", {
        plan,
      });
      window.location.assign(r.url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setOcupado(false);
    }
  }
  return (
    <Stack spacing={3} sx={{ maxWidth: 900, mx: "auto", p: 2, py: 4 }}>
      <Typography variant="h1" sx={{ fontSize: 28 }}>
        Planes y pagos
      </Typography>
      <Alert severity="info">
        Demostración académica: solo pagos de prueba en Wompi sandbox. No uses
        datos personales ni medios de pago reales.
      </Alert>
      <Typography>
        Dos vacantes gratis cada seis meses. Los planes duran seis meses y se
        renuevan manualmente al vencer. Se activan cuando Wompi confirma un pago
        aprobado; volver del checkout no activa el plan.
      </Typography>
      <Button href="/empresa/vacantes">Volver a mis vacantes</Button>
      {error && <Alert severity="error">{error}</Alert>}
      {config && !config.disponible && (
        <Alert severity="warning">
          Los pagos de prueba aún no están conectados. Puedes seguir usando tus
          publicaciones gratuitas.
        </Alert>
      )}
      {config?.activo && (
        <Alert severity="success">
          Plan {config.plan ? PLANES[config.plan].nombre : ""} activo hasta{" "}
          {config.planVenceEn
            ? new Date(config.planVenceEn).toLocaleDateString("es-CO", {
                timeZone: "America/Bogota",
              })
            : ""}
          . Renovación manual al vencer.
        </Alert>
      )}
      {(Object.keys(PLANES) as Plan[]).map((k) => (
        <Paper component="section" variant="outlined" sx={{ p: 2 }} key={k}>
          <Typography variant="h2" sx={{ fontSize: 24 }}>
            {PLANES[k].nombre}: {cop(PLANES[k].centavos)}
          </Typography>
          <Typography>
            {PLANES[k].vacantes === null
              ? "Publicaciones ilimitadas"
              : "Cuatro publicaciones adicionales"}{" "}
            durante seis meses.
          </Typography>
          <Button
            variant="contained"
            disabled={!config?.disponible || config.activo || ocupado}
            onClick={() => comprar(k)}
          >
            Pagar {PLANES[k].nombre} en sandbox
          </Button>
        </Paper>
      ))}
      <Typography variant="h2" sx={{ fontSize: 22 }}>
        Historial de pagos de prueba
      </Typography>
      <Button onClick={actualizar}>Actualizar estado de pagos</Button>
      {lista?.items.length === 0 && (
        <Typography>No tienes pagos registrados.</Typography>
      )}
      {lista?.items.map((p) => (
        <Paper variant="outlined" sx={{ p: 2 }} key={p.id}>
          <Typography>
            {PLANES[p.plan].nombre} · {cop(p.montoCentavos)} · Estado:{" "}
            {p.estado}
          </Typography>
          <Typography>
            Creado:{" "}
            {new Date(p.creadaEn).toLocaleString("es-CO", {
              timeZone: "America/Bogota",
            })}
          </Typography>
          {p.estado === "Pendiente" && (
            <Button
              disabled={!config?.disponible || ocupado}
              onClick={() => comprar(p.plan)}
            >
              Continuar pago de prueba
            </Button>
          )}
        </Paper>
      ))}
      <Stack direction="row" spacing={2}>
        <Button disabled={pagina === 1} onClick={() => setPagina(pagina - 1)}>
          Anterior
        </Button>
        <Typography>Página {pagina}</Typography>
        <Button
          disabled={!lista || pagina * 20 >= lista.total}
          onClick={() => setPagina(pagina + 1)}
        >
          Siguiente
        </Button>
      </Stack>
    </Stack>
  );
}
