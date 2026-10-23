import BuscarVacantes from "@/components/BuscarVacantes";
import { SinAcceso } from "@/components/Aviso";
import { requireRole } from "@/lib/session";
export const metadata = { title: "Buscar prácticas" };
export default async function Buscar() {
  if (!(await requireRole("estudiante", "/estudiante/vacantes")))
    return <SinAcceso role="empresa" />;
  return <BuscarVacantes />;
}
