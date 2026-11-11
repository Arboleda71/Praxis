# Contratos: spec 011

Solo cambian respuestas de error y cabeceras internas. Ningún endpoint nuevo.

## Respuestas 429 de ingreso y registro

`POST /auth/login`, `POST /auth/registro/estudiante`, `POST /auth/registro/empresa`

```json
{ "mensaje": "Demasiados intentos. Espera 15 minutos e inténtalo de nuevo.", "segundos": 900 }
```

- `segundos`: entero ≥ 1, tiempo real restante. Nuevo.
- `mensaje`: los minutos son `ceil(segundos / 60)`; «1 minuto» en singular. Para el registro por origen:
  «Demasiados registros. Espera N minutos e inténtalo de nuevo.»
- `POST /auth/reenviar-confirmacion` ya devolvía `segundos`; no cambia.

## `POST /auth/reenviar-confirmacion`

| Estado | Cuándo | Efecto |
|---|---|---|
| 204 | el proveedor aceptó el correo | los enlaces anteriores dejan de servir |
| 503 `{ mensaje: "No pudimos enviar el correo. Inténtalo de nuevo en un minuto." }` | el proveedor falló o superó 10 s | **el enlace anterior sigue sirviendo, y el nuevo también** por si el proveedor sí lo entregó (nuevo) |
| 429, 409, 401 | sin cambios | |

## `POST /auth/confirmar-correo` (sin cambios; lo que interpreta la web)

| Estado | Web muestra |
|---|---|
| 200 | «Tu correo quedó confirmado» |
| 400, 410 | «Este enlace ya no sirve» + iniciar sesión para pedir otro |
| red caída, 5xx, 429, cuerpo no JSON | «No pudimos conectar. Inténtalo de nuevo.» y el botón sigue disponible |

## Cabeceras internas web → API

Las añade `apps/web/src/proxy.ts` en toda petición que no sea un estático (incluye `/api/*` en cualquier
combinación de mayúsculas), sobrescribiendo lo que traiga el cliente.

| Cabecera | Valor |
|---|---|
| `x-praxis-ip` | IP del visitante según la plataforma de la web |
| `x-praxis-proxy` | `PROXY_SECRETO` |

La API usa `x-praxis-ip` como origen solo si `x-praxis-proxy` coincide (comparación en tiempo constante) y
el valor es una IP válida. En cualquier otro caso usa la dirección del socket. En ambos casos una IPv6 cuenta
por su /64 y `::ffff:a.b.c.d` como `a.b.c.d`.

## Variables de entorno nuevas

| Variable | Dónde | Regla |
|---|---|---|
| `PROXY_SECRETO` | API y web | Mismo valor, ≥ 32 caracteres. Obligatoria en producción (la API no arranca sin ella). |

## Comando `npm run verificar:proveedores`

```text
npm run verificar:proveedores [-- --correo destino@dominio]
```

Salida: una línea por proveedor (`correo`, `archivos`, `pagos`) con `listo`, `falla: <causa>` o
`sin configurar`, y la duración. Código de salida 1 si alguno falla; «sin configurar» no es fallo.
Nunca imprime llaves ni el correo completo del destinatario.
