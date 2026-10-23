"use client";

import KeyboardArrowDownRounded from "@mui/icons-material/KeyboardArrowDownRounded";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { useState, useTransition } from "react";
import { logout } from "@/lib/actions";
import Link from "next/link";

const MENU_ID = "menu-cuenta";

export default function AccountMenu({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const open = Boolean(anchor);
  const trigger = {
    "aria-label": "Cuenta",
    "aria-haspopup": "menu" as const,
    "aria-expanded": open,
    "aria-controls": open ? MENU_ID : undefined,
    onClick: (e: React.MouseEvent<HTMLElement>) => setAnchor(e.currentTarget),
  };
  const avatar = (size: number) => (
    <Avatar
      aria-hidden
      sx={{
        width: size,
        height: size,
        fontSize: size / 2,
        bgcolor: "primary.main",
      }}
    >
      {name[0]}
    </Avatar>
  );

  return (
    <>
      <IconButton {...trigger} sx={{ display: { md: "none" } }}>
        {avatar(32)}
      </IconButton>
      <Chip
        {...trigger}
        // Sin aria-label: el nombre sale del contenido e incluye el texto visible (WCAG 2.5.3).
        aria-label={undefined}
        variant="outlined"
        avatar={avatar(24)}
        label={
          <Box
            component="span"
            sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
          >
            <span className="sr-only">Cuenta </span>
            {email}
            <KeyboardArrowDownRounded fontSize="small" aria-hidden />
          </Box>
        }
        sx={{ display: { xs: "none", md: "inline-flex" } }}
      />
      <Menu
        id={MENU_ID}
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { minWidth: 240 } } }}
      >
        <Box sx={{ px: 2, pt: 1, pb: 1.5 }}>
          <Typography variant="subtitle2">{name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem
          component={Link}
          href="/notificaciones"
          onClick={() => setAnchor(null)}
        >
          Notificaciones
        </MenuItem>
        <MenuItem
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const r = await logout();
              if (r?.error) {
                setError(r.error);
                setAnchor(null);
              }
            })
          }
        >
          <ListItemIcon>
            <LogoutRounded fontSize="small" />
          </ListItemIcon>
          Cerrar sesión
        </MenuItem>
      </Menu>
      {error && (
        <Typography role="alert" color="error">
          {error}
        </Typography>
      )}
    </>
  );
}
