import type { Metadata } from "next";
import { SinAcceso } from "@/components/Aviso";
import FormularioEmpresa from "@/components/FormularioEmpresa";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Perfil de la empresa" };

export default async function PerfilEmpresa() {
  if (!(await requireRole("empresa", "/empresa/perfil")))
    return <SinAcceso role="estudiante" />;
  return <FormularioEmpresa />;
}
