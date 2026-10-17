<!--
Sync Impact Report (v1.2.0, 2026-10-16)
- Versión: 1.1.0 → 1.2.0 (MINOR: cambia una fila de «Stack y restricciones técnicas»; ningún principio cambia)
- Cambio: Pruebas → Jest en la API (modo ESM nativo con SWC, porque Nest 12 es solo ESM) y Vitest en la web
- Motivo: decisión del equipo (2026-10-16)
- Plantillas: sin cambios
- Pendiente: aprobación por PR de otro integrante (Gobernanza)

Sync Impact Report (v1.1.0)
- Versión: 1.0.0 → 1.1.0 (MINOR: se agregan principios y una sección de stack; no se quita ni se
  redefine ningún principio)
- Principios agregados: XII. Simplicidad y uso directo del framework; XIII. Pruebas primero en lo
  crítico; XIV. Seguridad por defecto
- Secciones agregadas: Stack y restricciones técnicas
- Secciones ampliadas: Flujo de desarrollo y calidad (CI, Git, pruebas web, Definición de terminado)
- Secciones eliminadas: ninguna
- Plantillas: .specify/templates/* no requieren cambios; leen esta constitución en tiempo de ejecución
- Pendientes:
  - Las decisiones marcadas *(propuesta)* en docs/context(pre-constitucion).md siguen abiertas; son detalle de specs.
  - TODO(DATA_RESIDENCY): Railway, Vercel, R2 y Resend pueden alojar datos fuera de Colombia. Con datos
    reales, la Ley 1581 exige revisar la transferencia internacional antes de salir del piloto.
-->

# Constitución de Praxis

Praxis es un portal de **prácticas profesionales** que conecta a estudiantes habilitados con empresas
que ofrecen plazas de práctica. Cubre la búsqueda y la preselección: desde que el estudiante encuentra
una vacante hasta que conoce el resultado de su postulación. Piloto: Medellín y el Valle de Aburrá.

## Principios fundamentales

### I. Práctica, no empleo
Todo el producto (datos, filtros y textos) MUST girar en torno a la práctica profesional académica. Lo
que solo tiene sentido para el empleo general MUST NOT entrar. Praxis no sustituye trámites oficiales
(SGVA del SENA, convenios institucionales).

### II. Requisitos explícitos y comparables
Toda vacante MUST declarar sus requisitos en campos estructurados, de una lista cerrada que se compara
con los mismos campos del perfil del estudiante. Los requisitos MUST NOT expresarse en texto libre ni
evaluarse contra la descripción. Una vez publicada la vacante, sus requisitos MUST NOT cambiar.

### III. Elegibilidad transparente, sin puntajes
Cada requisito MUST mostrarse por separado como *cumple*, *no cumple* o *falta información*, al
estudiante y a la empresa. Praxis MUST NOT usar porcentajes de afinidad, rankings opacos ni
posiciones pagadas que parezcan una probabilidad de contratación.

### IV. No se postula a lo que no se cumple
Si un requisito excluyente da *no cumple*, el sistema MUST bloquear la postulación y MUST decir por
qué. Consultar la vacante sigue permitido. Un dato que falta no bloquea; se muestra como *falta
información* y se invita a completarlo. La excepción es el perfil mínimo (nivel de formación y
programa): sin él MUST NOT haber postulación.

### V. Trazabilidad del proceso
Cada postulación MUST tener un estado y un historial visibles para el estudiante. Ningún cambio de
estado MUST ocurrir en silencio: genera una notificación. El historial, las postulaciones y las
vacantes ya publicadas MUST NOT borrarse. La única excepción es el derecho de supresión del titular:
en ese caso el historial se anonimiza, no se borra.

### VI. Mínimo acceso a los datos
Cada usuario MUST ver solo lo que necesita para su rol. El perfil y el CV del estudiante solo los ven él
mismo y las empresas a cuyas vacantes se postuló, en la versión que tenían al postularse. Praxis MUST
NOT ofrecer una base de talento abierta ni vender datos de estudiantes.

### VII. No discriminación
La edad, el sexo, el estado civil, la foto y cualquier otro dato personal sensible MUST NOT ser requisito
de acceso ni de postulación. Esos campos no existen como requisito.

### VIII. Protección de datos
El tratamiento de datos personales MUST cumplir la Ley 1581 de 2012, con el RGPD como referencia de
buenas prácticas. El registro MUST pedir autorización previa y expresa (casilla sin marcar) y solo se
piden los datos que se usan. Mientras Praxis sea una demostración académica, MUST usar solo datos
ficticios y pagos en modo de pruebas.

### IX. Honestidad
Praxis MUST NOT simular certificaciones, convenios, cifras, cobros ni verificaciones que no existen, ni
presentarse como un trámite oficial. «Verificado» solo se muestra si hay un proceso real de validación;
lo declarado por empresas o estudiantes se rotula como declarado.

### X. Claro y accesible para todos
La interfaz MUST cumplir WCAG 2.1 nivel AA. Los estados se comunican con texto (no solo con color),
todo se puede usar con teclado y los errores explican qué corregir.

### XI. MVP primero
El alcance aprobado es la referencia. Lo que no sea esencial para el recorrido
*buscar → comprobar → postular → seguir* MUST ir a una fase posterior. Toda complejidad adicional
MUST justificarse en el plan.

### XII. Simplicidad y uso directo del framework
El sistema MUST limitarse a tres proyectos: `apps/web`, `apps/api` y `packages/contracts`. Uno nuevo
MUST justificarse en la tabla *Complexity Tracking* del plan. Se usan NestJS, Prisma, Next.js y MUI
directamente: MUST NOT envolverlos en capas propias (repositorios genéricos sobre Prisma, wrappers de
componentes sin lógica propia). No se agregan cachés, colas ni microservicios hasta que una medición
demuestre que hacen falta. Una dependencia nueva MUST justificarse si unas pocas líneas resuelven lo
mismo.

### XIII. Pruebas primero en lo crítico
Las reglas críticas MUST escribirse con la prueba primero: la prueba se escribe, se ve fallar y luego se
implementa. Son la elegibilidad y el bloqueo de la postulación, el perfil mínimo, la regla de una
postulación por estudiante y vacante, los cupos y los planes, los pagos y los permisos por rol. Las
pruebas de integración de la API MUST correr contra un Postgres real, no contra mocks del ORM. El resto
del código MAY probarse después de implementarlo.

### XIV. Seguridad por defecto
Toda entrada externa MUST validarse en la API con los esquemas de `packages/contracts`. Cada endpoint
MUST verificar el rol y la propiedad del recurso (una empresa solo toca sus vacantes; un estudiante,
solo sus postulaciones). Las contraseñas MUST guardarse con argon2 y la sesión MUST ir en una cookie
`httpOnly`, `Secure` y `SameSite`. El inicio de sesión y el registro MUST tener límite de intentos. Los
archivos MUST ser PDF de máximo 5 MB y servirse solo con URLs firmadas de corta duración. Los secretos
MUST vivir en variables de entorno, nunca en el repositorio. Los logs MUST NOT contener contraseñas,
tokens ni datos personales.

## Reglas de producto del MVP

El detalle vive en `docs/context(pre-constitucion).md`. Estas reglas son las que ninguna spec puede contradecir:

- **Roles del MVP:** visitante, estudiante y empresa. El administrador es una fase posterior.
- **Visitante:** solo ve las 5 últimas vacantes abiertas, con datos básicos; no busca ni filtra.
- **Estudiante:** gratis siempre. Declara su aval y puede subir un soporte; Praxis no lo verifica.
- **Empresa:** una única cuenta por empresa. Recibe candidatos; no busca perfiles ni vacantes de otras
  empresas. Publica solo con correo confirmado y NIT válido (formato y dígito de verificación de la
  DIAN). La verificación es automática y la ficha dice «Datos declarados por la empresa».
- **Vacante:** Borrador → Abierta → Cerrada, con fecha de vigencia obligatoria. No se reabre. Cerrar no
  cancela las postulaciones en curso. Solo un borrador se puede eliminar.
- **Postulación:** estados Enviada, En revisión, Entrevista, Seleccionada, Rechazada y Retirada. Una sola
  por estudiante y vacante, aunque se haya retirado, garantizada también con una restricción única en
  la base de datos. Al postularse se guarda una copia del perfil, del CV y del resultado de cada
  requisito, y se le advierte al estudiante.
- **Notificaciones:** dentro de la web en el MVP. El único correo del MVP es la confirmación de cuenta.
- **Cobro (solo empresas):** 2 vacantes gratis cada 6 meses. Plan Básico de COP 29.900 (4 vacantes
  adicionales) y plan Ilimitado de COP 59.000, ambos de 6 meses con renovación manual. El plan se
  activa automáticamente cuando el pago queda aprobado.

## Stack y restricciones técnicas

Cambiar cualquier elemento de esta tabla es una enmienda a la constitución.

| Área | Decisión |
|---|---|
| Lenguaje y entorno | TypeScript en todo el código, Node.js 24, módulos ESM |
| Monorepo | npm workspaces: `apps/web`, `apps/api`, `packages/contracts` |
| Frontend | Next.js 16 (App Router), React 19, MUI 9 con el tema de Praxis (`apps/web/src/app/theme.ts`) y Tailwind 4 |
| Backend | NestJS 12, API REST con JSON |
| Contrato web ↔ api | Esquemas Zod en `packages/contracts`: la API valida con ellos y la web tipa y valida formularios |
| Base de datos | PostgreSQL con Prisma. Todo cambio de esquema va por una migración versionada |
| Autenticación | Propia en NestJS: sesión en cookie `httpOnly` y contraseñas con argon2. Sin proveedor externo |
| Archivos (CV, soportes) | Almacenamiento compatible con S3 (Cloudflare R2 o AWS S3), privado, con URLs firmadas |
| Pagos | Wompi, con pagos únicos en COP. Modo de pruebas mientras el piloto use datos ficticios |
| Correo | Resend, solo para la confirmación de cuenta en el MVP |
| Despliegue | Vercel para la web; Railway para la API y Postgres |
| Pruebas | Jest en la API (unitarias e integración, modo ESM con SWC), Vitest en la web (unitarias), Postgres real en Docker para integración, Playwright con axe para E2E |
| Calidad de código | oxlint y Prettier en la API, ESLint en la web, TypeScript en modo `strict` |

**Restricciones del producto:**
- **Mobile-first:** cada pantalla se diseña primero para 360 px de ancho y luego se amplía a escritorio.
- **Solo español:** los textos van directo en español, sin librería de i18n. Las fechas y los montos en
  COP usan el formato colombiano, y la zona horaria es `America/Bogota`.
- **Escala objetivo del piloto:** 10.000 estudiantes y 500 empresas. Los listados MUST paginarse en el
  servidor y los campos de búsqueda y filtro MUST tener índices.
- **Rendimiento:** la API responde en menos de 500 ms (p95) y las páginas cargan con un LCP menor a
  2,5 s en una conexión 4G.

## Flujo de desarrollo y calidad

- **Monorepo:** las dependencias se instalan solo desde la raíz (`npm install <pkg> -w <app>`), con un
  único `package-lock.json` (ver `MONOREPO.md`).
- **Ramas:** una rama por spec, con el nombre que crea spec-kit (`001-nombre`), y se fusiona a `main` por
  PR. Los commits siguen Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
- **CI:** GitHub Actions corre en cada PR lint, verificación de tipos, pruebas y build. Si algo falla, el
  PR no se fusiona.
- **Pruebas web:** el recorrido *buscar → comprobar → postular → seguir* MUST tener pruebas E2E con
  Playwright que incluyan revisión automática de accesibilidad con axe.
- **Revisión:** todo cambio entra por PR revisado por otro integrante del equipo.
- **Definición de terminado:** cumple los criterios de aceptación de su spec, sus pruebas pasan en CI,
  se revisó en un PR y no rompe ningún principio de esta constitución.

## Gobernanza

- Esta constitución está por encima de las specs, los planes y las tareas. Si una spec la contradice, la
  que cambia es la spec.
- **Enmiendas:** por PR que modifique este archivo, aprobado por otro integrante del equipo, con la
  versión y la fecha actualizadas y el Sync Impact Report al inicio.
- **Versionado semántico:** *mayor* si se quita o se redefine un principio, *menor* si se agrega un
  principio o una sección, *parche* si solo se corrige la redacción.
- **Cumplimiento:** cada `/speckit-plan` MUST pasar el «Constitution Check» contra esta versión, y
  cada revisión de PR verifica que no se rompa ningún principio.
- La guía de producto para el trabajo diario es `docs/context(pre-constitucion).md`.

**Version**: 1.2.0 | **Ratified**: 2026-10-15 | **Last Amended**: 2026-10-16
