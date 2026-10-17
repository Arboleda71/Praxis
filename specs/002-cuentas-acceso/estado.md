# Estado de M1 · Cuentas y acceso

> Verificación local: 2026-10-16, America/Bogota. Las tareas originales pasaron las comprobaciones descritas abajo. La aceptación final por el equipo sigue pendiente.

## Entorno y migración T003

- Docker Desktop fue iniciado manualmente por el usuario. Su motor sigue inaccesible desde el sandbox; se usó PostgreSQL local sin cambiar permisos de Windows ni WSL.
- PostgreSQL 17.11 responde en `localhost:5432`. Se comprobó la conexión con `pg` a `praxis`, `praxis_test` y `praxis_e2e`.
- Dependencias existentes instaladas desde la raíz con `npm install`; contracts compilado por `postinstall`. No se añadieron paquetes ni se ejecutó `npm audit fix`.
- `apps/api/.env` preparado desde `.env.example`, ignorado por Git; cliente Prisma 7.10.1 generado.
- Se creó y aplicó `20261017040317_cuentas` mediante `npm exec --no --workspace api -- prisma migrate dev --name cuentas` desde la raíz. `prisma migrate status` indicó base actualizada.
- Las suites aplicaron la misma migración a las bases de pruebas. Se consultó `_prisma_migrations` en las tres bases y se comprobó la aplicación finalizada sin rollback.
- Los ejecutables nativos requirieron ejecución fuera del sandbox; no fue necesario modificar el sistema.
- Rama conservada: `001-estructura-navegacion`. Contexto mediante `SPECIFY_FEATURE_DIRECTORY`; comprobador con `-PathsOnly -Json`, sin crear `feature.json`.

## Hecho y verificado localmente

| Parte | Verificación |
|---|---|
| Contracts: `npm run test -w @praxis/contracts` | 17 pruebas aprobadas: 15 existentes y 2 regresiones |
| API: `npm run test -w api -- --runInBand` | 6 pruebas aprobadas en 2 suites; incluye las 5 del límite de intentos |
| API: `npm run test:e2e -w api` | 15 pruebas aprobadas contra `praxis_test`: 14 de autenticación y 1 básica |
| Web: `npm run test -w web` | 12 pruebas aprobadas en 3 archivos |
| E2E: `npm run test:e2e -w web -- --workers=2` | 47 pruebas aprobadas; el bloqueo corrió al final |
| Tipos: `npm exec --no --workspace api -- tsc --noEmit --incremental false` y equivalente con `web` | Ambos aprobados |
| Lint: `npm run lint -w api` y `npm run lint -w web` | Ambos aprobados |
| Lint contracts: `.\node_modules\.bin\oxlint.cmd --type-aware --config apps/api/.oxlintrc.json packages/contracts/src` | Sin errores; 1 advertencia existente de spread de string en NIT |
| Build: `npm run build -w @praxis/contracts`, `npm run build -w api`, `npm run build -w web` | Todos aprobados; contracts y Next incluyen verificación de tipos |

Todos estos comandos terminaron con código 0 en su ejecución satisfactoria. Los 47 E2E corresponden a 13 casos originales de M1, 8 de M0 y 2 recorridos completos por rol, repetidos a 360 y 1080 px, más el caso final de bloqueo. Se ejecutaron las aserciones axe de esas suites.

Los recorridos completos comprobaron desde la interfaz: registro de ambos roles, enlace del correo local, confirmación, desaparición del aviso, cierre de sesión, rechazo de la cookie anterior por el servidor, redirección de una ruta protegida, reingreso con `next` y denegación de una sección del otro rol. La comprobación fue automatizada con navegador real; no equivale a una revisión humana completa de teclado o lectores de pantalla.

## Correcciones necesarias para las pruebas originales

1. La integración reprodujo la ausencia del error de NIT con autorización falsa. Se agregaron dos regresiones unitarias, se observaron fallar y se corrigió Zod para validar el NIT por campo y la coincidencia de contraseñas independientemente de otros errores. La integración original se mantuvo.
2. El E2E reprodujo el aviso obsoleto al volver al perfil después de confirmar. El enlace de continuación ahora recarga el layout para consultar otra vez la sesión, sin cambiar el diseño.
3. El selector del correo coincidía también con el menú oculto; ahora comprueba el destinatario dentro de `main`. Cada prueba representa un origen independiente mediante la cabecera ya aceptada por el proxy local, conservando la acumulación de fallos dentro del caso. No se desactivó el límite ni se quitaron aserciones.
4. Se descargó Chromium requerido por Playwright. Seis workers causaron esperas fallidas durante compilación en desarrollo; la ejecución final con dos workers pasó sin ampliar timeouts.
5. `npm install` añadió únicamente `hasInstallScript: true` al lockfile; no cambió versiones declaradas.

## Análisis final de consistencia de spec-kit

Se releyeron las instrucciones de `speckit-analyze` y se contrastaron constitución, spec, plan, tareas, estado y código, sin modificar documentos durante ese análisis. No hay hooks de extensiones.

- Inventario: 16 FR, 5 SC y 20 tareas originales; ninguna tarea añadida. Los 16 FR tienen tareas asociadas, algunas con garantías todavía parciales. SC-002/003/004 tienen cobertura de pruebas, parcial para accesibilidad completa; SC-001/005 no tienen tareas explícitas de medición. Cobertura documental total o parcial: 19/21 (90,5 %); no mide cumplimiento.
- No hay duplicaciones sustantivas ni tareas sin propósito identificable. Se resolvieron los fallos reproducidos de validación, navegación tras confirmar y contaminación entre pruebas; se verificaron migración y preparación local.
- El análisis no declara cumplimiento constitucional completo ni aceptación final. Se conservan los siguientes hallazgos anteriores para coordinación, sin convertirlos en tareas nuevas:

| Referencias del análisis | Gravedad | Pendiente real |
|---|---|---|
| C1 | Crítica, gobernanza | Aprobación por otro integrante de la enmienda sobre Jest; el reporte de v1.2.0 sigue declarándola pendiente. No se modificó la constitución. |
| C2 | Crítica, contradicción normativa | Constitución exige `Secure` sin excepción; plan y código lo activan solo en producción. Requiere decisión del equipo para entornos locales. |
| C3 | Crítica, seguridad | Un fallo al escribir el correo puede incluir el destinatario en `error.message` registrado. No se reprodujo ese fallo ni se certificó sanitización de logs. |
| C4 | Crítica, cierre | No existe `.github` en este clon. CI y revisión por otro integrante siguen pendientes del responsable. |
| S1, S5 | Alta | Definir cómputo de intentos consecutivos por correo/IP y topología de proxies de despliegue; las suites locales no resuelven esas decisiones. |
| S2 | Alta | No se verificaron confirmaciones y reenvíos simultáneos; el análisis estático señaló ausencia de garantía atómica entre lectura y actualización. |
| S3, S4 | Alta | Recuperación ante fallo de API al cerrar sesión y ante fallo del proveedor de correo; los recorridos exitosos no cubren esas garantías. |
| P3 | Alta | Las conexiones de pruebas carecen de una guarda contra otra base configurada por error. Esta ejecución usó y comprobó las bases previstas. |
| R1, R2 | Media | Confirmación sin sesión y diferenciación de errores de red/enlace; reactivación del formulario tras 15 minutos. No se resolvieron esos escenarios adicionales. |
| P4, P5 | Media | Revisión humana completa de accesibilidad/teclado, medición del registro y entrega real de correo en menos de un minuto. Los E2E y archivos locales no certifican esos criterios completos. |

## Pendientes ajenos a esta ejecución

- Node instalado: 24.14.1. npm advirtió que algunas dependencias existentes requieren al menos 24.15.0 dentro de la rama 24. Las comprobaciones pasaron, pero falta alinear ese entorno; no se actualizó automáticamente.
- npm informó 24 vulnerabilidades (19 moderadas y 5 altas). No se ejecutó remediación automática.
- No se hizo push ni se modificó el PR. Quitar el borrador requiere autorización y no sustituye las revisiones pendientes.
- No se desarrollaron otros módulos ni funciones nuevas. Los perfiles y vacantes siguen como marcadores.

## Cambios que afectan a otros módulos

- **La sesión simulada de M0 ya no existe.** `getSession()` consulta `GET /auth/sesion` en la API; para
  desarrollar cualquier página con sesión hay que tener la API y Postgres corriendo.
- `@praxis/contracts` se compila al instalar (`postinstall` de la raíz). Si cambian los esquemas:
  `npm run build -w @praxis/contracts`.
- Pruebas: Jest en la API (constitución v1.2.0, pendiente de aprobación en el PR), Vitest en la web y en contracts.

## Pendientes de producto que siguen abiertos

- Restablecer la contraseña: feature pendiente, exige enmendar la constitución (ver `docs/modulos.md`).
- El límite de intentos vive en memoria: sirve con una sola instancia de la API.
- `RESEND_API_KEY` y el dominio remitente para producción.
