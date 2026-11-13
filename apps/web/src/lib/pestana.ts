export const PESTANA_BLOQUEADA =
  "Tu navegador bloqueó la pestaña nueva. Permite las ventanas emergentes de Praxis e inténtalo de nuevo.";

/**
 * Abre en otra pestaña un enlace que primero hay que pedir a la API (archivos con firma temporal).
 * La pestaña se abre ANTES de esperar la respuesta, mientras dura el clic: abierta después de un `await`, el
 * bloqueador de ventanas emergentes la impide y el botón parece no hacer nada. Si `obtener` falla, cierra la
 * pestaña vacía y relanza el error; si el navegador la bloqueó, lanza PESTANA_BLOQUEADA sin pedir nada.
 */
export async function abrirEnPestana(obtener: () => Promise<string>) {
  const pestana = window.open("", "_blank");
  if (!pestana) throw new Error(PESTANA_BLOQUEADA);
  // Equivale a «noopener»: la página abierta no puede tocar la de Praxis.
  pestana.opener = null;
  try {
    pestana.location.href = await obtener();
  } catch (e) {
    pestana.close();
    throw e;
  }
}
