import { NextResponse, type NextRequest } from "next/server";

/**
 * Le dice a la API quién es el visitante (spec 011, FR-001). La API solo cree `x-praxis-ip` si llega con
 * `PROXY_SECRETO`; lo que el cliente haya puesto en esas cabeceras se descarta siempre.
 *
 * ponytail: la IP sale de las cabeceras de la plataforma. Vercel sobrescribe `x-real-ip` y
 * `x-forwarded-for` con la IP real; en otro alojamiento hay que ponerle delante un proxy que haga lo mismo.
 */
export function proxy(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.delete("x-praxis-ip");
  headers.delete("x-praxis-proxy");
  const secreto = process.env.PROXY_SECRETO;
  const ip = (
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]
  )?.trim();
  if (secreto && ip) {
    headers.set("x-praxis-ip", ip);
    headers.set("x-praxis-proxy", secreto);
  }
  return NextResponse.next({ request: { headers } });
}

// En todo menos los estáticos: el matcher distingue mayúsculas y el rewrite no, así que `/API/…` llegaría a
// la API sin pasar por aquí. Las cabeceras sobran en las páginas, pero no hacen daño.
export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
