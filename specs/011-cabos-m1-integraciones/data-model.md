# Data Model: spec 011

## Intento (nuevo)

Contador de intentos de ingreso y de registro. Reemplaza el `Map` en memoria de `apps/api/src/auth/intentos.ts`.

| Campo | Tipo | Regla |
|---|---|---|
| `clave` | texto, PK | `sha256` en hexadecimal de `correo:<correo>`, `ip:<origen>` o `registro:<origen>`. Sin sal: evita leer correos e IP a simple vista, pero una IPv4 se recupera por fuerza bruta. Las filas duran como mucho una hora. |
| `n` | entero | Intentos contados en la ventana vigente. |
| `vence` | fecha y hora | Fin de la ventana. Índice para borrar vencidos. |

Sin relaciones: una clave puede corresponder a un correo que no tiene cuenta.

**Límites y ventanas** (sin cambios respecto a la spec 003; viven en el código, no en la tabla):

| Prefijo | Límite | Ventana | Al llegar al límite |
|---|---|---|---|
| `correo:` | 5 | 15 min | la ventana se reinicia: 15 min desde el último fallo |
| `ip:` | 30 | 15 min | ventana fija desde el primer intento |
| `registro:` | 10 | 1 h | ventana fija |

**Transiciones**

- *Reservar* (ingreso, registro): si alguna clave está en su límite y no venció → bloqueado, no cuenta en
  ninguna. Si no, suma 1 a cada clave; una fila vencida vuelve a `n = 1` con ventana nueva. Una sentencia
  dentro de una transacción que se deshace si alguna clave no se pudo sumar (llegó al límite en vuelo).
- *Fallo* (correo o NIT repetido al registrarse): suma 1 a `ip:` sin comprobar límite.
- *Éxito* (ingreso correcto): borra `correo:`; resta 1 a `ip:` (devuelve la reserva de esta petición); borra
  hasta 1000 filas vencidas saltando las bloqueadas. Tres sentencias sueltas, sin transacción, para no formar
  un ciclo de bloqueos con *Reservar*.
- *Segundos restantes*: mayor `vence - ahora` entre las claves bloqueadas, redondeado hacia arriba.

## EnlaceConfirmacion (sin cambio de esquema)

Regla nueva al reenviar: los enlaces anteriores se marcan usados **después** de que el proveedor acepta el
correo nuevo. Si el envío falla (error o más de 10 s sin respuesta) no se marca ninguno: el proveedor pudo
aceptarlo y tardar en responder, y ese enlace debe servir. El nuevo conserva su `creadoEn`, así que el límite
de un reenvío por minuto sigue aplicando. Tras un fallo puede haber dos enlaces vigentes; el siguiente
reenvío exitoso deja uno.

## Sin persistencia

- **Resultado de verificación** (`scripts/verificar-proveedores.mts`): `{ proveedor, estado: 'listo' |
  'falla' | 'sin configurar', detalle, ms }`. Solo se imprime.
