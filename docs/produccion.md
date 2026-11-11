# Praxis · preparación para producción

> Creado el 2026-11-10 (spec `011-cabos-m1-integraciones`). Reúne lo que hace falta para pasar de la
> demostración local a un despliegue con proveedores reales. **Hoy no hay credenciales de ningún proveedor:**
> el código está probado contra sustitutos locales y cada sección dice qué falta comprobar con el real.
>
> El piloto sigue usando solo datos ficticios y pagos en modo de pruebas (constitución, principio VIII).

## 1. Variables de entorno

La API se niega a arrancar en producción si falta una obligatoria (`apps/api/src/seguridad.ts`).

| Variable | Dónde | Obligatoria | Cómo se obtiene |
|---|---|---|---|
| `DATABASE_URL` | API | sí | Railway → Postgres → *Connect*. |
| `WEB_URL` | API y web | sí | URL pública de la web, con `https://`. Se usa en los enlaces del correo y en la comprobación de origen. |
| `API_URL` | web | sí | URL pública de la API en Railway. |
| `PROXY_SECRETO` | API **y** web (mismo valor) | sí, ≥ 32 caracteres | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Ver §2. |
| `RESEND_API_KEY` | API | sí | resend.com → *API Keys*. Sirve una llave «Sending access»; con «Full access» la verificación también comprueba el dominio. |
| `CORREO_REMITENTE` | API | sí | `Praxis <no-responder@tu-dominio>`. El dominio debe estar verificado en Resend (*Domains*: registros DKIM y SPF en el DNS). |
| `S3_BUCKET` | API | sí | Nombre del bucket **privado**. |
| `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | API | sí | R2: *Manage R2 API Tokens* → permiso *Object Read & Write* limitado a ese bucket. AWS: usuario IAM con `s3:GetObject`, `PutObject`, `DeleteObject` sobre el bucket. |
| `S3_ENDPOINT` | API | solo R2 | `https://<id-de-cuenta>.r2.cloudflarestorage.com`. Vacío en AWS. |
| `S3_REGION` | API | AWS | Región del bucket. En R2 se deja vacío (`auto`). |
| `WOMPI_ENV` | API | no | Solo `sandbox`. |
| `WOMPI_PUBLIC_KEY`, `WOMPI_INTEGRITY_SECRET`, `WOMPI_EVENTS_SECRET` | API | no | comercios.wompi.co → *Desarrolladores* → llaves de **pruebas** (`pub_test_`, `test_integrity_`, `test_events_`). Sin ellas, la pantalla de planes muestra los pagos como no conectados. |

No permitidas en producción: `CORREOS_DIR` (bandeja local). `ARCHIVOS_SECRETO` y `ARCHIVOS_DIR` solo aplican
sin `S3_BUCKET`.

## 2. Origen del visitante (proxy)

**Qué pasaba:** detrás de Vercel → Railway, la API veía a todos los visitantes con la misma dirección. El
límite por origen (30 fallos en 15 minutos, 10 registros por hora) habría sido el de toda la plataforma.

**Cómo queda:** la web (`apps/web/src/proxy.ts`) añade a cada petición hacia `/api/*` la IP del visitante
(`x-praxis-ip`) y `PROXY_SECRETO` (`x-praxis-proxy`), y descarta lo que el cliente traiga en esas cabeceras.
La API (`apps/api/src/auth/origen.ts`) solo cree esa IP si el secreto coincide. Sin secreto usa la
dirección del socket. No se confía en `X-Forwarded-For`: Railway no documenta cómo lo trata.

**Supuesto que hay que validar en el primer despliegue:** Vercel sobrescribe `x-forwarded-for` y
`x-real-ip` con la IP real del visitante ([documentación](https://vercel.com/docs/headers/request-headers)).
Fuera de Vercel (por ejemplo `next start` propio) esa cabecera la controla el cliente; en ese caso hay que
poner delante un proxy que la sobrescriba.

Comprobación tras desplegar (con una cuenta ficticia):

1. Desde una red, fallar el ingreso 30 veces con correos distintos. La 31.ª debe responder «Demasiados
   intentos».
2. Desde **otra** red (datos móviles), ingresar con datos correctos: debe entrar.
3. Repetir el paso 1 enviando `X-Forwarded-For: 1.2.3.4` distinto en cada petición
   (`curl -H`): el bloqueo debe llegar igual a la 31.ª.

Si el paso 2 falla, la web no está enviando el secreto: revisar que `PROXY_SECRETO` sea idéntico en Vercel
y en Railway.

Rotar el secreto: cambiarlo en ambos servicios y redesplegar los dos. Durante el intervalo, la API cuenta
a todos contra un solo origen (más estricto, nunca más laxo).

## 3. Límite de intentos

Los contadores viven en la tabla `Intento` de Postgres (migración `20261110120000_intentos`): sobreviven a
reinicios y son comunes a varias instancias de la API. No hace falta Redis ni fijar una sola instancia.

- Una IPv6 cuenta por su /64; `::ffff:a.b.c.d` cuenta como `a.b.c.d`.
- La clave se guarda como SHA-256 **sin sal**: no se leen correos ni IP a simple vista, pero una IPv4 se
  recupera probando todas. Las filas duran como mucho una hora y las vencidas se borran en cada ingreso
  correcto. Si la tabla llegara a copiarse fuera de la base (respaldos exportados, analítica), cambiar a
  HMAC con un secreto propio.

## 4. Verificar los proveedores

```powershell
npm run verificar:proveedores                             # lee apps/api/.env o el entorno
npm run verificar:proveedores -- --correo tu-correo@dominio
```

| Proveedor | Qué comprueba | Qué **no** comprueba |
|---|---|---|
| correo | Llave válida y dominio remitente verificado. Con `--correo`: envía una prueba y mide el tiempo hasta aceptado y hasta entregado (límite 60 s). | Que no caiga en spam. |
| archivos | Con el mismo código de producción: guardar, leer con enlace firmado, **lectura sin firma negada**, copiar y borrar. | Reglas de ciclo de vida o versiones del bucket. |
| pagos | Que las tres llaves sean de pruebas y que el sandbox reconozca la llave pública. Rechaza cualquier otra antes de conectar. | Las llaves de integridad y de eventos: solo se validan con un pago de prueba y su webhook. |

Salida `listo`, `falla: <causa>` o `sin configurar`; código 1 si algo falla. No imprime llaves ni el correo
completo.

**Estado al 2026-11-10** (sin credenciales reales):

| Proveedor | Verificado en local | Pendiente con credenciales |
|---|---|---|
| Resend | Fallo y timeout del proveedor en registro y reenvío (`apps/api/test/auth.e2e-spec.ts`). | `verificar:proveedores -- --correo` y anotar el tiempo de entrega (PM011, SC-005 de M1). |
| S3/R2 | Las seis operaciones contra un almacenamiento compatible real en Docker (`apps/api/test/archivos-s3.e2e-spec.ts`). | `verificar:proveedores` contra el bucket real. |
| Wompi sandbox | Firmas, importes, idempotencia y cupos con respuesta externa sustituida (`apps/api/test/pagos.e2e-spec.ts`). | Un pago de prueba de punta a punta: exige las tres llaves y una URL HTTPS pública para el webhook `<WEB_URL>/api/pagos/eventos`. |

## 5. Residencia de datos y Ley 1581

> **No es asesoría legal.** Es un insumo técnico con fuentes, pendiente de validación por una persona
> responsable antes de usar datos reales. Lo marcado «no verificado» no se pudo confirmar en una fuente
> oficial vigente. Consulta del 2026-11-10.

### Marco

- El artículo 26 de la Ley 1581 de 2012 prohíbe **transferir** datos personales a países sin nivel
  adecuado de protección, salvo autorización expresa e inequívoca del titular y otras excepciones
  ([texto](https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=49981)).
- **Transferencia**: quien recibe es a su vez Responsable. **Transmisión**: un Encargado trata los datos
  por cuenta del Responsable. La transmisión internacional no exige informar al titular ni su
  consentimiento si existe un **contrato de transmisión** que fije alcances, actividades y obligaciones
  del Encargado (Decreto 1377 de 2013, arts. 3, 24 y 25:
  [texto](https://www.alcaldiabogota.gov.co/sisjurMantenimiento/normas/Norma1.jsp?i=53646)).
- Que los proveedores de alojamiento, correo y archivos sean Encargados (y por tanto transmisión) es una
  **inferencia nuestra, no verificada con la SIC**.
- La Circular Externa 005 de 2017 de la SIC lista los países con nivel adecuado e incluye a Estados Unidos
  ([texto](https://normas.cra.gov.co/gestor/docs/circular_superindustria_0005_2017.htm)). **No verificado**
  que la lista siga igual en la Circular Única vigente. Brasil no aparece en esa circular.
- Registro Nacional de Bases de Datos: obligatorio para sociedades y entidades sin ánimo de lucro con
  activos superiores a 100.000 UVT (Decreto 090 de 2018). Valor de la UVT 2026: no verificado.

### Por proveedor

| Proveedor | Datos personales que recibe | Dónde los aloja | Región elegible | DPA |
|---|---|---|---|---|
| Vercel (web) | IP, cabeceras y cookie de sesión en tránsito; registros de acceso. No almacena perfiles. | Funciones en `iad1` (EE. UU.) por defecto. | Sí, incluida São Paulo ([regiones](https://vercel.com/docs/regions)). | [vercel.com/legal/dpa](https://vercel.com/legal/dpa) (planes Pro y Enterprise; Hobby no verificado). |
| Railway (API y Postgres) | **Todo**: cuentas, perfiles, postulaciones, historial. | Región de la cuenta. | EE. UU., Ámsterdam, Singapur; **sin Suramérica** ([regiones](https://docs.railway.com/reference/regions)). | [railway.com/legal/dpa](https://railway.com/legal/dpa), se firma. |
| Cloudflare R2 (archivos) | Hojas de vida, soportes del aval y fotos. | Automática, cerca de quien crea el bucket. | Sugerencias y jurisdicciones EU/US; **sin Suramérica** ([doc](https://developers.cloudflare.com/r2/reference/data-location/)). | [cloudflare.com/cloudflare-customer-dpa](https://www.cloudflare.com/cloudflare-customer-dpa/). |
| AWS S3 (alternativa) | Igual que R2. | La región que se elija. | Sí. Disponibilidad de São Paulo para S3: no verificada. | [DPA de AWS](https://d1.awsstatic.com/legal/aws-gdpr/AWS_GDPR_DPA.pdf). |
| Resend (correo) | Dirección de correo y contenido del mensaje de confirmación (incluye el enlace). | Datos de cuenta, metadatos y registros en EE. UU. | Solo la región de **envío**; no cambia el almacenamiento ([doc](https://resend.com/docs/dashboard/domains/regions)). | [resend.com/legal/dpa](https://resend.com/legal/dpa). |
| Wompi (pagos) | Datos del pagador y de la transacción, que la empresa entrega en el checkout de Wompi. Praxis no guarda datos de tarjeta. | No verificado. | No verificado. | Sin DPA público encontrado; pedirlo. |
| Neon (solo desarrollo) | Ninguno real: datos ficticios. | Por proyecto. | Sí, incluida São Paulo. | No verificado. |

### Antes de usar datos reales

- [ ] Confirmar en sic.gov.co la lista vigente de países con nivel adecuado (EE. UU.).
- [ ] Fijar regiones explícitas y coherentes: Railway, bucket y funciones de Vercel en la misma zona.
- [ ] Aceptar o firmar el DPA de cada proveedor y archivarlo como contrato de transmisión. Evaluar las
      cláusulas modelo de la RIPD adoptadas por la SIC (Circular 003 de 2025, vista en fuente secundaria).
- [ ] Publicar en la política de tratamiento (`/politica-de-datos`) los encargados y los países.
- [ ] Decidir si la autorización del registro debe mencionar la transmisión internacional.
- [ ] Definir el flujo de supresión: anonimizar el historial (constitución, V) y borrar del bucket el CV,
      los soportes y la foto. Plazo legal de respuesta: 15 días hábiles.
- [ ] Comprobar si aplica el RNBD.
- [ ] No cargar datos reales en la base de desarrollo.

## 6. Cobros reales con Wompi

Hoy **no se pueden activar**, a propósito: `WOMPI_ENV` solo admite `sandbox`, las llaves deben llevar
prefijo de pruebas y la consulta de transacciones tiene el destino sandbox fijo en el código
(`apps/api/src/pagos/wompi.ts`).

Para cobrar de verdad hace falta, en este orden:

1. **Enmienda a la constitución.** El principio VIII exige pagos en modo de pruebas mientras Praxis sea
   una demostración académica. Es un cambio mayor: PR que modifique `.specify/memory/constitution.md`,
   aprobado por otro integrante.
2. **Comercio registrado en Wompi:** RUT, cuenta bancaria a nombre del comercio y validación de Wompi.
3. **Llaves de producción** (`pub_prod_`, `prod_integrity_`, `prod_events_`) solo en Railway.
4. **Webhook** de producción apuntando a `https://<web>/api/pagos/eventos`.
5. **Cambio de código**, con su spec: permitir el ambiente de producción en `seguridad.ts`, `wompi.ts` y
   `scripts/demo-api.mts`, y la URL `https://production.wompi.co/v1`. Pruebas primero (principio XIII).
6. Residencia de datos (§5) resuelta: con cobros reales hay datos reales.
7. Definir facturación, devoluciones y soporte: hoy no existen.
