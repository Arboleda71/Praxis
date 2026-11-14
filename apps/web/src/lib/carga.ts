"use client";
import { useEffect, useEffectEvent, useState } from "react";
import { solicitar } from "./mercado";

/**
 * Pide `ruta` al montar, cuando cambia y cada vez que se llama a `recargar`. Una respuesta que llega tras
 * desmontar o tras pedir otra cosa se descarta: no debe pisar los datos más nuevos. Al cargar con éxito se
 * quita el error, porque los datos ya son los actuales; si la carga falla se quitan los datos, porque ya no
 * corresponden a lo pedido (otra página, otra recarga) y no deben quedar bajo el aviso como si lo fueran.
 *
 * `aceptar` permite reaccionar a la respuesta antes de guardarla; si devuelve `false` se descarta (p. ej. la
 * página pedida quedó fuera de rango y el componente ya pidió otra).
 *
 * `recargar` vuelve a pedir y quita el error: sirve para «Reintentar» y para refrescar tras una acción.
 * Se devuelven `setDatos` y `setError` porque los componentes también los cambian desde sus acciones
 * (guardar, vaciar los datos viejos antes de recargar).
 */
export function useCarga<T>(ruta: string, aceptar?: (datos: T) => boolean, metodo = "GET") {
  const [datos, setDatos] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);
  // Evento de efecto: `aceptar` cambia en cada render y no debe volver a disparar la petición.
  const alLlegar = useEffectEvent((d: T) => {
    if (aceptar && !aceptar(d)) return;
    setDatos(d);
    setError("");
  });
  useEffect(() => {
    let vigente = true;
    void solicitar<T>(ruta, metodo).then(
      (d) => {
        if (vigente) alLlegar(d);
      },
      (e: Error) => {
        if (!vigente) return;
        setDatos(null);
        setError(e.message);
      },
    );
    return () => {
      vigente = false;
    };
  }, [ruta, intento, metodo]);
  function recargar() {
    setError("");
    setIntento((n) => n + 1);
  }
  return { datos, setDatos, error, setError, recargar };
}
