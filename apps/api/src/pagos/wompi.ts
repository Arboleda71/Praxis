import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { eventoWompiSchema, transaccionWompiSchema } from '@praxis/contracts';
import { createHash, timingSafeEqual } from 'node:crypto';

export function configuracionSandbox(env: NodeJS.ProcessEnv = process.env) {
  if (
    env.WOMPI_ENV !== 'sandbox' ||
    !env.WOMPI_PUBLIC_KEY?.startsWith('pub_test_') ||
    !env.WOMPI_INTEGRITY_SECRET?.startsWith('test_integrity_') ||
    !env.WOMPI_EVENTS_SECRET?.startsWith('test_events_')
  )
    throw new ServiceUnavailableException({
      mensaje:
        'Pagos no disponibles: configura WOMPI_ENV=sandbox y las tres llaves de pruebas de Wompi.',
    });
  return {
    publica: env.WOMPI_PUBLIC_KEY,
    integridad: env.WOMPI_INTEGRITY_SECRET,
    eventos: env.WOMPI_EVENTS_SECRET,
  };
}
export const firmarIntegridad = (
  referencia: string,
  centavos: number,
  secreto: string,
) =>
  createHash('sha256')
    .update(`${referencia}${centavos}COP${secreto}`)
    .digest('hex');
export function validarFirmaEvento(datos: unknown, secreto: string) {
  const r = eventoWompiSchema.safeParse(datos);
  if (!r.success) return false;
  const e = r.data;
  let contenido = '';
  for (const propiedad of e.signature.properties) {
    let valor: unknown = e.data;
    for (const campo of propiedad.split('.')) {
      if (
        ['__proto__', 'constructor', 'prototype'].includes(campo) ||
        !valor ||
        typeof valor !== 'object' ||
        !Object.hasOwn(valor, campo)
      )
        return false;
      valor = (valor as Record<string, unknown>)[campo];
    }
    if (typeof valor !== 'string' && typeof valor !== 'number') return false;
    contenido += String(valor);
  }
  const esperada = createHash('sha256')
    .update(`${contenido}${e.timestamp}${secreto}`)
    .digest();
  const dada = Buffer.from(e.signature.checksum, 'hex');
  return dada.length === esperada.length && timingSafeEqual(dada, esperada);
}
@Injectable()
export class WompiClient {
  async consultar(id: string) {
    // Destino fijo: ningún dato ni variable de entorno puede dirigirlo a producción.
    const res = await fetch(
      `https://sandbox.wompi.co/v1/transactions/${encodeURIComponent(id)}`,
      { signal: AbortSignal.timeout(10_000) },
    ).catch(() => null);
    if (!res?.ok)
      throw new ServiceUnavailableException({
        mensaje:
          'No pudimos verificar la transacción en Wompi sandbox. Se reintentará el evento.',
      });
    const datos = await res.json();
    const r = transaccionWompiSchema.safeParse(datos.data);
    if (!r.success)
      throw new ServiceUnavailableException({
        mensaje: 'Wompi sandbox devolvió una transacción no válida.',
      });
    return r.data;
  }
}
