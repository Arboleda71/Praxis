import { CuentasAdmin } from "@/components/AdminCuentas";
import { SinAcceso } from "@/components/Aviso";
import { requireRole } from "@/lib/session";
export const metadata = { title: "Cuentas registradas" };
export default async function Pagina() {
  if (!(await requireRole("admin", "/admin/cuentas"))) return <SinAcceso role="estudiante" />;
  return <CuentasAdmin />;
}
