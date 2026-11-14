import type { Metadata } from "next";
import { SinAcceso } from "@/components/Aviso";
import FormularioEmpresa from "@/components/FormularioEmpresa";
import { requireRole } from "@/lib/session";
import LogoEmpresa from "@/components/LogoEmpresa";
import { Button, Stack, Typography } from "@mui/material";

export const metadata: Metadata = { title: "Perfil de la empresa" };

export default async function PerfilEmpresa() {
  if (!(await requireRole("empresa", "/empresa/perfil")))
    return <SinAcceso role="estudiante" />;
  return <><FormularioEmpresa /><Stack spacing={3} sx={{ maxWidth: 720, mx: "auto", width: "100%", p: 2, pb: 4 }}><LogoEmpresa /><Typography variant="h2" sx={{ fontSize: 22 }}>Tu cuenta y tus datos</Typography><Button color="error" href="/cuenta/eliminar">Eliminar la cuenta de la empresa</Button></Stack></>;
}
