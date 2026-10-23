import { MisPostulaciones } from "@/components/Postulaciones";
import { SinAcceso } from "@/components/Aviso";
import { requireRole } from "@/lib/session";
export const metadata = { title: "Mis postulaciones" };
export default async function Pagina() {
  if (!(await requireRole("estudiante", "/estudiante/postulaciones")))
    return <SinAcceso role="empresa" />;
  return <MisPostulaciones />;
}
