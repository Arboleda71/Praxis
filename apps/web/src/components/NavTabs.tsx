"use client";

import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV, currentHref, type Role } from "@/lib/nav";

/** Navegación de escritorio; en móvil la reemplaza `BottomNav`. */
export default function NavTabs({ role }: { role: Role }) {
  const items = NAV[role];
  const value = currentHref(usePathname(), items);

  return (
    <Box component="nav" aria-label="Principal" sx={{ display: { xs: "none", md: "block" }, alignSelf: "stretch" }}>
      <Tabs value={value} sx={{ height: "100%", "& .MuiTabs-flexContainer": { height: "100%" } }}>
        {items.map(({ href, label }) => (
          <Tab
            key={href}
            component={Link}
            href={href}
            value={href}
            label={label}
            aria-current={value === href ? "page" : undefined}
            sx={{ minHeight: 64 }}
          />
        ))}
      </Tabs>
    </Box>
  );
}
