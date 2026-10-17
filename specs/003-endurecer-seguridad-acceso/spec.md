# Feature Specification: Endurecer la seguridad de cuentas y acceso

**Feature Branch**: `003-endurecer-seguridad-acceso`

**Created**: 2026-10-17

**Status**: Draft

**Input**: User description: "Endurecimiento de seguridad de cuentas y acceso (M1). Corregir los problemas de
seguridad encontrados en la revisión del proyecto (17 hallazgos, H1–H17): redirección abierta en `next`, bloqueo
por IP no confiable, carrera en el bloqueo, aciertos que reinician la racha de la IP, confirmación de correo al
abrir la página, registro sin límite, configuración dependiente del entorno, inicio de sesión forzado desde otro
sitio, contador de intentos que crece sin límite, bloqueo dirigido, carreras al confirmar y reenviar, sesiones
vencidas sin limpiar, registro que revela correos y NIT, contraseña sin longitud máxima, cabeceras de seguridad,
correos en logs y cookie `Secure` solo en producción."

## Contexto

M1 (`specs/002-cuentas-acceso`) está implementado. Una revisión encontró 17 problemas que permiten saltarse el
límite de intentos, desviar al usuario a otro sitio o bloquear a muchos usuarios a la vez. Esta feature no agrega
pantallas: corrige el comportamiento de las que ya existen para que cumplan el principio XIV de la constitución.
Cada requisito indica entre paréntesis el hallazgo que resuelve (H1–H17, numerados como en la descripción).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Nadie me desvía a otro sitio al iniciar sesión (Priority: P1)

Una estudiante recibe un enlace a Praxis que, después de iniciar sesión, debería llevarla a una página interna.
Aunque el enlace esté manipulado, al entrar siempre queda dentro de Praxis.

**Why this priority**: es la vía más directa para un phishing creíble: la víctima ve la página real de Praxis,
escribe su contraseña y termina en un sitio falso.

**Independent Test**: iniciar sesión con distintos valores manipulados de la ruta de destino y comprobar que
nunca se sale de Praxis.

**Acceptance Scenarios**:

1. **Given** un enlace de inicio de sesión cuyo destino apunta a otro dominio (incluidas variantes con
   tabuladores, saltos de línea, barras invertidas o caracteres codificados), **When** inicia sesión, **Then**
   llega a la sección de su rol, dentro de Praxis.
2. **Given** un destino interno válido (por ejemplo, una página de su sección), **When** inicia sesión,
   **Then** llega a esa página.

---

### User Story 2 - El límite de intentos no se puede saltar (Priority: P1)

Un atacante intenta adivinar contraseñas. Haga lo que haga (peticiones en paralelo, cambiar la dirección de
origen que declara o usar una cuenta propia para «limpiar» su historial), no consigue más intentos que los
permitidos.

**Why this priority**: es la defensa principal de las cuentas (FR-012 de M1) y hoy se puede esquivar de tres
formas distintas (H2, H3, H4).

**Independent Test**: lanzar intentos en paralelo, con orígenes declarados distintos y alternando con un acierto
en otra cuenta, y contar cuántos se aceptan.

**Acceptance Scenarios**:

1. **Given** una cuenta, **When** llegan 50 intentos fallidos simultáneos contra ella, **Then** como máximo 5 se
   evalúan y el resto recibe «Demasiados intentos. Espera 15 minutos e inténtalo de nuevo.»
2. **Given** un cliente que cambia en cada petición la dirección de origen que declara, **When** acumula fallos,
   **Then** el sistema los cuenta contra su origen real y lo bloquea igual.
3. **Given** un atacante con 4 fallos contra la cuenta de otra persona, **When** inicia sesión con éxito en su
   propia cuenta, **Then** sus fallos contra la otra cuenta y contra su origen se conservan.
4. **Given** un origen con 4 fallos seguidos contra una cuenta, **When** quien es dueño de esa cuenta acierta la
   contraseña, **Then** la racha de esa cuenta se reinicia (comportamiento de M1).

---

### User Story 3 - Un usuario no bloquea a todos (Priority: P1)

Muchos estudiantes usan Praxis desde el mismo wifi de su universidad, y todos los usuarios pasan por la misma
infraestructura de publicación. Que uno se equivoque varias veces no impide entrar a los demás.

**Why this priority**: tal como está desplegado, el sistema podría ver a todos los usuarios como un solo origen
y 5 fallos de cualquiera bloquearían el acceso de todos durante 15 minutos (H2).

**Independent Test**: simular varios usuarios detrás de la misma infraestructura; uno falla 5 veces y los demás
siguen entrando.

**Acceptance Scenarios**:

1. **Given** que el usuario A falla 5 veces con su correo, **When** el usuario B inicia sesión con datos correctos
   desde otra conexión, **Then** B entra.
2. **Given** dos estudiantes detrás de la misma red, **When** uno falla 5 veces con su correo, **Then** el otro
   puede seguir intentando con el suyo hasta alcanzar el límite de origen, que es más alto que el de cuenta.

---

### User Story 4 - El enlace de confirmación funciona aunque mi correo lo revise un antivirus (Priority: P2)

Una empresa recibe el correo de confirmación en una bandeja corporativa que abre todos los enlaces para
revisarlos. Cuando la persona hace clic, su correo todavía se puede confirmar.

**Why this priority**: sin correo confirmado la empresa no puede publicar vacantes; hoy el escáner gasta el
enlace y la persona ve «Este enlace ya no sirve» (H5).

**Independent Test**: abrir el enlace dos veces sin pulsar nada y luego confirmar.

**Acceptance Scenarios**:

1. **Given** un enlace válido, **When** se abre, **Then** ve un botón «Confirmar mi correo» y el correo aún no
   queda confirmado.
2. **Given** esa página abierta, **When** pulsa «Confirmar mi correo», **Then** ve «Tu correo quedó confirmado»
   como en M1.
3. **Given** dos pulsaciones simultáneas con el mismo enlace, **When** se procesan, **Then** solo una confirma;
   la otra ve el resultado ya confirmado sin error (H11).

---

### User Story 5 - Nadie usa Praxis para llenar de correos a otra persona (Priority: P2)

Alguien intenta crear cientos de cuentas con correos ajenos para que Praxis les envíe correos de confirmación.

**Why this priority**: molesta a terceros, agota la cuota de envío y puede hacer que el correo de Praxis termine
en spam (H6, H11).

**Independent Test**: crear cuentas en serie desde un mismo origen y pedir reenvíos en paralelo.

**Acceptance Scenarios**:

1. **Given** un origen que ya creó 10 cuentas en la última hora, **When** intenta crear otra, **Then** ve
   «Demasiados registros. Espera una hora e inténtalo de nuevo.» y no se envía ningún correo.
2. **Given** dos solicitudes simultáneas de «Reenviar enlace», **When** se procesan, **Then** se envía un solo
   correo (límite de M1: uno por minuto).

---

### User Story 6 - Ningún sitio externo me deja conectado en una cuenta ajena (Priority: P2)

Una estudiante visita un sitio malicioso que, sin que lo note, envía un formulario de inicio de sesión a Praxis con
la cuenta del atacante. Praxis rechaza esa petición y ella sigue en su propia cuenta (o sin sesión).

**Why this priority**: lo que la víctima suba después (perfil, CV) quedaría en la cuenta del atacante (H8).

**Independent Test**: enviar inicio de sesión, registro y cierre de sesión desde una página de otro origen.

**Acceptance Scenarios**:

1. **Given** una petición de inicio de sesión, registro, confirmación o cierre de sesión que viene de otro sitio,
   **When** llega, **Then** se rechaza y no cambia la sesión.
2. **Given** la misma acción hecha desde las pantallas de Praxis, **When** llega, **Then** funciona como en M1.

---

### User Story 7 - La plataforma se protege sola en producción (Priority: P3)

El equipo despliega la API. Si falta una configuración de seguridad, la API no arranca en lugar de funcionar de
forma insegura.

**Why this priority**: hoy, si falta una variable, la cookie sale sin `Secure`, los correos no se envían y los
enlaces apuntan a la máquina local, sin que nadie lo note (H7, H17).

**Independent Test**: arrancar la API sin cada variable obligatoria y comprobar que se niega a iniciar con un
mensaje claro.

**Acceptance Scenarios**:

1. **Given** una configuración de producción sin la dirección pública de la web o sin la clave de envío de correo,
   **When** arranca, **Then** se detiene con un mensaje que nombra la variable que falta.
2. **Given** cualquier entorno, **When** se inicia sesión, **Then** la cookie de sesión es `httpOnly`, `Secure` y
   `SameSite`.

### Edge Cases

- Destino de inicio de sesión vacío, relativo (`perfil`), absoluto a Praxis (`https://praxis…/estudiante`) o con
  `..`: solo se aceptan rutas internas que empiecen por una sola `/`; el resto lleva a la sección del rol.
- Petición sin dirección de origen identificable: cuenta en un origen «desconocido» con su propio límite, sin
  mezclarse con los demás.
- Reinicio del servidor: los contadores pueden reiniciarse; se acepta en el piloto (una sola instancia).
- Contraseña de más de 128 caracteres: se rechaza con «Usa como máximo 128 caracteres.» antes de procesarla.
- Una cuenta bloqueada que intenta registrarse de nuevo con el mismo correo: recibe el mensaje de bloqueo, no el
  de correo existente.
- El usuario abre el enlace de confirmación con la sesión de otra cuenta iniciada: confirma la cuenta del enlace y
  no cambia la sesión.

## Requirements *(mandatory)*

### Functional Requirements

**Redirección tras iniciar sesión**

- **FR-001**: Tras iniciar sesión, el sistema MUST llevar al usuario solo a rutas de Praxis. Cualquier destino que
  un navegador pueda interpretar como otro sitio (por caracteres de control, barras invertidas, dobles barras o
  esquemas) MUST descartarse y llevar a la sección del rol. (H1)

**Límite de intentos**

- **FR-002**: El sistema MUST identificar el origen de cada petición con la dirección que entrega la
  infraestructura propia de Praxis, y MUST ignorar la que declara el cliente. (H2)
- **FR-003**: El límite por cuenta (5 fallos seguidos, 15 minutos) MUST mantenerse. El límite por origen MUST ser
  más alto (30 fallos en 15 minutos) para que una red compartida no bloquee a todos sus usuarios. (H2)
- **FR-004**: Un intento MUST contarse antes de evaluarse, de modo que peticiones simultáneas no superen el
  límite. (H3)
- **FR-005**: Un acierto MUST reiniciar solo la racha de la cuenta que acertó. La racha del origen MUST reiniciarse
  solo por vencimiento. (H4)
- **FR-006**: Los contadores de intentos MUST descartar los registros vencidos, para que su tamaño no crezca sin
  límite. (H9)
- **FR-007**: Una cuenta bloqueada por fallos MUST seguir bloqueada 15 minutos para todos los orígenes, incluido
  el de su dueño. El riesgo de bloqueo dirigido (alguien que falla a propósito para impedir que otra persona
  entre) se acepta en el piloto y se revisa al salir de él. (H10)

**Registro y confirmación**

- **FR-008**: Un mismo origen MUST poder crear como máximo 10 cuentas por hora; al superarlo no se crea la cuenta
  ni se envía correo. (H6)
- **FR-009**: Ante un correo o NIT ya registrado, el registro MUST mantener los mensajes de M1 («Este correo ya
  tiene una cuenta», «Ya existe una cuenta para este NIT»). Revelar que existen es una decisión de producto
  aceptada; la protegen el límite de FR-008 y el límite de origen de FR-003, que también cuenta estos rechazos.
  (H13)
- **FR-010**: Abrir el enlace de confirmación MUST NOT confirmar el correo; la confirmación MUST ocurrir solo
  cuando la persona pulsa «Confirmar mi correo». (H5)
- **FR-011**: Un enlace de confirmación MUST usarse una sola vez aunque lleguen dos confirmaciones simultáneas, y
  dos reenvíos simultáneos MUST producir un solo correo. (H11)
- **FR-012**: Si la creación del enlace de confirmación falla, la cuenta MUST NOT quedar creada a medias: o se crea
  todo o no se crea nada.

**Sesión**

- **FR-013**: La cookie de sesión MUST ser `httpOnly`, `Secure` y `SameSite` en todos los entornos. (H17)
- **FR-014**: Las acciones que cambian la sesión o la cuenta (iniciar sesión, registrarse, confirmar, reenviar,
  cerrar sesión) MUST rechazarse si no vienen de las pantallas de Praxis. (H8)
- **FR-015**: Las sesiones vencidas MUST eliminarse y MUST NOT servir para entrar. (H12)

**Configuración, datos y cabeceras**

- **FR-016**: La API MUST negarse a arrancar si falta una configuración obligatoria de seguridad, con un mensaje que
  nombre lo que falta. (H7)
- **FR-017**: La contraseña MUST tener como máximo 128 caracteres. (H14)
- **FR-018**: Las respuestas MUST incluir cabeceras de seguridad estándar y MUST NOT revelar la tecnología del
  servidor. (H15)
- **FR-019**: Ningún log, nombre de archivo ni mensaje de error MUST contener correos, contraseñas ni tokens, en
  ningún entorno. (H16)

### Key Entities

- **Contador de intentos**: por cuenta y por origen; número de fallos, inicio de la ventana y vencimiento.
- **Registro por origen**: cuántas cuentas creó un origen en la última hora.
- **Sesión** (de M1): suma la regla de eliminarse al vencer.
- **Enlace de confirmación** (de M1): suma la regla de uso único atómico.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % de los destinos manipulados de una lista de prueba (al menos 20 variantes conocidas) termina
  dentro de Praxis.
- **SC-002**: Con 50 intentos fallidos simultáneos contra una cuenta, se evalúan como máximo 5.
- **SC-003**: Cambiar la dirección de origen declarada no da ningún intento extra.
- **SC-004**: Cuando un usuario queda bloqueado, el 100 % de los demás usuarios con datos correctos sigue entrando.
- **SC-005**: Un enlace de confirmación abierto por un escáner sigue sirviendo para confirmar.
- **SC-006**: Un mismo origen no puede provocar más de 10 correos de confirmación por hora.
- **SC-007**: El 100 % de las peticiones que cambian la sesión desde otro sitio se rechaza.
- **SC-008**: Ningún log de una ejecución completa de las pruebas contiene un correo, una contraseña o un token.
- **SC-009**: Las pruebas de M1 siguen pasando sin cambios en lo que ve el usuario, salvo la confirmación con botón.

## Assumptions

- El piloto corre en una sola instancia de la API; contadores en memoria con limpieza de vencidos son suficientes.
  Varias instancias exigirían moverlos a la base de datos y queda fuera.
- La infraestructura de publicación entrega la dirección real del cliente en una cabecera propia que el cliente no
  puede falsificar; el plan verificará cuál es en el despliegue real.
- Los navegadores modernos aceptan cookies `Secure` en `http://localhost`, así que exigirlas en desarrollo no rompe
  el trabajo local.
- Las pruebas E2E dejan de simular orígenes distintos con la cabecera del cliente; necesitarán otro mecanismo.
- Los umbrales (30 fallos por origen, 10 registros por hora, 128 caracteres) son valores razonables del piloto y se
  pueden ajustar en el plan.
- Restablecer la contraseña sigue fuera de alcance.
- Depende de M1 (`specs/002-cuentas-acceso`), que ya está implementado.
