import CambiarCv from "@/components/CambiarCv";
import { SinAcceso } from "@/components/Aviso";
import { requireRole } from "@/lib/session";
export const metadata = { title: "Cambiar CV de postulación" };
export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await requireRole("estudiante", `/estudiante/postulaciones/${id}/cv`))) return <SinAcceso role="empresa" />;
  return <CambiarCv id={id} />;
}
