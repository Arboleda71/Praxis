import { Candidatos } from "@/components/Postulaciones";
import { SinAcceso } from "@/components/Aviso";
import { requireRole } from "@/lib/session";
export const metadata = { title: "Postulaciones recibidas" };
export default async function Pagina({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!(await requireRole("empresa", `/empresa/vacantes/${id}/postulaciones`)))
    return <SinAcceso role="estudiante" />;
  return <Candidatos vacanteId={id} />;
}
