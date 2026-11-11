# Feature Specification: Cabos sueltos de M1 e integraciones listas para producción

**Feature Branch**: `011-cabos-m1-integraciones`

**Created**: 2026-11-10

**Status**: Draft

**Input**: User description: "Cerrar cabos sueltos de M1 y dejar listas las integraciones externas para
producción. (A) Cabos M1: PM005, PM006, PM008, PM009, PM011. (B) Integraciones: correo, archivos privados,
pagos solo en modo de pruebas, límite de intentos persistente (PM019), dirección real del cliente detrás del
proxy de despliegue y residencia de datos (Ley 1581). Sin credenciales reales disponibles: todo se prueba
contra sustitutos locales y se entrega un comando de verificación real. No se agrega ningún correo nuevo ni
se cambia la constitución."

## Contexto

El recorrido del MVP está implementado y probado en local (`docs/mvp-entrega.md`). Quedan dos grupos de
pendientes en `docs/pendientes-mvp.md`:

- **Bloque B (hallazgos de M1):** S3, S4, R1, R2 y P5 de `specs/002-cuentas-acceso/estado.md`. Parte del
  comportamiento ya existe en el código, pero ningún caso de fallo está cubierto por pruebas y hay huecos.
- **Bloque E (producción):** los proveedores externos nunca se ejercitaron, el límite de intentos vive en la
  memoria de un solo proceso y la dirección del cliente no se resuelve detrás de la infraestructura de
  publicación.

Esta feature no agrega pantallas ni correos. Cada requisito indica entre paréntesis el pendiente que cierra.

**Decisiones del responsable del producto (2026-11-10):**

1. Hoy no hay credenciales de ningún proveedor. Todo se verifica contra sustitutos locales y se entrega un
   comando de verificación real para ejecutar cuando existan.
2. Los pagos siguen solo en modo de pruebas (principio VIII). La salida a cobros reales se documenta como
   lista de requisitos; no se habilita.
3. El límite de intentos se guarda en la base de datos del sistema, sin servicios nuevos (principio XII).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Un usuario no bloquea a todos, tampoco en producción (Priority: P1)

Praxis se publica detrás de una infraestructura intermedia. Cada persona se cuenta por su propia conexión, y
los intentos acumulados no se pierden cuando la API se reinicia ni se multiplican si hay varias copias de la
API atendiendo.

**Why this priority**: tal como está, en producción todos los usuarios llegarían con la misma dirección de
origen: 30 fallos de cualquiera bloquearían el ingreso de todos, y 10 registros por hora serían el tope de
toda la plataforma. Además, un reinicio borra los bloqueos vigentes.

**Independent Test**: simular dos clientes detrás de la misma infraestructura, agotar el límite de uno y
comprobar que el otro entra; reiniciar la API y comprobar que el bloqueo sigue; repetir con dos copias de la
API sobre la misma base.

**Acceptance Scenarios**:

1. **Given** la API detrás de la infraestructura de publicación, **When** dos personas con conexiones
   distintas inician sesión, **Then** el sistema las cuenta como orígenes distintos.
2. **Given** un cliente que declara una dirección de origen inventada, **When** acumula fallos, **Then** se
   cuentan contra su conexión real.
3. **Given** una cuenta bloqueada por 5 fallos, **When** la API se reinicia, **Then** la cuenta sigue
   bloqueada hasta cumplir los 15 minutos.
4. **Given** dos copias de la API sobre la misma base, **When** llegan 50 intentos fallidos simultáneos
   repartidos entre ambas contra una cuenta, **Then** se evalúan como máximo 5.
5. **Given** una petición que llega directamente a la API sin pasar por la web de Praxis, **When** declara
   una dirección de origen, **Then** esa declaración no le da intentos extra.

---

### User Story 2 - Sé si de verdad cerré sesión (Priority: P1)

Una estudiante en un computador compartido pulsa «Cerrar sesión». Si Praxis no pudo cerrarla, se lo dice y
ella sigue viendo que está dentro; nunca queda creyendo que salió mientras su sesión sigue abierta.

**Why this priority**: en un equipo compartido, una sesión que parece cerrada y no lo está expone el perfil
y el CV a la siguiente persona (S3).

**Independent Test**: provocar un fallo de la API al cerrar sesión y comprobar el aviso, que la sesión sigue
visible y que un segundo intento con la API disponible sí cierra.

**Acceptance Scenarios**:

1. **Given** una sesión abierta y la API sin responder, **When** pulsa «Cerrar sesión», **Then** ve «No
   pudimos cerrar tu sesión. Inténtalo de nuevo.», el aviso se anuncia a lectores de pantalla y sigue dentro.
2. **Given** ese aviso, **When** la API vuelve y pulsa otra vez, **Then** sale y la sesión ya no sirve.
3. **Given** una sesión que la API ya no reconoce (vencida o cerrada desde otro lugar), **When** pulsa
   «Cerrar sesión», **Then** sale sin error.

---

### User Story 3 - El formulario de ingreso vuelve solo (Priority: P2)

Tras demasiados intentos, la persona ve cuánto falta y, al cumplirse el tiempo, el formulario vuelve a
funcionar sin recargar la página.

**Why this priority**: hoy la espera se calcula como 15 minutos desde que se ve el aviso, no desde que empezó
el bloqueo; si recarga o llega a mitad del bloqueo, el formulario queda apagado más de la cuenta (R2).

**Independent Test**: bloquear una cuenta, adelantar el reloj y comprobar que el botón se habilita solo y el
siguiente intento correcto entra.

**Acceptance Scenarios**:

1. **Given** una cuenta bloqueada a la que le quedan N segundos, **When** intenta ingresar, **Then** el aviso
   dice cuánto falta (en minutos) y el botón queda deshabilitado exactamente ese tiempo.
2. **Given** el aviso de bloqueo visible, **When** termina el tiempo, **Then** el aviso desaparece, el botón
   se habilita sin recargar y el cambio se anuncia a lectores de pantalla.
3. **Given** el registro bloqueado por demasiados registros o intentos, **When** la persona lo intenta,
   **Then** recibe el mismo dato de tiempo restante.

---

### User Story 4 - Entiendo por qué no pude confirmar mi correo (Priority: P2)

Una empresa abre el enlace de confirmación desde otro dispositivo, sin sesión. Si falla, sabe si fue la
conexión (puede reintentar con el mismo enlace) o si el enlace ya no sirve (debe pedir otro).

**Why this priority**: sin correo confirmado la empresa no publica. Decirle «el enlace ya no sirve» cuando
solo se cayó la conexión la manda a pedir otro enlace sin necesidad (R1).

**Independent Test**: abrir el enlace sin sesión con la API caída, con la API disponible y con un enlace
vencido; comparar los tres mensajes.

**Acceptance Scenarios**:

1. **Given** un enlace vigente y sin sesión, **When** pulsa «Confirmar mi correo» y no hay conexión,
   **Then** ve «No pudimos conectar. Inténtalo de nuevo.», el botón sigue disponible y el enlace sigue
   sirviendo.
2. **Given** un enlace vencido, usado o inexistente, **When** lo abre, **Then** ve «Este enlace ya no sirve»
   y la opción de iniciar sesión para pedir otro.
3. **Given** que la página no pudo comprobar el enlace al abrirse, **When** se muestra, **Then** no afirma
   que el enlace esté vencido: ofrece confirmar y el resultado real lo decide el intento.
4. **Given** un enlace vigente y sin sesión, **When** confirma con éxito, **Then** ve «Tu correo quedó
   confirmado» y un enlace para iniciar sesión; no se abre ninguna sesión.

---

### User Story 5 - Si el correo no sale, me lo dicen y sigo usando mi cuenta (Priority: P2)

El proveedor de correo falla o tarda demasiado. Al registrarse, la cuenta queda creada y la persona puede
pedir el enlace después. Al reenviar, ve un mensaje claro y puede reintentar.

**Why this priority**: el correo depende de un tercero; su caída no puede dejar cuentas inservibles ni
pantallas colgadas (S4).

**Independent Test**: sustituir el proveedor por uno que falla y por uno que no responde; registrar y
reenviar en cada caso.

**Acceptance Scenarios**:

1. **Given** el proveedor de correo caído, **When** alguien se registra, **Then** la cuenta se crea, queda
   con sesión abierta y puede pedir el enlace más tarde.
2. **Given** el proveedor caído, **When** pulsa «Reenviar enlace», **Then** ve «No pudimos enviar el correo.
   Inténtalo de nuevo en un minuto.», la cuenta sigue usable y el siguiente reenvío funciona al volver el
   proveedor.
3. **Given** un proveedor que no responde, **When** se envía un correo, **Then** la espera se corta en un
   tiempo acotado y se trata como fallo.
4. **Given** un reenvío fallido, **When** se revisan los enlaces de la cuenta, **Then** el enlace que la
   persona ya tenía en su bandeja sigue sirviendo.

---

### User Story 6 - Los archivos privados funcionan en el almacenamiento real (Priority: P2)

El CV, los soportes y la foto se guardan en un almacenamiento privado externo y solo se abren con enlaces
temporales, igual que en local.

**Why this priority**: es el camino obligatorio en producción (principio XIV) y nunca se ejecutó contra un
almacenamiento de verdad.

**Independent Test**: correr las operaciones de archivos contra un almacenamiento compatible levantado en
local.

**Acceptance Scenarios**:

1. **Given** un almacenamiento privado, **When** se guarda un archivo y se pide su enlace, **Then** el
   enlace entrega el mismo contenido y deja de servir a los 5 minutos.
2. **Given** un archivo guardado, **When** se pide sin enlace firmado, **Then** el almacenamiento lo niega.
3. **Given** una postulación, **When** se copia el CV y luego el estudiante lo reemplaza, **Then** la copia
   de la postulación conserva el contenido original.
4. **Given** un archivo borrado, **When** se pide su enlace, **Then** no entrega contenido.

---

### User Story 7 - El equipo puede comprobar cada proveedor antes de publicar (Priority: P3)

Quien despliega ejecuta un comando que prueba correo, archivos y pagos con las credenciales configuradas y
dice, proveedor por proveedor, si está listo, sin mostrar ningún secreto.

**Why this priority**: hoy no hay credenciales; cuando existan, hace falta comprobarlas en minutos y sin
improvisar. También cierra la medición pendiente de entrega de correo (P5).

**Independent Test**: ejecutar el comando sin credenciales (todo «sin configurar»), contra los sustitutos
locales (todo «listo») y con una credencial inválida (ese proveedor «falla» con la causa).

**Acceptance Scenarios**:

1. **Given** ninguna credencial, **When** se ejecuta la verificación, **Then** cada proveedor aparece como
   «sin configurar» y el comando no intenta ninguna conexión externa.
2. **Given** credenciales válidas de correo y un destinatario indicado, **When** se ejecuta, **Then** envía
   un correo de prueba e informa el tiempo hasta que el proveedor lo aceptó y, si el proveedor lo informa,
   hasta la entrega.
3. **Given** llaves de pagos que no son de pruebas, **When** se ejecuta, **Then** se rechazan antes de
   cualquier conexión.
4. **Given** cualquier resultado, **When** se lee la salida, **Then** no contiene llaves, tokens ni correos
   completos.

---

### User Story 8 - Sabemos dónde vive cada dato antes de usar datos reales (Priority: P3)

El equipo tiene un documento que dice, por proveedor, qué datos personales recibe, en qué país se guardan y
qué exige la Ley 1581 para esa transferencia, y una lista de lo que falta para cobrar de verdad.

**Why this priority**: es condición para salir del piloto, no para la demostración con datos ficticios.

**Independent Test**: revisar que cada proveedor de la constitución aparece con datos, ubicación, base legal
y acción pendiente, y que el documento distingue lo verificado de lo que debe validar una persona.

**Acceptance Scenarios**:

1. **Given** el documento, **When** se busca un proveedor del stack, **Then** aparece con los datos
   personales que recibe, dónde los aloja y qué requisito de transferencia aplica.
2. **Given** el documento, **When** se lee la salida a cobros reales, **Then** lista los requisitos y la
   enmienda de constitución que haría falta.
3. **Given** una afirmación legal, **When** se lee, **Then** cita su fuente y queda marcada como pendiente
   de validación por una persona responsable.

### Edge Cases

- La infraestructura no entrega dirección de origen: la petición cuenta en un origen «desconocido» con su
  propio límite (regla de la spec 003), sin mezclarse.
- La base de datos falla al contar un intento: el ingreso se rechaza con el mensaje genérico de error; nunca
  se evalúa una contraseña sin haber contado el intento.
- El reloj del navegador no coincide con el del servidor: la cuenta regresiva usa la duración restante que
  envía el servidor, no una hora absoluta.
- La pestaña queda en segundo plano o el equipo se suspende durante el bloqueo: al volver, el formulario
  refleja el tiempo real transcurrido.
- El usuario cierra sesión dos veces seguidas o desde dos pestañas: la segunda vez sale sin error.
- El proveedor de correo responde con error de cuota o de remitente no verificado: se trata como fallo de
  envío; el detalle va al registro interno sin datos personales.
- El almacenamiento responde con error al guardar: el perfil no queda apuntando a un archivo inexistente.
- Los contadores vencidos se eliminan; la tabla no crece sin límite.
- Confirmar con un enlace válido mientras hay otra cuenta en sesión: confirma la cuenta del enlace y no
  cambia la sesión (regla de la spec 003).

## Requirements *(mandatory)*

### Functional Requirements

**Origen de la petición y límite de intentos**

- **FR-001**: El sistema MUST identificar el origen de cada petición con la dirección que entrega la
  infraestructura propia de Praxis y MUST ignorar la que declare el cliente, también cuando la petición llega
  a la API sin pasar por la web. (proxy/IP)
- **FR-002**: La confianza en el intermediario MUST ser una configuración explícita del despliegue (un
  secreto compartido entre la web y la API); sin configurarla, el sistema MUST NOT confiar en ninguna
  cabecera de origen. Una misma persona MUST contar como un solo origen aunque cambie de dirección dentro de
  su bloque IPv6 (/64). (proxy/IP)
- **FR-003**: Los contadores de intentos de ingreso y de registro MUST conservarse entre reinicios y MUST
  ser comunes a todas las copias de la API. (PM019)
- **FR-004**: Los límites vigentes MUST mantenerse sin cambios: 5 fallos seguidos por cuenta y 30 por origen
  en 15 minutos; 10 registros por origen por hora; un acierto reinicia solo la racha de la cuenta. (PM019)
- **FR-005**: Un intento MUST contarse de forma atómica antes de evaluarse, de modo que peticiones
  simultáneas, incluso en copias distintas de la API, no superen el límite. (PM019)
- **FR-006**: Los contadores vencidos MUST eliminarse. (PM019)
- **FR-007**: Las respuestas de bloqueo MUST informar cuántos segundos faltan para poder reintentar. (PM009)

**Sesión e ingreso**

- **FR-008**: Si el cierre de sesión no se confirma en el servidor, la web MUST avisarlo con un mensaje
  anunciado a tecnologías de asistencia, MUST conservar la sesión visible y MUST permitir reintentar. (PM005)
- **FR-009**: Cerrar una sesión que el servidor ya no reconoce MUST completarse sin error. (PM005)
- **FR-010**: El formulario de ingreso MUST mostrar el tiempo restante del bloqueo y MUST reactivarse solo
  al cumplirse, sin recargar, anunciando el cambio. (PM009)

**Confirmación de correo**

- **FR-011**: La pantalla de confirmación MUST distinguir tres resultados: confirmado, enlace que ya no
  sirve y fallo de conexión o del servidor; solo el segundo invita a pedir otro enlace. (PM008)
- **FR-012**: Un fallo de conexión o del servidor al confirmar MUST NOT gastar el enlace. (PM008)
- **FR-013**: Tras confirmar, la pantalla MUST llevar a la sección del rol, que sin sesión abierta pasa
  primero por iniciar sesión; MUST NOT abrir una sesión por el solo hecho de tener el enlace. (PM008)

**Correo**

- **FR-014**: El envío de correo MUST tener un tiempo máximo de espera; superarlo se trata como fallo.
  (PM006, PM018)
- **FR-015**: Si el envío falla al registrarse, la cuenta MUST quedar creada y usable; si falla al reenviar,
  la persona MUST ver un mensaje claro y poder reintentar. (PM006)
- **FR-016**: Un reenvío cuyo envío falla MUST NOT invalidar el enlace anterior ni el nuevo: el proveedor
  pudo aceptarlo aunque su respuesta no llegara. (PM006)
- **FR-017**: El único correo que envía el sistema MUST seguir siendo la confirmación de cuenta. (constitución)

**Archivos**

- **FR-018**: Guardar, copiar, borrar y enlazar archivos MUST comportarse igual en el almacenamiento externo
  que en el local, verificado contra un almacenamiento compatible. (S3/R2)
- **FR-019**: Los archivos MUST NOT ser legibles sin un enlace firmado vigente; los enlaces vencen a los 5
  minutos. (principio XIV)

**Pagos**

- **FR-020**: El sistema MUST seguir rechazando cualquier llave o ambiente de pagos que no sea de pruebas.
  (principio VIII)

**Verificación y documentación**

- **FR-021**: MUST existir un comando que compruebe correo, archivos y pagos con la configuración presente
  e informe por proveedor «listo», «falla» (con causa) o «sin configurar». (PM011, PM018)
- **FR-022**: Ese comando MUST NOT mostrar ni guardar secretos ni datos personales, y MUST NOT ejecutarse
  contra pagos reales. (principio XIV)
- **FR-023**: MUST medirse el registro completo y el tiempo de envío del correo, y dejar el resultado
  registrado; la medición con el proveedor real queda pendiente de credenciales y así se declara. (PM011)
- **FR-024**: MUST existir un documento de residencia de datos por proveedor (datos, ubicación, requisito de
  la Ley 1581, acción pendiente) con sus fuentes, marcado como pendiente de validación humana. (PM020)
- **FR-025**: MUST existir la lista de requisitos para cobros reales, incluida la enmienda que exigiría.
  (PM020)
- **FR-026**: La documentación de configuración MUST nombrar todas las variables de producción y cómo
  obtener cada credencial. (PM018)

### Key Entities

- **Contador de intentos**: clave (cuenta, origen o registro por origen), número de intentos y vencimiento.
  Pasa de la memoria del proceso a la base de datos; no guarda contraseñas ni tokens.
- **Enlace de confirmación** (de M1): suma la regla de no invalidarse cuando el envío del reemplazo falla.
- **Resultado de verificación**: por proveedor, estado y duración; no se persiste.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Con un usuario bloqueado, el 100 % de los demás usuarios con datos correctos sigue entrando
  cuando todos pasan por la misma infraestructura de publicación.
- **SC-002**: Declarar una dirección de origen falsa no da ningún intento extra, pase o no por la web.
- **SC-003**: Tras reiniciar la API, el 100 % de los bloqueos vigentes sigue activo.
- **SC-004**: Con 50 intentos simultáneos repartidos entre dos copias de la API, se evalúan como máximo 5.
- **SC-005**: Ante un fallo al cerrar sesión, el 100 % de los casos muestra el aviso y ninguna pantalla
  indica que la persona salió.
- **SC-006**: El formulario de ingreso se reactiva a no más de 2 segundos del fin real del bloqueo, sin
  recargar.
- **SC-007**: Los tres resultados de la confirmación (confirmado, enlace que no sirve, fallo de conexión)
  muestran mensajes distintos.
- **SC-008**: Con el proveedor de correo caído, el 100 % de los registros crea una cuenta usable y ningún
  envío espera más de 10 segundos.
- **SC-009**: Las operaciones de archivos pasan contra el almacenamiento compatible y ningún archivo se
  obtiene sin enlace firmado vigente.
- **SC-010**: Una persona completa el registro en menos de 2 minutos y el correo queda aceptado para envío
  en menos de 1 minuto (medido en local; el dato real se completa con credenciales).
- **SC-011**: La verificación sin credenciales termina en menos de 5 segundos y su salida no contiene
  ningún secreto.
- **SC-012**: Todas las pruebas existentes siguen pasando; lo único que cambia para el usuario es ver el
  tiempo restante del bloqueo.

## Assumptions

- La web se publica en Vercel y la API en Railway (constitución); el número exacto de intermediarios se
  fija por configuración y se valida en el primer despliegue.
- La API solo recibe tráfico legítimo a través de la web de Praxis, salvo el aviso de pagos, que llega
  directo del proveedor. Cómo impedir que una petición directa falsifique el origen se define en el plan.
- Guardar los contadores en la base agrega una operación por intento de ingreso; se acepta mientras la meta
  de 500 ms (p95) se cumpla, y se mide.
- No hay credenciales reales: el almacenamiento compatible corre en un contenedor local y los proveedores
  de correo y pagos se sustituyen por servidores de prueba locales.
- El documento de residencia de datos no es asesoría legal; lo valida una persona antes de usar datos reales.
- Restablecer la contraseña, el módulo Administrador y cualquier correo nuevo siguen fuera de alcance.
- PM010 (revisión manual con lector de pantalla), PM013 (protección de `main`) y PM016/PM017 (gobernanza)
  no entran: dependen de personas.
- Depende de las specs 002, 003, 005 y 009, ya implementadas.
