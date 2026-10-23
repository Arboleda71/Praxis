"use client";

// Cliente: Chip clona su `icon`, y eso no cruza la frontera de Server Components.
import CancelRounded from "@mui/icons-material/CancelRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import HelpRounded from "@mui/icons-material/HelpRounded";
import VisibilityRounded from "@mui/icons-material/VisibilityRounded";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PROGRAMA_REVISA_EMPRESA } from "@praxis/contracts";

// El programa solicitado se muestra sin estado automático: la afinidad la revisa la empresa (II, v4.0.0).
const REQUISITOS = [
  { label: "Nivel de formación: Universitario", estado: "Cumple", color: "success", Icon: CheckCircleRounded },
  { label: "Semestre mínimo: 7", estado: "Falta información", color: "warning", Icon: HelpRounded },
  { label: "Aval de la institución", estado: "No cumple", color: "error", Icon: CancelRounded },
  { label: "Programa solicitado: Ingeniería de Sistemas o afines", estado: PROGRAMA_REVISA_EMPRESA, color: "default", Icon: VisibilityRounded },
] as const;

export default function RequisitosEjemplo() {
  return (
    <Card variant="outlined" sx={{ borderColor: "divider" }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
          Ejemplo · Práctica en desarrollo web · Andina Soft
        </Typography>
        <Typography variant="h6" component="h2" sx={{ mt: 1, mb: 1 }}>
          Así ves cada requisito
        </Typography>
        <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
          {REQUISITOS.map(({ label, estado, color, Icon }) => (
            <Stack
              component="li"
              key={label}
              // El chip del programa es largo: en móvil va debajo del texto (mockup M0).
              direction={estado === PROGRAMA_REVISA_EMPRESA ? { xs: "column", sm: "row" } : "row"}
              spacing={1.5}
              sx={{
                alignItems: estado === PROGRAMA_REVISA_EMPRESA ? { xs: "flex-start", sm: "center" } : "center",
                justifyContent: "space-between",
                py: 1.5,
                borderTop: 1,
                borderColor: "grey.300",
              }}
            >
              <Typography variant="body2">{label}</Typography>
              <Chip
                size="small"
                color={color}
                variant={estado === PROGRAMA_REVISA_EMPRESA ? "outlined" : "filled"}
                icon={<Icon />}
                label={estado}
              />
            </Stack>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
