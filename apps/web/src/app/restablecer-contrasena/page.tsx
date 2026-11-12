import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { Metadata } from "next";
import FormularioRestablecer from "@/components/FormularioRestablecer";
import { paginaCuenta, panelCuenta } from "@/lib/estilos";
import { API_URL } from "@/lib/session";

export const metadata: Metadata = { title: "Nueva contraseña" };

export default async function RestablecerContrasena({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  let token = (await searchParams).token;
  if (typeof token !== "string") token = undefined;
  // Abrir el enlace solo consulta su vigencia. Si la API no responde se muestra el formulario: el enlace
  // puede seguir sirviendo y el envío dirá si no.
  if (token) {
    const res = await fetch(
      `${API_URL}/auth/restablecer-contrasena?token=${encodeURIComponent(token)}`,
      { cache: "no-store" },
    ).catch(() => null);
    if (res?.status === 400 || (res?.ok && !(await res.json()).valido))
      token = undefined;
  }
  return (
    <Box sx={paginaCuenta}>
      <Stack spacing={2.5} sx={panelCuenta}>
        <FormularioRestablecer token={token} />
      </Stack>
    </Box>
  );
}
