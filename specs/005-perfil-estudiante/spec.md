# Feature Specification: Perfil del estudiante

**Feature Branch**: `005-perfil-estudiante`

**Created**: 2026-10-23

**Status**: Draft

**Mockups**: `docs/praxis-mockups.pen`, frame «M3 · Perfil del estudiante» (grupos Ver mi perfil, Editar por
secciones y Archivos) y Componentes › «Selectores de catálogo (M2)».

**Input**: User description: "M3 de docs/modulos.md: Perfil del estudiante. Construir sobre los mockups de
docs/praxis-mockups.pen, frame «M3 · Perfil del estudiante» (grupos Ver mi perfil, Editar por secciones, Archivos)
y los selectores de catálogo de M2 (packages/contracts). Incluye la foto de perfil opcional según la constitución
v3.0.0 (VII y XIV): JPG/PNG ≤ 2 MB, la ven solo el estudiante y las empresas a cuyas vacantes se postuló, nunca
requisito. Perfil mínimo = nivel de formación + programa + CV. Archivos CV y soporte del aval en PDF ≤ 5 MB.
Depende de M1 y M2."

> **Cambio 2026-10-23 (constitución v4.0.0)**: el programa es texto libre (3 a 150 caracteres), no un catálogo, y no
> depende del nivel. Al cambiar el nivel solo se vacía el avance. El perfil mínimo no cambia.

## Contexto

El perfil es lo que se compara con los requisitos de las vacantes (II, III). Lo llena el propio estudiante y lo
puede corregir cuando quiera (rectificación, Ley 1581). M3 no incluye buscar vacantes, ver la elegibilidad ni
postularse: deja el perfil listo y dice con claridad si el **perfil mínimo** (nivel de formación, programa y hoja
de vida) está completo (IV).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Completar el perfil mínimo (Priority: P1)

Laura se acaba de registrar. Al entrar a «Mi perfil» ve una guía con los 3 datos que le faltan para postularse:
nivel de formación, programa y hoja de vida. Elige «Tecnólogo», escribe su programa («Tecnología en análisis y desarrollo de software»), sube su
hoja de vida en PDF y el perfil le dice «Perfil mínimo completo».

**Why this priority**: sin perfil mínimo no hay postulación (IV); es lo que habilita el resto del producto.

**Independent Test**: con una cuenta de estudiante nueva, completar los 3 datos y comprobar que el indicador pasa
de «incompleto» (con lo que falta) a «completo».

**Acceptance Scenarios**:

1. **Given** un estudiante sin datos de perfil, **When** abre «Mi perfil», **Then** ve la guía del perfil mínimo
   con los 3 pasos marcados «Falta» y un botón para empezar por la formación.
2. **Given** un perfil con nivel y programa pero sin hoja de vida, **When** lo ve, **Then** el aviso dice «Perfil
   mínimo incompleto» y nombra lo que falta («hoja de vida»).
3. **Given** los 3 datos completos, **When** ve su perfil, **Then** el aviso dice «Perfil mínimo completo».
4. **Given** el campo de programa, **When** el estudiante escribe el nombre de su programa (texto libre, de 3 a 150
   caracteres), **Then** se guarda tal cual, sin espacios sobrantes; si tiene menos de 3 caracteres, el campo dice
   «Escribe el nombre completo de tu programa.» (constitución v4.0.0).

---

### User Story 2 - Editar el perfil por secciones (Priority: P1)

Laura agrega su institución, su avance académico, desde cuándo está disponible, la jornada y su inglés B1. Cada
sección se guarda por separado y vuelve a su perfil con los cambios.

**Why this priority**: son los datos que la empresa compara con los requisitos deseables (IV); sin ellos la
elegibilidad diría «falta información» en todo.

**Independent Test**: editar cada sección, guardar y comprobar que el perfil muestra los valores nuevos y que los
no completados siguen como «Falta información».

**Acceptance Scenarios**:

1. **Given** la sección Formación, **When** el estudiante elige un avance de otro nivel y guarda, **Then** no se
   guarda y el campo dice «Este avance no corresponde al nivel elegido.»
2. **Given** la sección Disponibilidad e idiomas, **When** agrega el mismo idioma dos veces, **Then** no se guarda y
   la fila repetida dice «Ya agregaste este idioma.»
3. **Given** un campo opcional vacío, **When** se ve el perfil, **Then** aparece «Falta información» con un enlace
   «Completar» que lleva a esa sección.
4. **Given** una sección guardada, **When** termina de guardar, **Then** se confirma con un mensaje y el perfil
   muestra el valor con su nombre del catálogo.
5. **Given** un cambio sin guardar, **When** el estudiante pulsa «Cancelar», **Then** el perfil queda como estaba.

---

### User Story 3 - Subir y reemplazar archivos (Priority: P1)

Laura sube su hoja de vida. Primero eligió un .docx y el sistema le dijo que solo acepta PDF; luego eligió un PDF
escaneado de 7 MB y le dijo que pesa demasiado y cuál es el máximo. Al final sube un PDF de 312 KB, ve la barra de
progreso y después el archivo con «Ver» y «Reemplazar».

**Why this priority**: la hoja de vida es parte del perfil mínimo; el soporte del aval depende del mismo flujo.

**Independent Test**: subir un archivo válido, uno de otro tipo y uno demasiado grande; comprobar el progreso, los
mensajes de rechazo y que «Ver» abre el archivo propio.

**Acceptance Scenarios**:

1. **Given** un archivo que no es PDF, **When** se elige como hoja de vida o soporte, **Then** se rechaza diciendo
   que solo se aceptan PDF.
2. **Given** un PDF de más de 5 MB, **When** se elige, **Then** se rechaza diciendo cuánto pesa y que el máximo es
   5 MB.
3. **Given** un PDF válido, **When** se sube, **Then** se ve el progreso, se puede cancelar y al terminar aparece
   con nombre, tamaño y fecha.
4. **Given** una hoja de vida subida, **When** el estudiante la reemplaza, **Then** queda solo la nueva en su
   perfil.
5. **Given** una hoja de vida subida, **When** se intenta quitarla sin reemplazar, **Then** no es posible: solo se
   reemplaza, porque es parte del perfil mínimo.

---

### User Story 4 - Declarar el aval (Priority: P2)

Laura responde «Sí» a «¿Tienes aval de tu institución?». Su perfil muestra «Aval declarado (sin soporte)» y la
invita a subir el soporte. Cuando lo sube, el rótulo cambia a «Aval declarado (con soporte)».

**Why this priority**: informa a la empresa, pero no bloquea la postulación (IV).

**Independent Test**: marcar Sí sin soporte, luego subir el soporte, luego marcar No; verificar los rótulos.

**Acceptance Scenarios**:

1. **Given** aval «Sí» sin soporte, **When** se ve el perfil, **Then** dice «Aval declarado (sin soporte)» y ofrece
   subir el soporte, sin obligarlo.
2. **Given** aval «Sí» con soporte, **When** se ve el perfil, **Then** dice «Aval declarado (con soporte)».
3. **Given** cualquier estado del aval, **When** se muestra, **Then** nunca dice «verificado» ni «validado» (IX).
4. **Given** aval «Sí» con soporte, **When** el estudiante cambia a «No» y confirma, **Then** el soporte se quita y
   el perfil ya no muestra el rótulo de aval.

---

### User Story 5 - Foto de perfil opcional (Priority: P3)

Laura agrega una foto. Antes de elegirla, el sistema le dice que es opcional y que la verán las empresas a cuyas
vacantes se postule. Sube un JPG de 800 KB y la ve arriba en su perfil; luego decide quitarla y vuelve a aparecer
su inicial.

**Why this priority**: es opcional y no cambia nada de la elegibilidad (VII, constitución v3.0.0).

**Independent Test**: agregar, cambiar y quitar la foto; comprobar que el perfil mínimo y su indicador no cambian
en ningún caso.

**Acceptance Scenarios**:

1. **Given** un perfil sin foto, **When** se ve, **Then** muestra la inicial del nombre y «Agregar foto (opcional)»
   con el aviso de quién la ve.
2. **Given** una imagen JPG o PNG de hasta 2 MB, **When** se sube, **Then** aparece en el encabezado del perfil.
3. **Given** un archivo de otro tipo o de más de 2 MB, **When** se elige, **Then** se rechaza diciendo el motivo y
   el límite.
4. **Given** un perfil con foto, **When** el estudiante la quita, **Then** vuelve la inicial.
5. **Given** cualquier estado de la foto, **When** se calcula el perfil mínimo, **Then** el resultado no cambia.

### Edge Cases

- ~~El programa elegido fue retirado del catálogo~~: ya no aplica; el programa es texto libre (constitución v4.0.0).
  Un avance retirado sí: el perfil lo sigue mostrando y al editar hay que elegir uno vigente.
- El estudiante cambia el nivel de formación: el avance que ya no corresponde al nuevo nivel se vacía en el
  formulario antes de guardar, con un aviso. El programa se conserva (no depende del nivel desde v4.0.0).
- Un estudiante intenta ver o editar el perfil o los archivos de otro: se niega (VI).
- Una empresa o un visitante abren «Mi perfil»: se les niega como en M0 («sin permiso»).
- Se pierde la conexión durante una subida: la subida falla con un mensaje y el archivo anterior se conserva.
- Un archivo dice ser PDF por su nombre pero su contenido no lo es: se rechaza como «no es un PDF».
- La fecha «disponible desde» queda en el pasado con el tiempo: se sigue mostrando; no es un error.
- Doble clic en «Guardar»: se guarda una sola vez (el botón se deshabilita mientras guarda).

## Requirements *(mandatory)*

### Functional Requirements

**Acceso**

- **FR-001**: Solo el estudiante dueño MUST poder ver y editar su perfil y sus archivos. Empresas y visitantes MUST
  recibir «sin permiso». El acceso de empresas al perfil de quien se postuló llega con el módulo de postulación (VI).
- **FR-002**: Los archivos MUST servirse solo a quien tiene permiso y mediante enlaces temporales (XIV).

**Perfil mínimo**

- **FR-003**: El perfil mínimo MUST ser nivel de formación + programa + hoja de vida. El perfil MUST mostrar si está
  completo y, si no, qué falta, por nombre.
- **FR-004**: Ningún otro dato (avance, institución, disponibilidad, jornada, idiomas, aval, foto) MUST afectar el
  perfil mínimo.

**Secciones**

- **FR-005**: Formación: nivel de formación (catálogo), programa (texto libre de 3 a 150 caracteres, sin espacios
  sobrantes, que no depende del nivel; error «Escribe el nombre completo de tu programa.»; constitución v4.0.0),
  institución (texto, opcional, máximo 150 caracteres) y avance académico (catálogo
  según el nivel, opcional).
- **FR-006**: Disponibilidad: «disponible desde» (fecha, opcional, formato día/mes/año) y jornada (catálogo,
  opcional).
- **FR-007**: Idiomas: cero o más idiomas, cada uno una sola vez, con su nivel MCER (catálogos de M2).
- **FR-008**: Aval: «¿Tienes aval de tu institución?» Sí/No (opcional) y, si es Sí, soporte opcional en PDF.
- **FR-009**: Cada sección MUST guardarse por separado y validarse con las mismas reglas en la pantalla y en el
  servidor, con los mensajes de M2 para valores fuera de lista, avance de otro nivel e idioma repetido.
- **FR-010**: Un campo opcional vacío MUST mostrarse como «Falta información» con un enlace a su sección, nunca como
  error (IV).

**Archivos**

- **FR-011**: Hoja de vida y soporte del aval MUST ser PDF de máximo 5 MB; la foto, JPG o PNG de máximo 2 MB. El
  tipo se comprueba por el contenido, no solo por la extensión.
- **FR-012**: Un archivo rechazado MUST decir el motivo (tipo o tamaño) y el límite (X).
- **FR-013**: La subida MUST mostrar progreso y poder cancelarse; si falla, MUST conservarse el archivo anterior.
- **FR-014**: La hoja de vida MUST poder reemplazarse pero no quitarse. El soporte y la foto MUST poder quitarse.
- **FR-015**: Al reemplazar o quitar un archivo, el anterior MUST dejar de estar disponible desde el perfil.

**Aval y foto**

- **FR-016**: El aval MUST rotularse «Aval declarado (con soporte)» o «Aval declarado (sin soporte)»; MUST NOT
  decir «verificado» (IX).
- **FR-017**: La foto MUST ser opcional, MUST NOT contar para el perfil mínimo ni para ninguna comparación (VII), y
  antes de subirla se MUST avisar que la verán las empresas a cuyas vacantes se postule.
- **FR-018**: Sin foto, el perfil y la barra superior MUST mostrar la inicial del nombre.

**Datos**

- **FR-019**: El perfil MUST NOT pedir edad, sexo, estado civil ni otros datos sensibles (VII, VIII).
- **FR-020**: Los logs MUST NOT contener datos del perfil ni nombres de archivos (XIV).

### Key Entities

- **Perfil del estudiante**: uno por cuenta de estudiante. Nivel de formación, programa, institución, avance,
  disponible desde, jornada, aval (sí/no/sin responder), fecha de actualización.
- **Idioma declarado**: idioma + nivel MCER; único por perfil e idioma.
- **Archivo del perfil**: tipo (hoja de vida, soporte del aval, foto), nombre original, tamaño, fecha de subida y
  ubicación privada. Como máximo uno vigente por tipo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un estudiante nuevo completa el perfil mínimo en menos de 3 minutos.
- **SC-002**: El 100 % de los archivos fuera de tipo o tamaño se rechazan con el motivo, tanto en la pantalla como
  en el servidor.
- **SC-003**: El 100 % de los intentos de ver o editar un perfil ajeno se rechazan.
- **SC-004**: Ningún cambio de foto, avance, disponibilidad, idiomas o aval altera el indicador de perfil mínimo.
- **SC-005**: Las pantallas de M3 pasan la revisión automática de accesibilidad sin errores a 360 y 1080 px y se
  usan completas con teclado.

## Assumptions

- La postulación, la copia del perfil al postularse y lo que ve la empresa son de un módulo posterior; M3 solo
  garantiza que el perfil y sus archivos están listos y privados.
- La foto no se muestra en listados de candidatos antes de abrir una postulación; esa regla se aplica en el módulo
  de postulación (mitigación de sesgo, constitución v3.0.0).
- La institución es texto libre: no se compara con requisitos (M2). El programa también es texto libre desde la
  constitución v4.0.0: la empresa lo ve junto a los programas que solicita y revisa la afinidad.
- Elegir «No» en el aval con soporte subido pide confirmación y quita el soporte.
- En desarrollo y pruebas los archivos se guardan en un almacenamiento local equivalente; en producción, en el
  almacenamiento privado que fija la constitución.
- Depende de M1 (sesión de estudiante) y M2 (catálogos y reglas de validación).
