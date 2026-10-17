# Feature Specification: Catálogos compartidos

**Feature Branch**: `004-catalogos-compartidos`

**Created**: 2026-10-17

**Status**: Draft

**Input**: User description: "M2 de docs/modulos.md: Catálogos compartidos. Las listas cerradas con las que el
perfil del estudiante (M3), el perfil de la empresa (M4) y los requisitos de la vacante (M5) usan los mismos campos
y se pueden comparar (principio II). No tiene pantallas propias: alimenta los selectores de M3, M4 y M5. Catálogos:
nivel de formación; programa; ciudad; modalidad; jornada; idioma y nivel (MCER A1–C2); avance académico (pregunta
abierta para SENA); sector de la empresa. Reglas: no existe catálogo de edad, sexo, estado civil ni foto (VII); los
catálogos los comparten la web y la API. Preguntas abiertas: unidad de avance académico para SENA y origen de la
lista de programas (¿SNIES?)."

## Contexto

La elegibilidad (fase posterior) compara cada requisito de la vacante con el mismo campo del perfil del estudiante
y dice *cumple*, *no cumple* o *falta información* (principios II y III). Para que esa comparación sea posible y
honesta, ambos lados MUST elegir de la misma lista cerrada. M2 define esas listas y cómo se comparan sus valores.
No tiene pantallas: lo verán los usuarios en los selectores de M3 (perfil del estudiante), M4 (perfil de la
empresa) y M5 (vacantes).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Estudiante y empresa eligen de la misma lista (Priority: P1)

Una estudiante declara en su perfil que es tecnóloga en Desarrollo de Software. Una empresa crea una vacante que
pide tecnólogos de ese mismo programa. Ambos eligieron el valor de una lista, no lo
escribieron, así que el sistema puede decir sin ambigüedad que la estudiante cumple.

**Why this priority**: es la razón de existir de M2. Sin listas compartidas, M3 y M5 no se pueden construir de
forma comparable y la elegibilidad no funciona.

**Independent Test**: tomar cada catálogo y comprobar que el mismo valor elegido en un perfil y en una vacante se
reconoce como igual, y que no hay forma de introducir un valor que no esté en la lista.

**Acceptance Scenarios**:

1. **Given** un perfil y una vacante que eligieron el mismo programa, **When** se comparan, **Then** el programa
   coincide.
2. **Given** un valor que no pertenece al catálogo (por ejemplo, un programa escrito a mano), **When** se intenta
   guardar en un perfil o en una vacante, **Then** se rechaza con un mensaje que dice que se elija de la lista.
3. **Given** un catálogo, **When** se muestra en cualquier selector de M3, M4 o M5, **Then** aparecen los mismos
   valores, con el mismo nombre y en el mismo orden.

---

### User Story 2 - Los niveles que tienen orden se comparan como «mínimo» (Priority: P1)

Una vacante pide inglés B1 como mínimo. Un estudiante con inglés B2 cumple; uno con A2 no cumple. Lo mismo pasa con
el avance académico mínimo.

**Why this priority**: los requisitos de idioma y de avance académico se expresan como «nivel mínimo» (M5); sin un
orden definido no se pueden evaluar.

**Independent Test**: comparar todos los pares de niveles MCER y de avance académico y verificar el resultado.

**Acceptance Scenarios**:

1. **Given** el orden A1 < A2 < B1 < B2 < C1 < C2, **When** se compara un nivel declarado con un mínimo, **Then**
   cumple si el declarado es igual o mayor.
2. **Given** un requisito de idioma (por ejemplo, inglés B1), **When** el estudiante declaró otro idioma pero no
   ese, **Then** el resultado es *falta información* para ese idioma, no *no cumple*.
3. **Given** un avance académico mínimo en la vacante, **When** se compara con el avance declarado por el
   estudiante, **Then** cumple si el declarado es igual o mayor, según la unidad que define FR-009 (por ejemplo, 6.º semestre
   cumple un mínimo de 5.º; la etapa Productiva cumple un mínimo de Lectiva).

---

### User Story 3 - El programa depende del nivel de formación (Priority: P2)

Un estudiante elige «Tecnólogo» y luego busca su programa: solo ve programas de ese nivel. Una empresa que pide
varios niveles ve los programas de esos niveles.

**Why this priority**: evita combinaciones imposibles (un «universitario» de un programa tecnológico) que harían
fallar la comparación sin que el usuario entienda por qué.

**Independent Test**: para cada nivel, listar sus programas y comprobar que ningún programa aparece fuera de su
nivel.

**Acceptance Scenarios**:

1. **Given** el nivel «Técnico», **When** se listan programas, **Then** solo aparecen programas técnicos.
2. **Given** un perfil con nivel «Universitario» y un programa tecnológico, **When** se intenta guardar, **Then** se
   rechaza con «Este programa no corresponde al nivel elegido.»

---

### User Story 4 - Ningún dato sensible se convierte en requisito (Priority: P2)

Una empresa quiere pedir «menores de 25 años» o «solo mujeres». No hay forma de hacerlo: no existe ningún catálogo
de edad, sexo, estado civil ni foto.

**Why this priority**: lo exige el principio VII; M2 es el punto donde se garantiza, porque los requisitos solo
pueden salir de estos catálogos.

**Independent Test**: revisar la lista completa de catálogos y comprobar que ninguno trata un dato sensible.

**Acceptance Scenarios**:

1. **Given** la lista de catálogos, **When** se revisa, **Then** no contiene edad, sexo, género, estado civil, foto,
   etnia, religión, discapacidad ni ningún otro dato sensible.

### Edge Cases

- Un valor del catálogo deja de usarse (por ejemplo, un programa que se retira): no se ofrece en perfiles ni
  vacantes nuevos, pero los perfiles y las vacantes ya publicadas que lo usan lo conservan y siguen mostrándolo con
  su nombre (II: los requisitos publicados no cambian).
- Un valor cambia de nombre (corrección de una tilde): el cambio se ve en todas partes y no rompe comparaciones,
  porque se compara por identidad, no por el texto.
- Vacante remota: no lleva ciudad.
- Estudiante que vive en Envigado y vacante en Medellín: puede postularse igual. Si la distancia importa, lo
  decide la empresa en la entrevista, no el sistema.
- Búsqueda en listas largas (programa): se encuentra escribiendo parte del nombre, sin importar tildes ni
  mayúsculas («ingenieria» encuentra «Ingeniería»).
- Estudiante que declara el mismo idioma dos veces: se rechaza; cada idioma va una sola vez con su nivel.

## Requirements *(mandatory)*

### Functional Requirements

**Generales**

- **FR-001**: Cada catálogo MUST ser una lista cerrada de valores; perfiles, fichas de empresa y vacantes MUST
  aceptar solo valores de su catálogo.
- **FR-002**: La web y la API MUST usar exactamente los mismos catálogos, desde una única fuente.
- **FR-003**: Cada valor MUST tener una identidad estable, distinta de su nombre visible, y las comparaciones MUST
  hacerse por identidad.
- **FR-004**: Un valor retirado MUST dejar de ofrecerse en elecciones nuevas y MUST seguir mostrándose con su nombre
  donde ya se usó.
- **FR-005**: Cada catálogo MUST mostrarse en un orden definido e igual en todas las pantallas.
- **FR-006**: MUST NOT existir catálogos de edad, sexo, género, estado civil, foto ni otros datos sensibles (VII).

**Catálogos**

- **FR-007**: **Nivel de formación**: Técnico, Tecnólogo, Universitario. Sin orden entre ellos: la comparación es
  «está entre los aceptados».
- **FR-008**: **Programa**: cada programa pertenece a un único nivel de formación. La muestra MUST usar una semilla
  ficticia de unos 30 programas representativos de los tres niveles, armada a mano (VIII: solo datos ficticios).
  Antes de salir del piloto se reemplaza por el catálogo oficial (SNIES para educación superior, más los programas
  del SENA, que el SNIES no cubre del todo); queda anotado como pendiente.
- **FR-009**: **Avance académico**: la unidad depende del nivel. Universitario: semestre, del 1.º al 12.º, ordenado.
  Técnico y tecnólogo: etapa, Lectiva < Productiva, ordenada. La comparación «igual o mayor al mínimo» solo se hace
  dentro del mismo nivel; entre niveles distintos el resultado es *falta información*.
- **FR-010**: **Ciudad**: no es un catálogo. La vacante (y la ficha de la empresa) solo indica el nombre de la
  ciudad donde se hace la práctica, como dato informativo. La ciudad MUST NOT compararse con el estudiante, MUST
  NOT dar *no cumple* ni bloquear una postulación: en un área metropolitana, que el candidato pueda llegar lo
  decide una persona en la entrevista, no el sistema.
- **FR-011**: **Modalidad**: Presencial, Híbrida, Remota. Es dato de la vacante y filtro, no requisito.
- **FR-012**: **Jornada**: Tiempo completo, Medio tiempo. La comparación es «coinciden».
- **FR-013**: **Idioma**: Inglés, Francés, Portugués, Alemán, Italiano, Mandarín, Japonés y Lengua de señas
  colombiana. **Nivel MCER**: A1 < A2 < B1 < B2 < C1 < C2 (ordenado); cumple si el declarado es igual o mayor al
  mínimo. Un idioma no declarado da *falta información*.
- **FR-014**: **Sector de la empresa**: lista corta de 12 sectores: Tecnología, Manufactura, Comercio, Servicios
  financieros, Salud, Educación, Construcción, Logística y transporte, Agroindustria, Turismo y gastronomía, Sector
  público y Otro.

**Comparación**

- **FR-015**: Para cada tipo de catálogo MUST existir una regla de comparación única y documentada («está entre»,
  «coinciden» o «igual o mayor al mínimo»), que usarán la elegibilidad y la búsqueda.
- **FR-016**: Un campo del perfil vacío MUST dar *falta información*, nunca *no cumple* (IV).
- **FR-017**: Solo el nivel de formación y el programa MUST poder ser requisitos excluyentes. Avance académico, aval,
  fecha de inicio, jornada e idioma MUST ser siempre deseables: informan a la empresa, pero nunca bloquean una
  postulación. El sistema no decide lo que una persona puede resolver en la entrevista (IV).
- **FR-018**: La búsqueda dentro de un catálogo MUST ignorar tildes y mayúsculas.

### Key Entities

- **Catálogo**: una lista cerrada con nombre (nivel de formación, programa, modalidad, jornada, idioma,
  nivel MCER, avance académico, sector) y su regla de comparación.
- **Valor de catálogo**: identidad estable, nombre visible, posición en el orden, vigente o retirado.
- **Programa**: valor de catálogo que pertenece a un nivel de formación.
- **Nivel ordenado**: valor de catálogo con posición comparable (MCER, avance académico).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % de los campos comparables de M3 y M5 se eligen de un catálogo de M2; ninguno es texto libre.
- **SC-002**: El 100 % de los pares posibles de niveles MCER da el resultado esperado al compararse.
- **SC-003**: Un valor fuera de catálogo se rechaza en el 100 % de los intentos, tanto en la web como en la API.
- **SC-004**: Retirar un valor no cambia ninguna vacante publicada ni ningún perfil existente.
- **SC-005**: Un estudiante encuentra su programa escribiendo parte del nombre en menos de 10 segundos.
- **SC-006**: Ningún catálogo trata datos sensibles (revisión del equipo antes de aprobar la spec).

## Assumptions

- No hay pantallas de administración de catálogos: los cambios los hace el equipo en el código, porque el
  administrador es una fase posterior.
- Los catálogos son iguales para todos los usuarios y no dependen de la institución.
- La institución del estudiante (M3) no es un catálogo en la muestra; no se compara con requisitos.
- El perfil mínimo para postularse pasa a ser nivel de formación, programa y CV (decisión del 2026-10-17). El CV no
  es un catálogo: lo exige M3 y lo recoge la constitución (IV). La ciudad de residencia sale del perfil (VIII).
- La lista de idiomas y la de sectores son propuestas razonables para el piloto; el equipo las puede ajustar sin
  cambiar la spec.
- Solo español: los nombres visibles van en español, sin traducciones.
- No depende de ningún módulo; M3, M4 y M5 dependen de M2.
