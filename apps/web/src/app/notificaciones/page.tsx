import { redirect } from "next/navigation";
import Notificaciones from "@/components/Notificaciones";
import { getSession } from "@/lib/session";
export const metadata = { title: "Notificaciones" };
export default async function Pagina() {
  if (!(await getSession())) redirect("/ingresar?next=/notificaciones");
  return <Notificaciones />;
}
