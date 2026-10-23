import ConfirmacionCorreo from "@/components/ConfirmacionCorreo";
import { API_URL } from "@/lib/session";
export const metadata = { title: "Confirmar correo" };
export default async function ConfirmarCorreo({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  let token = (await searchParams).token;
  if (typeof token !== "string") token = undefined;
  if (token) {
    const res = await fetch(
      `${API_URL}/auth/confirmar-correo?token=${encodeURIComponent(token)}`,
      { cache: "no-store" },
    ).catch(() => null);
    if (res?.status === 400 || (res?.ok && !(await res.json()).valido))
      token = undefined;
  }
  return <ConfirmacionCorreo token={token} />;
}
