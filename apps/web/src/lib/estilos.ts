import type { SxProps, Theme } from "@mui/material/styles";

/** Panel de formularios: sin borde en móvil; tarjeta de 480 px con radio de 16 px en escritorio (mockups M1). */
export const panelCuenta: SxProps<Theme> = {
  width: "100%",
  maxWidth: { md: 480 },
  mx: "auto",
  p: { xs: 0, md: 5 },
  border: { xs: 0, md: 1 },
  borderColor: { md: "grey.300" },
  borderRadius: { md: 4 },
  bgcolor: { xs: "transparent", md: "background.paper" },
};

/** Contenedor de las páginas de cuenta. */
export const paginaCuenta: SxProps<Theme> = {
  py: { xs: 3, md: 7 },
  px: { xs: 2, md: 3 },
  bgcolor: { xs: "background.paper", md: "background.default" },
  flex: 1,
};
