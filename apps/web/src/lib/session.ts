import type { Rol, SesionPublica } from "@praxis/contracts";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { inicioDe } from "./rutas";

export const API_URL = process.env.API_URL ?? "http://localhost:3001";
export const COOKIE = "praxis_sesion";

/** La sesión la valida la API; aquí solo se reenvía la cookie. */
export async function getSession(): Promise<SesionPublica | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/auth/sesion`, { headers: { cookie: `${COOKIE}=${token}` }, cache: "no-store" });
    return res.ok ? ((await res.json()) as SesionPublica) : null;
  } catch {
    return null;
  }
}

/** Sin sesión lleva a ingresar y vuelve a `path`; con otro rol devuelve `null` para mostrar «sin acceso». */
export async function requireRole(rol: Rol, path: string): Promise<SesionPublica | null> {
  const session = await getSession();
  if (!session) redirect(`/ingresar?next=${encodeURIComponent(path)}`);
  return session.rol === rol ? session : null;
}

/** Páginas de registro e ingreso: quien ya tiene sesión va a su sección. */
export async function requireGuest(): Promise<void> {
  const session = await getSession();
  if (session) redirect(inicioDe(session.rol));
}
