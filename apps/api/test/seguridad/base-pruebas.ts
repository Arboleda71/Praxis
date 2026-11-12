/**
 * Una base por uso, todas en el Postgres efímero de pruebas: quien corre una cosa no le cambia los datos
 * ni los contadores a otra (antes las tres compartían `praxis_test`).
 */
export type BaseAislada = 'praxis_test' | 'praxis_e2e' | 'praxis_demo';
const urlDe = (base: BaseAislada) =>
  `postgresql://praxis_test:praxis_test@127.0.0.1:55432/${base}`;

/** Integración de la API (Jest). */
export const BASE_PRUEBAS = urlDe('praxis_test');
/** Pruebas de navegador (Playwright). */
export const BASE_E2E = urlDe('praxis_e2e');
/** Demostración local (`npm run demo:*`). */
export const BASE_DEMO = urlDe('praxis_demo');

/** No carga .env ni incluye credenciales en los errores. */
export function validarBasePruebas(
  valor: string | undefined,
  base: BaseAislada = 'praxis_test',
): string {
  const rechazar = () =>
    new Error(
      `Base de pruebas insegura: usa Postgres aislado en 127.0.0.1:55432/${base}, sin parámetros.`,
    );
  if (!valor) throw rechazar();
  let url: URL;
  try {
    url = new URL(valor);
  } catch {
    throw rechazar();
  }
  if (
    !['postgresql:', 'postgres:'].includes(url.protocol) ||
    url.hostname !== '127.0.0.1' ||
    url.port !== '55432' ||
    url.pathname !== `/${base}` ||
    url.search ||
    url.hash
  )
    throw rechazar();
  return valor;
}
