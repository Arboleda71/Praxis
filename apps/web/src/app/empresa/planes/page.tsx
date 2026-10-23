import PlanesEmpresa from "@/components/PlanesEmpresa";
import { SinAcceso } from "@/components/Aviso";
import { requireRole } from "@/lib/session";
export const metadata = { title: "Planes y pagos" };
export default async function Pagina() {
  if (!(await requireRole("empresa", "/empresa/planes")))
    return <SinAcceso role="estudiante" />;
  return <PlanesEmpresa />;
}
