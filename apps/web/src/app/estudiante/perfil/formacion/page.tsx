import type { Metadata } from "next";
import { SinAcceso } from "@/components/Aviso";
import FormularioFormacion from "@/components/perfil/FormularioFormacion";
import PaginaSeccion from "@/components/perfil/PaginaSeccion";
import { getPerfil } from "@/lib/perfil";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Formación" };

export default async function EditarFormacion() {
  if (!(await requireRole("estudiante", "/estudiante/perfil/formacion"))) return <SinAcceso role="empresa" />;
  const perfil = await getPerfil();
  return (
    <PaginaSeccion titulo="Formación" intro="Nivel de formación y programa son parte del perfil mínimo.">
      {perfil && <FormularioFormacion inicial={perfil.formacion} />}
    </PaginaSeccion>
  );
}
