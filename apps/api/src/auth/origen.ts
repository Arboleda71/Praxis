import { createHash, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import type { Request } from 'express';

const huella = (v: string) => createHash('sha256').update(v).digest();

/**
 * Una persona, un cubo: una IPv4 dentro de IPv6 (`::ffff:1.2.3.4`) cuenta como esa IPv4, y una IPv6 cuenta
 * por su /64, que es lo mínimo que un proveedor entrega a un cliente. Sin esto, quien tiene un /64 tendría
 * un límite propio por cada una de sus 2^64 direcciones.
 */
export function cubo(ip: string): string {
  const v4 = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i)?.[1];
  if (v4) return v4;
  if (isIP(ip) !== 6) return ip;
  const [izq, der = ''] = ip.toLowerCase().split('::');
  const partes = (s: string) =>
    s ? s.split(':').flatMap((p) => (p.includes('.') ? ['0', '0'] : [p])) : [];
  const a = partes(izq);
  const b = ip.includes('::') ? partes(der) : [];
  const todo = [...a, ...Array(8 - a.length - b.length).fill('0'), ...b];
  return `${todo.slice(0, 4).map((p) => parseInt(p, 16).toString(16)).join(':')}::/64`;
}

/**
 * Origen de la petición para el límite de intentos (spec 011, FR-001).
 * La web de Praxis (`apps/web/src/proxy.ts`) envía la IP del visitante en `x-praxis-ip` junto con
 * `PROXY_SECRETO`. Solo se cree con el secreto correcto; sin él cuenta la dirección del socket, que para
 * quien llama directo a la API es un cubo compartido. Nunca se usa X-Forwarded-For: Railway no documenta
 * cómo lo trata y el cliente puede declararlo.
 */
export function origenDe(req: Request): string {
  const secreto = process.env.PROXY_SECRETO;
  const dado = req.get('x-praxis-proxy');
  const ip = req.get('x-praxis-ip') ?? '';
  if (
    secreto &&
    dado &&
    timingSafeEqual(huella(dado), huella(secreto)) &&
    isIP(ip)
  )
    return cubo(ip);
  return cubo(req.ip ?? '');
}
