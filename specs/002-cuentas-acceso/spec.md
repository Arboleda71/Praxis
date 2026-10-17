# Feature Specification: Cuentas y acceso

**Feature Branch**: `002-cuentas-acceso`

**Created**: 2026-10-17

**Status**: Draft

**Input**: User description: "M1 de docs/modulos.md: que estudiantes y empresas creen su cuenta, confirmen el correo e inicien sesión. Restablecer la contraseña queda fuera (feature pendiente)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Estudiante crea su cuenta (Priority: P1)

Una estudiante elige «Soy estudiante», escribe su nombre, correo y contraseña, acepta la política de
tratamiento de datos y crea su cuenta. Praxis le envía un correo para confirmar su dirección.

**Why this priority**: sin cuenta de estudiante no existe ningún recorrido de la muestra.

**Independent Test**: registrarse como estudiante desde el inicio y recibir el correo de confirmación.

**Acceptance Scenarios**:

1. **Given** un visitante en «Crear cuenta», **When** elige «Soy estudiante», **Then** ve el formulario de estudiante.
2. **Given** el formulario completo y la casilla de autorización marcada, **When** envía, **Then** la cuenta se
   crea, la sesión queda iniciada y ve «Revisa tu correo» con la dirección a la que se envió el enlace.
3. **Given** la casilla de autorización sin marcar, **When** envía, **Then** no se crea la cuenta y el error
   dice que debe aceptar la política para continuar.
4. **Given** un correo ya registrado, **When** envía, **Then** ve «Este correo ya tiene una cuenta» con un
   enlace a iniciar sesión.
5. **Given** una contraseña de menos de 10 caracteres o que no coincide con la confirmación, **When** envía,
   **Then** el error aparece junto al campo y dice qué corregir.

---

### User Story 2 - Empresa crea su cuenta con NIT válido (Priority: P1)

Una empresa elige «Soy empresa», escribe razón social, NIT con dígito de verificación, correo y contraseña,
acepta la política y crea su cuenta.

**Why this priority**: sin cuenta de empresa no hay vacantes (M5).

**Independent Test**: registrar una empresa con un NIT válido y comprobar que uno mal digitado se rechaza.

**Acceptance Scenarios**:

1. **Given** un NIT cuyo dígito de verificación no corresponde, **When** envía, **Then** ve «El dígito de
   verificación no corresponde a este NIT. Revísalo en tu RUT.» junto al campo.
2. **Given** un NIT ya registrado, **When** envía, **Then** ve «Ya existe una cuenta para este NIT» y no se crea
   otra (una cuenta por empresa).
3. **Given** datos válidos, **When** envía, **Then** la cuenta se crea, la sesión queda iniciada y ve
   «Revisa tu correo», con el aviso de que debe confirmarlo para publicar vacantes.

---

### User Story 3 - Confirmar el correo (Priority: P1)

Quien se registró abre el enlace del correo y su dirección queda confirmada.

**Why this priority**: la empresa no puede publicar sin correo confirmado (§4.3); es el único correo del MVP.

**Independent Test**: abrir un enlace válido, uno vencido y uno ya usado.

**Acceptance Scenarios**:

1. **Given** un enlace válido, **When** lo abre, **Then** ve «Tu correo quedó confirmado» y un botón para seguir
   (estudiante → Mi perfil; empresa → Perfil de la empresa).
2. **Given** un enlace vencido o inválido, **When** lo abre, **Then** ve «Este enlace ya no sirve» y un botón
   «Enviar un enlace nuevo».
3. **Given** una cuenta sin confirmar con sesión, **When** navega, **Then** ve un aviso «Confirma tu correo»
   con «Reenviar enlace» hasta que lo confirme.

---

### User Story 4 - Iniciar sesión (Priority: P2)

Quien ya tiene cuenta entra con su correo y contraseña y llega a su sección.

**Why this priority**: necesario para volver, pero el registro ya deja la sesión iniciada.

**Independent Test**: entrar con datos correctos, incorrectos y superar el límite de intentos.

**Acceptance Scenarios**:

1. **Given** datos correctos, **When** inicia sesión, **Then** llega a la página que pidió (`next`) o, si no
   pidió ninguna, a su sección (estudiante → Mi perfil; empresa → Mis vacantes).
2. **Given** datos incorrectos, **When** inicia sesión, **Then** ve «Correo o contraseña incorrectos» sin
   revelar cuál de los dos falló ni si el correo existe.
3. **Given** 5 intentos fallidos seguidos para el mismo correo o desde el mismo origen, **When** intenta otra
   vez, **Then** ve «Demasiados intentos. Espera 15 minutos e inténtalo de nuevo.»

### Edge Cases

- Correo con mayúsculas o espacios: se normaliza (minúsculas, sin espacios) antes de comparar.
- NIT escrito con puntos o guion: se aceptan y se ignoran al validar.
- Reenviar el enlace varias veces: como máximo uno por minuto; el enlace anterior deja de servir.
- Abrir el enlace de confirmación sin sesión: confirma igual y ofrece iniciar sesión.
- Doble clic en «Crear cuenta»: solo se crea una cuenta.
- Usuario con sesión que entra a «Crear cuenta» o «Iniciar sesión»: va a su sección.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: «Crear cuenta» MUST dejar elegir entre estudiante y empresa, con una línea de qué puede hacer cada uno.
- **FR-002**: El registro de estudiante MUST pedir nombre completo, correo, contraseña, confirmación de contraseña
  y autorización de tratamiento de datos. Nada más (VIII).
- **FR-003**: El registro de empresa MUST pedir razón social, NIT con dígito de verificación, correo, contraseña,
  confirmación y autorización. Nada más.
- **FR-004**: La casilla de autorización MUST aparecer sin marcar y enlazar a la política de tratamiento de datos.
  Sin marcarla no se crea la cuenta.
- **FR-005**: La contraseña MUST tener al menos 10 caracteres; las reglas se muestran antes de escribir.
- **FR-006**: El NIT MUST validarse con el algoritmo del dígito de verificación de la DIAN. Un NIT ya registrado
  MUST rechazarse.
- **FR-007**: Un correo ya registrado MUST rechazarse con un enlace a iniciar sesión.
- **FR-008**: Al crear la cuenta, el sistema MUST iniciar la sesión y enviar un correo con un enlace de
  confirmación de un solo uso que vence a las 24 horas.
- **FR-009**: El usuario MUST poder pedir un enlace nuevo; como máximo uno por minuto, y el anterior deja de servir.
- **FR-010**: Mientras el correo no esté confirmado, MUST mostrarse el aviso «Confirma tu correo» con «Reenviar
  enlace». La empresa sin correo confirmado no puede publicar (lo aplica M5).
- **FR-011**: Iniciar sesión MUST responder igual ante correo inexistente o contraseña errada.
- **FR-012**: Iniciar sesión y crear cuenta MUST bloquearse 15 minutos tras 5 intentos fallidos seguidos, con un
  mensaje que diga cuánto esperar.
- **FR-013**: Tras iniciar sesión MUST volver a la ruta pedida (`next`, solo rutas internas) o a la sección del rol.
- **FR-014**: Cerrar sesión MUST terminar la sesión en el servidor.
- **FR-015**: La página «Política de tratamiento de datos» MUST explicar qué datos se recogen, para qué, los
  derechos del titular (Ley 1581) y que la muestra usa datos ficticios.
- **FR-016**: Cada error MUST aparecer junto a su campo, decir qué corregir y anunciarse a lectores de pantalla.

### Key Entities

- **Cuenta**: correo (único), contraseña protegida, rol (estudiante o empresa), correo confirmado (sí/no), fecha
  de autorización de datos.
- **Estudiante**: nombre completo; pertenece a una cuenta.
- **Empresa**: razón social y NIT (único); pertenece a una cuenta.
- **Enlace de confirmación**: de un solo uso, con vencimiento; pertenece a una cuenta.
- **Sesión**: identifica la cuenta; termina al cerrar sesión.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un estudiante crea su cuenta en menos de 2 minutos desde el inicio.
- **SC-002**: El 100 % de los NIT con dígito de verificación errado se rechaza.
- **SC-003**: Ningún mensaje de inicio de sesión permite saber si un correo está registrado.
- **SC-004**: El 100 % de las pantallas del módulo pasa la revisión automática de accesibilidad y se completa con teclado.
- **SC-005**: El correo de confirmación llega en menos de 1 minuto.

## Assumptions

- El nombre completo del estudiante se pide al registrarse porque la empresa lo verá al recibir la postulación.
- La política de tratamiento de datos es un texto de la muestra académica, no un documento legal revisado.
- Restablecer la contraseña queda fuera (feature pendiente en `docs/modulos.md`).
- La sesión real reemplaza la sesión simulada de M0; la navegación de M0 no cambia.
- El estudiante sin correo confirmado puede editar su perfil (M3); solo la empresa queda bloqueada para publicar.
