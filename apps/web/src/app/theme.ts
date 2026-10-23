"use client";

import { createTheme } from "@mui/material/styles";
import NextLink from "next/link";

const heading = {
  fontFamily: "var(--font-poppins), Arial, sans-serif",
  fontWeight: 600,
  lineHeight: 1.3,
};

// Paleta y tipografía de la identidad de Praxis (documento de la Entrega 1, tabla 6).
const theme = createTheme({
  palette: {
    primary: { main: "#1E40AF" },
    // Texto azul marino sobre naranja: el blanco da 2,8:1 y no cumple WCAG AA.
    secondary: { main: "#F97316", contrastText: "#0B1F4B" },
    info: { main: "#0EA5E9" },
    // Ámbar oscuro para «Falta información» con texto blanco (AA).
    warning: { main: "#B45309", contrastText: "#FFFFFF" },
    text: { primary: "#0B1F4B", secondary: "#475569" },
    background: { default: "#F8FAFC" },
    divider: "#94A3B8",
  },
  typography: {
    fontFamily: "var(--font-inter), Arial, sans-serif",
    h1: heading,
    h2: heading,
    h3: heading,
    h4: heading,
    h5: heading,
    h6: heading,
    button: { textTransform: "none", fontWeight: 600 },
    overline: { fontWeight: 600, letterSpacing: "0.08em" },
  },
  components: {
    // Enlaces de MUI navegan en cliente con next/link.
    MuiButtonBase: { defaultProps: { LinkComponent: NextLink } },
    MuiLink: { defaultProps: { component: NextLink } },
    // El gris por defecto del borde da 1,7:1; WCAG 1.4.11 pide 3:1 en bordes de controles.
    MuiOutlinedInput: {
      styleOverrides: { notchedOutline: { borderColor: "#64748B" } },
    },
    MuiFormHelperText: {
      styleOverrides: { root: { "&.Mui-disabled": { color: "#475569" } } },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          color: "#0B1F4B",
          "&.Mui-focusVisible, &:hover, &.Mui-selected": {
            backgroundColor: "#E2E8F0",
            color: "#0B1F4B",
          },
        },
      },
    },
  },
});

export default theme;
