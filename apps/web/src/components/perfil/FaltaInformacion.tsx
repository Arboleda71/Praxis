"use client";

// Cliente: Chip clona su `icon`, y eso no cruza la frontera de Server Components.
import HelpRounded from "@mui/icons-material/HelpRounded";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";

/** Un campo vacío nunca es un error: se invita a completarlo (IV). */
export default function FaltaInformacion({ href, campo }: { href?: string; campo: string }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
      <Chip size="small" color="warning" icon={<HelpRounded />} label="Falta información" />
      {href && (
        <Link href={href} aria-label={`Completar ${campo}`} sx={{ fontWeight: 600, py: 1 }}>
          Completar
        </Link>
      )}
    </Stack>
  );
}
