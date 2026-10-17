import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";
import type { SesionPublica as Session } from "@praxis/contracts";
import AccountMenu from "./AccountMenu";
import Logo from "./Logo";
import NavTabs from "./NavTabs";

const compact = { px: { xs: 1.25, md: 2 }, fontSize: { xs: 13, md: 14 } };

export default function SiteHeader({ session }: { session: Session | null }) {
  return (
    <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: "grey.300" }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ gap: { xs: 1, md: 4 } }}>
          <Logo />
          {session && <NavTabs role={session.rol} />}
          <Box sx={{ flexGrow: 1 }} />
          {session ? (
            <AccountMenu name={session.nombre} email={session.correo} />
          ) : (
            <>
              <Button href="/ingresar" sx={compact}>
                {/* «Ingresar» solo en móvil, por espacio; en escritorio el término único es «Iniciar sesión». */}
                <Box component="span" sx={{ display: { md: "none" } }}>Ingresar</Box>
                <Box component="span" sx={{ display: { xs: "none", md: "inline" } }}>Iniciar sesión</Box>
              </Button>
              <Button href="/registro" variant="contained" sx={compact}>
                Crear cuenta
              </Button>
            </>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
