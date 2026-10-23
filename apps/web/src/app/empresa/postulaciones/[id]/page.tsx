import { DetalleCandidato } from "@/components/Postulaciones";
import { SinAcceso } from "@/components/Aviso";
import { requireRole } from "@/lib/session";
export const metadata = { title: "Detalle de postulación" };
export default async function Pagina({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!(await requireRole("empresa", `/empresa/postulaciones/${id}`)))
    return <SinAcceso role="estudiante" />;
  return <DetalleCandidato id={id} />;
}
