import { DetalleCuentaAdmin } from "@/components/AdminCuentas";
import { SinAcceso } from "@/components/Aviso";
import { requireRole } from "@/lib/session";
export const metadata = { title: "Control de acceso" };
export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await requireRole("admin", `/admin/cuentas/${id}`))) return <SinAcceso role="estudiante" />;
  return <DetalleCuentaAdmin id={id} />;
}
