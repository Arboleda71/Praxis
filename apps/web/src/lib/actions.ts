"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { API_URL, COOKIE } from "./session";

/** Termina la sesión en la API y borra la cookie. */
export async function logout() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await fetch(`${API_URL}/auth/logout`, { method: "POST", headers: { cookie: `${COOKIE}=${token}` } }).catch(() => {});
  }
  jar.delete(COOKIE);
  redirect("/");
}
