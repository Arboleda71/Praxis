# Research: spec 011

Fecha de las consultas: 2026-11-10. Lo marcado «no documentado» o «no verificado» no se asume.

## R1. Origen real del cliente detrás de Vercel → Railway

**Decision**: la API no confía en `X-Forwarded-For` ni cambia `trust proxy` (sigue en `false`). La web añade
en `apps/web/src/proxy.ts` dos cabeceras a cada petición hacia `/api/*`: `x-praxis-ip` (IP del visitante) y
`x-praxis-proxy` (secreto compartido `PROXY_SECRETO`). La API usa `x-praxis-ip` solo si el secreto coincide
en tiempo constante y el valor es una IP válida; si no, usa la dirección del socket.

**Rationale**:
- Vercel sobrescribe el `X-Forwarded-For` del cliente y entrega la IP del visitante en `x-forwarded-for` y
  `x-real-ip` al origen de un rewrite externo (https://vercel.com/docs/rewrites,
  https://vercel.com/docs/headers/request-headers).
- Railway solo documenta `X-Real-IP` («client's remote IP»); el trato de `X-Forwarded-For` (sobrescribir o
  anexar, número de saltos) **no está documentado** y las respuestas del foro se contradicen
  (https://docs.railway.com/networking/public-networking/specs-and-limits). Con otro proxy delante,
  `X-Real-IP` es la IP de ese proxy, es decir, la de Vercel.
- Express advierte que un número fijo de saltos es falsificable si la longitud del camino varía
  (https://expressjs.com/en/guide/behind-proxies.html). Aquí varía: por la web o directo a Railway.
- La mitigación que Vercel documenta para proteger el origen es una cabecera secreta comprobada en el
  origen. Los `rewrites` de `next.config` no pueden añadir cabeceras; `proxy.ts` sí
  (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`), y corre antes de
  los rewrites.

**Alternatives considered**:
- `trust proxy = N`: depende de un comportamiento de Railway sin documentar y es falsificable llamando
  directo a la URL pública de Railway.
- Rechazar toda petición sin el secreto: obligaría a que cada `fetch` del servidor de Next y el webhook de
  Wompi lleven excepción o secreto; más superficie por el mismo resultado. Sin secreto, la petición cuenta
  contra la dirección del socket, que es un cubo compartido y por tanto más estricto para quien se salta la
  web.

**Límite conocido**: fuera de Vercel (por ejemplo `next start` propio), `x-forwarded-for` hacia la web lo
controla el cliente. `docs/produccion.md` lo declara y debe validarse en el primer despliegue (una
petición con `X-Forwarded-For` falso no debe cambiar el origen contado).

## R2. Límite de intentos en Postgres

**Decision**: tabla `Intento(clave PK, n, vence)` y una sentencia por reserva:
`INSERT … SELECT … WHERE NOT EXISTS(bloqueadas) ON CONFLICT (clave) DO UPDATE … WHERE vencida OR n < límite
RETURNING`. Bloqueado si devuelve menos filas que claves. El reloj es `now()` de Postgres. La clave se
guarda como `sha256`.

**Rationale**: el bloqueo de fila del `ON CONFLICT` serializa las reservas simultáneas, también entre
instancias, sin transacción explícita ni `SELECT … FOR UPDATE`. Un solo viaje a la base por ingreso. Usar
el reloj de la base evita desfases entre instancias.

**Alternatives considered**: Redis (servicio y dependencia nuevos: contra XII, descartado por el
responsable); `@nestjs/throttler` con almacenamiento propio (dependencia nueva y no modela «racha por
cuenta que se reinicia al acertar»); mantener memoria con una sola instancia (se pierde al reiniciar).

**Carrera residual aceptada**: dos reservas simultáneas que llegan al límite de `correo:` pueden dejar el
contador de `ip:` con una unidad de más para la que perdió. Nunca se evalúan más contraseñas que el límite.

## R3. Resend

**Decision**: `fetch` con `AbortSignal.timeout(10_000)`; cualquier respuesta no 2xx, error de red o
timeout es fallo de envío. Sin `Idempotency-Key` ni reintentos automáticos: quien reintenta es la persona.
La verificación comprueba la llave con `GET /domains`, y con `--correo` envía una prueba y consulta
`GET /emails/{id}` hasta `last_event = delivered`.

**Rationale**: `POST /emails` devuelve `{ id }`; 401 llave inválida, 403 dominio remitente sin verificar,
422 parámetros, 429 cuota (https://resend.com/docs/api-reference/errors). `last_event` admite `queued`,
`sent`, `delivered`, `delivery_delayed`, `bounced`, `failed`, entre otros
(https://resend.com/docs/api-reference/emails/retrieve-email). Límite: 10 peticiones por segundo por equipo.

**Alternatives considered**: SDK `resend` (dependencia nueva para una llamada HTTP); cola de reintentos
(contra XII).

## R4. S3/R2 y sustituto local

**Decision**: `forcePathStyle: true` cuando hay `S3_ENDPOINT` (R2, MinIO); sin endpoint (AWS) se mantiene
el estilo por defecto. Pruebas de integración contra MinIO en `docker-compose.test.yml`; el bucket se crea
en la propia prueba.

**Rationale**: MinIO exige estilo de ruta; R2 lo admite. Sin esto, el código actual nunca habría funcionado
contra un endpoint propio en local. No hace falta variable nueva.

**Alternatives considered**: `aws-sdk-client-mock` (dependencia nueva y no prueba URLs firmadas ni el
rechazo sin firma); LocalStack (más pesado que MinIO para el mismo uso).

## R5. Wompi

**Decision**: sin cambios en el código de pagos. La verificación valida prefijos de pruebas y consulta
`GET https://sandbox.wompi.co/v1/merchants/{llave_pública}`. La salida a producción se documenta.

**Rationale**: principio VIII y decisión del responsable (2026-11-10). El destino sandbox está fijo en el
código a propósito.

## R6. Residencia de datos (Ley 1581) — insumo técnico, no asesoría legal

**Decision**: documentar en `docs/produccion.md` por proveedor: datos, ubicación, figura legal y acción.
Todo queda marcado «pendiente de validación por una persona responsable».

**Hallazgos** (con fuente):
- El art. 26 prohíbe transferir a países sin nivel adecuado, salvo autorización expresa del titular y otras
  excepciones (https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=49981).
- **Transmisión** (a un Encargado que trata por cuenta del Responsable) no exige consentimiento adicional
  si hay contrato de transmisión con el contenido del art. 25 del Decreto 1377 de 2013
  (https://www.alcaldiabogota.gov.co/sisjurMantenimiento/normas/Norma1.jsp?i=53646). Que hosting, correo y
  almacenamiento sean Encargados es inferencia propia, no verificada con la SIC.
- La Circular Externa 005 de 2017 de la SIC incluye a Estados Unidos entre los países con nivel adecuado
  (https://normas.cra.gov.co/gestor/docs/circular_superindustria_0005_2017.htm). **No verificado** que siga
  vigente en la Circular Única actual. Brasil no aparece en esa lista.
- Ubicaciones: Vercel (funciones en `iad1` por defecto, región elegible), Railway (EE. UU., Ámsterdam,
  Singapur; sin Suramérica), R2 (sin Suramérica; jurisdicciones EU/US), Resend (cuenta, metadatos y logs en
  EE. UU.), Neon (región por proyecto). Wompi: no verificado. URLs de DPA en `docs/produccion.md`.
- RNBD: obligatorio sobre 100.000 UVT de activos (Decreto 090 de 2018); valor de la UVT 2026 no verificado.

**Alternatives considered**: mover todo a una región suramericana (Railway y R2 no la ofrecen; São Paulo no
está en la lista de la Circular 005) — no mejora la situación legal.

## R7. Medición (PM011)

**Decision**: medir en la prueba E2E el recorrido de registro y el tiempo hasta que el correo queda
entregado al sustituto local; registrar el resultado en `specs/002-cuentas-acceso/estado.md`. El dato con
Resend real lo produce `verificar:proveedores -- --correo` y queda pendiente de credenciales.
