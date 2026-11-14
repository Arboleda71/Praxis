import { redirect } from "next/navigation";
import EliminarCuenta from "@/components/EliminarCuenta";
import { SinAcceso } from "@/components/Aviso";
import { getSession } from "@/lib/session";
export const metadata = { title: "Eliminar mi cuenta" };
export default async function Pagina() {
  const s = await getSession();
  if (!s) redirect("/ingresar?next=/cuenta/eliminar");
  if (s.rol === "admin") return <SinAcceso role="admin" />;
  return <EliminarCuenta empresa={s.rol === "empresa"} />;
}
