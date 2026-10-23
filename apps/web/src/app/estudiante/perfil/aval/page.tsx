import type { Metadata } from "next";
import { SinAcceso } from "@/components/Aviso";
import FormularioAval from "@/components/perfil/FormularioAval";
import PaginaSeccion from "@/components/perfil/PaginaSeccion";
import { getPerfil } from "@/lib/perfil";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Aval" };

export default async function EditarAval() {
  if (!(await requireRole("estudiante", "/estudiante/perfil/aval"))) return <SinAcceso role="empresa" />;
  const perfil = await getPerfil();
  return (
    <PaginaSeccion titulo="Aval" intro="El aval es la autorización de tu institución para hacer la práctica.">
      {perfil && <FormularioAval aval={perfil.aval} soporte={perfil.archivos.soporteAval} />}
    </PaginaSeccion>
  );
}
