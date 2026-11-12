# Feature Specification: Restablecer la contraseña

**Feature Branch**: `012-restablecer-contrasena`

**Created**: 2026-11-11

**Status**: Implementada y verificada en local (2026-11-11); pendiente de PR

**Input**: User description: "Restablecer la contraseña. Enlace «¿Olvidaste tu contraseña?» en Iniciar sesión. La
página «Olvidé mi contraseña» pide el correo y siempre responde «Si el correo está registrado, te enviamos un
enlace». La página «Nueva contraseña» se abre desde el enlace del correo: pide contraseña y confirmación, y muestra
éxito o «enlace vencido o usado» con «Pedir otro enlace». El enlace sirve una sola vez y dura poco. La respuesta no
revela si el correo existe. Cambiar la contraseña cierra todas las sesiones abiertas. La solicitud tiene límite de
intentos (XIV)." (S1 de `docs/backlog-specs.md`, PM021)

## Contexto

Hoy quien olvida su contraseña pierde la cuenta: no hay administrador que la recupere y una empresa no puede
registrar otra vez su NIT. La feature quedó aplazada el 2026-10-16 porque la constitución solo permitía un correo;
la enmienda v4.1.0 (2026-11-11) admite un segundo correo de cuenta.

Reutiliza lo que M1 y las specs 003 y 011 ya construyeron: tokens guardados solo como hash, límite de intentos en
Postgres, origen real del visitante, envío de correo con sustituto local y reglas de contraseña compartidas.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Recupero mi cuenta si olvidé la contraseña (Priority: P1)

Una estudiante no recuerda su contraseña. Desde Iniciar sesión pide un enlace, lo abre en su correo, escribe una
contraseña nueva y entra con ella.

**Why this priority**: es el propósito de la feature; sin ella la cuenta se pierde.

**Independent Test**: con una cuenta existente, recorrer «¿Olvidaste tu contraseña?» → correo → «Nueva
contraseña» → iniciar sesión con la nueva.

**Acceptance Scenarios**:

1. **Given** la página Iniciar sesión, **When** pulsa «¿Olvidaste tu contraseña?», **Then** llega a un formulario
   que pide solo el correo.
2. **Given** un correo con cuenta, **When** lo envía, **Then** ve «Si el correo está registrado, te enviamos un
   enlace…» y recibe un correo con un enlace que vence en 30 minutos.
3. **Given** el enlace abierto, **When** escribe una contraseña válida dos veces y pulsa «Cambiar contraseña»,
   **Then** ve «Tu contraseña quedó cambiada» con un enlace a Iniciar sesión.
4. **Given** la contraseña cambiada, **When** inicia sesión, **Then** la anterior se rechaza y la nueva entra.
5. **Given** una contraseña que no cumple las reglas de M1 (10 a 128 caracteres, confirmación igual), **When**
   envía, **Then** el error aparece junto al campo y el enlace sigue sirviendo.

---

### User Story 2 - Nadie averigua qué correos tienen cuenta (Priority: P1)

Alguien escribe correos ajenos en «Olvidé mi contraseña». La respuesta es la misma tenga o no cuenta cada correo.

**Why this priority**: es la regla de privacidad que la descripción exige y la más fácil de romper sin notarlo.

**Independent Test**: pedir el enlace para un correo con cuenta y para uno sin cuenta, y comparar las respuestas.

**Acceptance Scenarios**:

1. **Given** un correo sin cuenta, **When** se pide el enlace, **Then** la respuesta y la pantalla son idénticas a
   las de un correo con cuenta, y no se envía ningún correo.
2. **Given** una cuenta que ya recibió un enlace hace menos de un minuto, **When** se pide otro, **Then** la
   respuesta es la misma y no sale un segundo correo.
3. **Given** un fallo del proveedor de correo, **When** se pide el enlace, **Then** la respuesta es la misma.

---

### User Story 3 - Quien tenía mi contraseña anterior queda fuera (Priority: P1)

Una empresa cambia su contraseña porque sospecha que alguien más la conoce. Al cambiarla, todas las sesiones
abiertas se cierran.

**Why this priority**: sin esto, restablecer no saca a un intruso que ya tenía sesión.

**Independent Test**: con una sesión abierta, restablecer la contraseña y comprobar que esa sesión ya no sirve.

**Acceptance Scenarios**:

1. **Given** sesiones abiertas en varios navegadores, **When** se cambia la contraseña, **Then** ninguna sigue
   sirviendo y cambiarla no inicia una sesión nueva.
2. **Given** una cuenta bloqueada por 5 intentos fallidos, **When** su dueño restablece la contraseña, **Then**
   puede entrar de inmediato con la nueva.

---

### User Story 4 - El enlace no se puede reutilizar ni gastar por accidente (Priority: P2)

El enlace llega a una bandeja corporativa cuyo antivirus abre todos los enlaces. Aun así sirve cuando la persona lo
abre; después de usarlo, o al vencer, no sirve más.

**Why this priority**: mismo problema que resolvió la confirmación de correo (spec 003, H5), con un enlace que
además da acceso a la cuenta.

**Independent Test**: abrir el enlace dos veces sin enviar, cambiar la contraseña y volver a intentarlo.

**Acceptance Scenarios**:

1. **Given** un enlace válido, **When** se abre varias veces sin enviar el formulario, **Then** sigue sirviendo.
2. **Given** un enlace ya usado, vencido o inventado, **When** se abre o se envía, **Then** ve «Este enlace ya no
   sirve» con «Pedir otro enlace» y la contraseña no cambia.
3. **Given** dos envíos simultáneos con el mismo enlace, **When** se procesan, **Then** solo uno cambia la
   contraseña.
4. **Given** dos enlaces pedidos para la misma cuenta, **When** se usa el primero, **Then** se rechaza: solo
   sirve el último.

---

### User Story 5 - Nadie usa Praxis para llenar de correos a otra persona (Priority: P2)

**Independent Test**: pedir enlaces en serie desde un mismo origen.

**Acceptance Scenarios**:

1. **Given** un origen que ya hizo 10 solicitudes en la última hora, **When** hace otra, **Then** ve «Demasiados
   intentos. Espera … e inténtalo de nuevo.» y no se envía ningún correo, exista o no la cuenta.
2. **Given** una solicitud que no viene de las pantallas de Praxis, **When** llega, **Then** se rechaza.

### Edge Cases

- Fallo de conexión al pedir el enlace o al cambiar la contraseña: «No pudimos conectar. Inténtalo de nuevo.»; el
  mismo enlace sigue sirviendo.
- Enlace sin token o con un token mal formado: «Este enlace ya no sirve».
- Cuenta con el correo sin confirmar: puede restablecer la contraseña; restablecerla no confirma el correo.
- Quien restablece con una sesión abierta en ese navegador: queda sin sesión, como en los demás.
- Correo escrito con mayúsculas o espacios: se normaliza igual que en el registro y el ingreso.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Iniciar sesión MUST ofrecer el enlace «¿Olvidaste tu contraseña?» hacia una página que pide solo el
  correo.
- **FR-002**: Al pedir el enlace, el sistema MUST enviar a la cuenta de ese correo un enlace de un solo uso que
  vence en 30 minutos.
- **FR-003**: La respuesta al pedir el enlace MUST ser la misma si el correo tiene cuenta, si no la tiene, si ya
  se envió un enlace hace menos de un minuto y si el envío falla.
- **FR-004**: Una cuenta MUST recibir como máximo un correo de restablecimiento por minuto, y dos solicitudes
  simultáneas MUST producir un solo correo.
- **FR-005**: Un mismo origen MUST poder hacer como máximo 10 solicitudes por hora; al superarlo se le dice cuánto
  esperar y no se envía nada.
- **FR-006**: Abrir el enlace MUST NOT gastarlo; solo se gasta al cambiar la contraseña.
- **FR-007**: La contraseña nueva MUST cumplir las mismas reglas que en el registro y confirmarse.
- **FR-008**: Un enlace usado, vencido, reemplazado por otro más reciente o inexistente MUST rechazarse con «Este
  enlace ya no sirve» sin cambiar la contraseña, también ante dos usos simultáneos.
- **FR-009**: Cambiar la contraseña MUST cerrar todas las sesiones de la cuenta y MUST NOT iniciar una nueva.
- **FR-010**: Cambiar la contraseña MUST levantar el bloqueo por intentos fallidos de esa cuenta.
- **FR-011**: El token del enlace MUST guardarse solo como hash, y ningún log ni nombre de archivo MUST contener
  el correo, la contraseña ni el token.
- **FR-012**: Pedir el enlace y cambiar la contraseña MUST rechazarse si no vienen de las pantallas de Praxis.
- **FR-013**: Las pantallas MUST funcionar a 360 px y en escritorio, con teclado y lector de pantalla: el
  resultado recibe el foco y los errores dicen qué corregir.

### Key Entities

- **Enlace de restablecimiento**: pertenece a una cuenta; hash del token, vencimiento y fecha de creación. Existe
  solo mientras sirve: se borra al usarlo, al pedir otro o al vencer.
- **Contador de solicitudes por origen**: mismo contador de intentos de la spec 011, con la regla del registro.

## Success Criteria *(mandatory)*

- **SC-001**: Una persona con cuenta recupera el acceso sin ayuda de nadie, del enlace «¿Olvidaste tu
  contraseña?» al ingreso con la contraseña nueva.
- **SC-002**: Las respuestas para un correo con cuenta y para uno sin cuenta son idénticas en estado y contenido.
- **SC-003**: Tras cambiar la contraseña, el 100 % de las sesiones anteriores deja de servir.
- **SC-004**: Con dos usos simultáneos del mismo enlace, exactamente uno cambia la contraseña.
- **SC-005**: Un mismo origen no provoca más de 10 correos de restablecimiento por hora, ni una cuenta recibe más
  de uno por minuto.
- **SC-006**: Las pantallas nuevas pasan la revisión automática de accesibilidad a 360 y 1080 px.

## Assumptions

- **30 minutos** de vigencia y **10 solicitudes por hora por origen** son valores del piloto; se ajustan en
  `auth.service.ts` e `intentos.ts`.
- La respuesta no revela si el correo existe, pero una cuenta que existe tarda algo más en responder porque se
  espera al envío. Se acepta: el registro ya dice si un correo tiene cuenta (spec 003, FR-009) y el límite por
  origen impide medirlo en serie.
- Restablecer la contraseña no confirma el correo, aunque demuestre acceso a la bandeja: la confirmación sigue
  siendo un paso propio.
- No se avisa por correo «tu contraseña cambió»: sería un tercer correo y exigiría otra enmienda.
- No hay «cambiar contraseña» desde el perfil con la sesión abierta; queda fuera.
- Depende de la enmienda v4.1.0 de la constitución, pendiente de aprobación por otro integrante.
