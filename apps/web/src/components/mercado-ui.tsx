"use client";

// Piezas de las pantallas de vacantes (mockups M6 · `docs/praxis-mockups.pen`, guía `docs/diseno-ui-ux.md`).
// Cliente: Chip clona su `icon`, y eso no cruza la frontera de Server Components.
import CancelRounded from "@mui/icons-material/CancelRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import HelpRounded from "@mui/icons-material/HelpRounded";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Resultado } from "@praxis/contracts";
import { tactil } from "@/lib/estilos";

const RESULTADOS = {
  cumple: { texto: "Cumple", color: "success", Icono: CheckCircleRounded },
  no_cumple: { texto: "No cumple", color: "error", Icono: CancelRounded },
  falta_informacion: { texto: "Falta información", color: "warning", Icono: HelpRounded },
} as const;

/** Resultado de un requisito: siempre con palabra e ícono, nunca solo color (III, X). */
export function ChipResultado({ resultado }: { resultado: Resultado }) {
  const { texto, color, Icono } = RESULTADOS[resultado];
  return <Chip size="small" color={color} icon={<Icono />} label={texto} sx={{ flexShrink: 0, fontWeight: 600 }} />;
}

const TONOS = {
  ok: { bgcolor: "#E8F5E9", color: "#1B5E20" },
  neu: { bgcolor: "#F1F5F9", color: "text.secondary" },
} as const;

/** Etiqueta corta de estado. El texto dice el estado; el color solo acompaña. */
export function Insignia({ tono, children }: { tono: keyof typeof TONOS; children: React.ReactNode }) {
  return (
    <Box
      component="span"
      sx={{ ...TONOS[tono], px: 1.25, py: 0.25, borderRadius: 3, fontSize: 13, fontWeight: 600, lineHeight: 1.5, flexShrink: 0 }}
    >
      {children}
    </Box>
  );
}

/**
 * Aviso de error. Con `reintentar` ofrece repetir lo que falló (la carga de la página): una pantalla que no
 * pudo cargar no debe dejar como única salida recargar el navegador.
 */
export function AvisoError({
  mensaje,
  reintentar,
  children,
}: {
  mensaje: string;
  reintentar?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Alert
      severity="error"
      action={
        reintentar && (
          <Button color="inherit" sx={tactil} onClick={reintentar}>
            Reintentar
          </Button>
        )
      }
    >
      {mensaje}
      {children && <> {children}</>}
    </Alert>
  );
}

/** Estado vacío: ícono, el mensaje y, si la hay, la acción que saca de ahí. */
export function EstadoVacio({ icono, mensaje, children }: { icono: React.ReactNode; mensaje: string; children?: React.ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ px: 2.5, py: 5, borderRadius: 2 }}>
      <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center" }}>
        <Avatar aria-hidden sx={{ width: 64, height: 64, bgcolor: "#DBEAFE", color: "primary.main" }}>
          {icono}
        </Avatar>
        <Typography sx={{ fontSize: 18, fontWeight: 600 }}>{mensaje}</Typography>
        {children}
      </Stack>
    </Paper>
  );
}

/** Tarjeta de una práctica en una lista: título, datos básicos y una sola acción. */
export function TarjetaVacante({
  titulo,
  datos,
  href,
  accion,
  encabezado = "h2",
}: {
  titulo: string;
  datos: string;
  href: string;
  accion: string;
  encabezado?: "h2" | "h3";
}) {
  return (
    <Paper component="article" variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Stack spacing={1} sx={{ alignItems: "flex-start" }}>
        <Typography variant={encabezado} sx={{ fontSize: 20, overflowWrap: "anywhere" }}>
          {titulo}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {datos}
        </Typography>
        <Button variant="outlined" href={href} sx={tactil}>
          {accion}
        </Button>
      </Stack>
    </Paper>
  );
}
