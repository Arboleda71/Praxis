"use client";

import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Paper from "@mui/material/Paper";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV, currentHref, type Role } from "@/lib/nav";

/** Navegación móvil con sesión, fija abajo. En escritorio la reemplaza `NavTabs`. */
export default function BottomNav({ role }: { role: Role }) {
  const items = NAV[role];
  const value = currentHref(usePathname(), items);

  return (
    <Paper
      component="nav"
      aria-label="Principal"
      square
      elevation={0}
      sx={{
        display: { md: "none" },
        position: "fixed",
        insetInline: 0,
        bottom: 0,
        zIndex: "appBar",
        borderTop: 1,
        borderColor: "grey.300",
      }}
    >
      <BottomNavigation showLabels value={value}>
        {items.map(({ href, label, Icon }) => (
          <BottomNavigationAction
            key={href}
            component={Link}
            href={href}
            value={href}
            label={label}
            icon={<Icon />}
            aria-current={value === href ? "page" : undefined}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
