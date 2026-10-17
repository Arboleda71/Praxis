# Feature Specification: Estructura y navegación

**Feature Branch**: `001-estructura-navegacion`

**Created**: 2026-10-15

**Status**: Draft

**Input**: User description: "M0 de docs/modulos.md: esqueleto común del sitio (cabecera pública y por rol, inicio mínimo, páginas 404 y sin permiso) para que todos los módulos compartan layout, mobile first y escritorio."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visitante entiende qué es Praxis y encuentra cómo entrar (Priority: P1)

Una persona llega a Praxis sin sesión. En la página de inicio entiende en pocos segundos que es un portal de
prácticas profesionales (no de empleo) y encuentra cómo crear una cuenta como estudiante o como empresa, o
cómo iniciar sesión.

**Why this priority**: es la puerta de entrada de toda la muestra; sin ella no se llega a ningún otro módulo.

**Independent Test**: abrir la página de inicio a 360 px y en escritorio, sin sesión, y llegar con teclado y
con puntero a «Ingresar», «Crear cuenta», «Soy estudiante» y «Soy empresa».

**Acceptance Scenarios**:

1. **Given** un visitante sin sesión, **When** abre la página de inicio, **Then** ve la cabecera pública con el
   logo, «Ingresar» y «Crear cuenta», un mensaje que dice que Praxis es para prácticas profesionales y dos
   llamados: uno para estudiantes y otro para empresas.
2. **Given** un visitante en un móvil de 360 px, **When** ve la cabecera, **Then** «Ingresar» y «Crear cuenta»
   están visibles sin abrir ningún menú.
3. **Given** un visitante que solo usa teclado, **When** recorre la página con Tab, **Then** cada enlace y
   botón recibe un foco visible, en el orden en que se lee la página, empezando por «Saltar al contenido».

---

### User Story 2 - Usuario con sesión navega según su rol (Priority: P2)

Un estudiante o una empresa con la sesión iniciada ve una cabecera con las secciones de su rol y un menú de
cuenta para cerrar sesión.

**Why this priority**: todos los módulos siguientes (perfiles y vacantes) se cuelgan de esta navegación.

**Independent Test**: con una sesión de estudiante y otra de empresa, comprobar que cada cabecera muestra solo
las secciones de su rol y que «Cerrar sesión» devuelve al inicio público.

**Acceptance Scenarios**:

1. **Given** un estudiante con sesión, **When** navega, **Then** tiene «Inicio» y «Mi perfil» en la cabecera
   (escritorio) o en una barra de navegación inferior fija (móvil), y el menú de cuenta (su avatar) con su nombre,
   su correo y «Cerrar sesión».
2. **Given** una empresa con sesión, **When** navega, **Then** tiene «Mis vacantes» y «Perfil de la empresa» en la
   cabecera (escritorio) o en una barra de navegación inferior fija (móvil), y el menú de cuenta con su correo y
   «Cerrar sesión».
3. **Given** cualquier usuario con sesión, **When** está en una sección, **Then** el enlace de esa sección se
   marca como actual con algo más que el color (subrayado o indicador) y se anuncia como página actual a los
   lectores de pantalla.
4. **Given** cualquier usuario con sesión, **When** elige «Cerrar sesión», **Then** la sesión termina y vuelve
   al inicio público.

---

### User Story 3 - Páginas de error que orientan (Priority: P3)

Quien entra a una dirección que no existe, o a una sección de otro rol, recibe una página que explica qué pasó
y le ofrece a dónde ir.

**Why this priority**: evita callejones sin salida, pero no bloquea el recorrido principal.

**Independent Test**: visitar una ruta inexistente y una ruta de empresa con sesión de estudiante.

**Acceptance Scenarios**:

1. **Given** cualquier persona, **When** visita una dirección que no existe, **Then** ve «No encontramos esta
   página» con un enlace al inicio.
2. **Given** un estudiante con sesión, **When** visita una sección de empresa, **Then** ve «No tienes acceso a
   esta sección» con un enlace a su inicio, sin revelar datos de la otra sección.
3. **Given** un visitante sin sesión, **When** visita una sección que exige sesión, **Then** se le lleva a
   iniciar sesión y, al entrar, vuelve a donde quería ir.

### Edge Cases

- Pantallas de 320 px: nada se corta ni obliga a desplazarse en horizontal.
- Texto ampliado al 200 %: la cabecera y la barra inferior siguen usables sin cortar los rótulos.
- La sesión vence mientras navega: la siguiente acción lo lleva a iniciar sesión con un aviso.
- La barra inferior fija no tapa el último contenido ni el pie de página.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sitio MUST mostrar una cabecera pública con el logo (enlace al inicio), «Iniciar sesión» («Ingresar»
  en móvil, por espacio) y «Crear cuenta». El inicio MUST NOT mostrar límites del plan gratuito («Empieza gratis»).
- **FR-002**: El sitio MUST mostrar, con sesión, una cabecera según el rol: estudiante → «Inicio» y «Mi perfil»; empresa →
  «Perfil de la empresa» y «Mis vacantes»; ambos → menú de cuenta con el correo y «Cerrar sesión».
- **FR-003**: En pantallas pequeñas no hay menú desplegable de navegación: el visitante ve «Ingresar» y «Crear
  cuenta» en la cabecera; con sesión, cada rol navega con una barra inferior fija (estudiante: «Inicio» y
  «Mi perfil»; empresa: «Mis vacantes» y «Perfil de la empresa»). En una página que no es de la barra (por ejemplo
  «sin acceso»), ningún destino se marca como actual.
- **FR-003a**: El menú de cuenta MUST abrirse desde un botón rotulado «Cuenta», cerrarse con Escape y devolver el
  foco a ese botón.
- **FR-004**: La página de inicio MUST explicar que Praxis es un portal de prácticas profesionales, que no es una
  bolsa de empleo ni un trámite oficial, y MUST ofrecer un llamado para estudiantes y otro para empresas.
- **FR-005**: La página de inicio MUST NOT mostrar cifras, testimonios, logos de instituciones ni convenios que no existan.
- **FR-006**: El pie de página MUST incluir un enlace a la política de tratamiento de datos.
- **FR-007**: El sitio MUST ofrecer una página «no encontrada» y una página «sin acceso», ambas con un enlace de salida.
- **FR-008**: Una sección que exige sesión MUST llevar a iniciar sesión y, tras entrar, volver a la sección pedida.
- **FR-009**: Una sección de otro rol MUST mostrar la página «sin acceso».
- **FR-010**: Todas las pantallas MUST cumplir WCAG 2.1 AA: foco visible, enlace «Saltar al contenido», contraste
  suficiente y la sección actual indicada con algo más que el color.
- **FR-011**: Todas las pantallas MUST diseñarse primero a 360 px y adaptarse a escritorio.
- **FR-012**: Todos los textos MUST estar en español.

### Key Entities

- **Rol de la sesión**: visitante, estudiante o empresa. Decide qué cabecera y qué secciones se muestran.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un visitante identifica cómo crear una cuenta de su tipo en menos de 10 segundos desde que carga el inicio.
- **SC-002**: El 100 % de las pantallas de este módulo pasa la revisión automática de accesibilidad sin errores.
- **SC-003**: Toda la navegación se completa solo con teclado, a 360 px y en escritorio.
- **SC-004**: La página de inicio carga en menos de 2,5 s en una conexión móvil 4G.
- **SC-005**: Ninguna pantalla requiere desplazamiento horizontal a 360 px.

## Assumptions

- Las pantallas de registro, login y perfiles son de otros módulos (M1, M3, M4, M5); aquí solo se enlazan.
- Mientras M1 no exista, la sesión se puede simular para probar la cabecera por rol.
- La política de tratamiento de datos es una página de texto que se redacta en M1.
- Se usa la identidad visual existente: azul primario, naranja secundario, tipografías Poppins (títulos) e Inter (texto).
- Las 5 últimas vacantes para el visitante quedan fuera de esta muestra.
