import type { Metadata } from "next";
import { SinAcceso } from "@/components/Aviso";
import FormularioDisponibilidad from "@/components/perfil/FormularioDisponibilidad";
import PaginaSeccion from "@/components/perfil/PaginaSeccion";
import { getPerfil } from "@/lib/perfil";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Disponibilidad e idiomas" };

export default async function EditarDisponibilidad() {
  if (!(await requireRole("estudiante", "/estudiante/perfil/disponibilidad"))) return <SinAcceso role="empresa" />;
  const perfil = await getPerfil();
  return (
    <PaginaSeccion titulo="Disponibilidad e idiomas" intro="Todo es opcional: informa a la empresa, pero no te impide postularte.">
      {perfil && <FormularioDisponibilidad inicial={perfil.disponibilidad} />}
    </PaginaSeccion>
  );
}
