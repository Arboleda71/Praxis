import CheckRounded from "@mui/icons-material/CheckRounded";
import SchoolRounded from "@mui/icons-material/SchoolRounded";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";

/** Birrete (formación) + check (requisitos), según la identidad de la Entrega 1. */
export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      underline="none"
      aria-label="Praxis, ir al inicio"
      sx={{ display: "inline-flex", alignItems: "center", gap: 1.25, color: light ? "common.white" : "text.primary" }}
    >
      <Box
        aria-hidden
        sx={{ position: "relative", width: 32, height: 32, borderRadius: 2, bgcolor: "primary.main", display: "grid", placeItems: "center" }}
      >
        <SchoolRounded sx={{ color: "common.white", fontSize: 20 }} />
        <Box
          sx={{
            position: "absolute",
            right: -3,
            bottom: -3,
            width: 14,
            height: 14,
            borderRadius: "50%",
            bgcolor: "secondary.main",
            border: "2px solid #fff",
            display: "grid",
            placeItems: "center",
          }}
        >
          <CheckRounded sx={{ fontSize: 10, color: "common.white" }} />
        </Box>
      </Box>
      <Box component="span" sx={{ fontFamily: "var(--font-poppins)", fontWeight: 700, fontSize: 22, letterSpacing: "-0.3px" }}>
        Praxis
      </Box>
    </Link>
  );
}
