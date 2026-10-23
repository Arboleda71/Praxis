/** No carga .env ni incluye credenciales en los errores. */
export function validarBasePruebas(valor: string | undefined): string {
  const rechazar = () =>
    new Error(
      'Base de pruebas insegura: usa Postgres aislado en 127.0.0.1:55432/praxis_test, sin parámetros.',
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
    url.pathname !== '/praxis_test' ||
    url.search ||
    url.hash
  )
    throw rechazar();
  return valor;
}
export const BASE_PRUEBAS =
  'postgresql://praxis_test:praxis_test@127.0.0.1:55432/praxis_test';
