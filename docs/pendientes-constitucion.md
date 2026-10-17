# Pendientes de la constitución

> Estado al 2026-10-17. Constitución vigente: `.specify/memory/constitution.md` v2.0.0.
> Detalle del producto: `docs/context(pre-constitucion).md`.
>
> Marquen cada punto con `[x]` cuando quede confirmado y anoten la decisión al lado. Si algo cambia la
> constitución, se hace como enmienda (ver su sección «Gobernanza»).

## 1. Reglas que entraron a la constitución sin validación del equipo

- [ ] **Principio XII, Simplicidad:** solo tres proyectos (`apps/web`, `apps/api`, `packages/contracts`). Los
  frameworks se usan directamente, sin capas propias. No hay cachés ni colas hasta medir que hacen falta.
- [ ] **Principio XIII, Pruebas primero en lo crítico:** la prueba se escribe antes del código en
  elegibilidad, perfil mínimo, una postulación por vacante, cupos, planes, pagos y permisos. Las pruebas
  de integración corren contra un Postgres real.
- [ ] **Principio XIV, Seguridad por defecto:** validación con Zod, chequeo de rol y de propiedad del recurso
  en cada endpoint, argon2, cookie segura, límite de intentos en el inicio de sesión y logs sin datos
  personales.
- [ ] **Archivos:** solo PDF, de máximo 5 MB, para el CV y los soportes del aval.
- [ ] **Metas de rendimiento:** la API responde en menos de 500 ms (p95) y las páginas cargan con un LCP
  menor a 2,5 s en 4G.
- [ ] **Accesibilidad:** WCAG 2.1 nivel AA es obligatorio.
- [ ] **Equipo y aprobación:** se asumió que el equipo son dos personas y que todo PR (incluidos los
  cambios a la constitución) lo aprueba «otro integrante». ¿Quiénes son y quién aprueba?

## 2. Propuestas de producto en `docs/context(pre-constitucion).md`

No están en la constitución, pero las specs las necesitan.

- [ ] **Aval:** la empresa ve si el aval declarado viene «con soporte» o «sin soporte» (§4.2).
- [ ] **Estados de la postulación:** la empresa mueve los estados. El estudiante solo puede pasar a
  *Retirada*, antes de *Seleccionada* o *Rechazada* (§6).
- [ ] **Notificaciones:**
  - el estudiante recibe una cuando cambia el estado de su postulación o cuando se cierra la vacante;
  - la empresa recibe una cuando llega una postulación nueva o cuando un estudiante se retira (§6.1).
- [ ] **Cambio de plan:** pasar del Básico al Ilimitado se paga completo, sin prorrateo (§7).
- [ ] **Aviso de vencimiento:** la app avisa unos días antes de que venza el plan (§7).
- [ ] **Pasarela en modo de pruebas** mientras el piloto sea académico (§7). La constitución ya lo exige.
- [ ] **Periodo móvil:** el límite gratuito cuenta las vacantes de los últimos 6 meses (§7).
- [ ] **Qué cuenta como publicación:** cada paso de *Borrador* a *Abierta* (§7).
- [ ] **Fase posterior:** convenios con instituciones educativas (§7.2).
- [ ] **Diseño de datos:** separar los datos personales del historial, para poder anonimizar más adelante
  (§8).

## 3. Detalles por definir en las specs

- [x] **Avance académico** (resuelto el 2026-10-17, spec 004): semestre para universitarios y etapa
  lectiva/productiva para el SENA; solo se compara dentro del mismo nivel.
- [x] **Catálogo de programas** (resuelto el 2026-10-17, spec 004): semilla ficticia para la muestra.
- [ ] **Programas reales:** antes de salir del piloto, reemplazar la semilla por el SNIES más los programas del
  SENA, que el SNIES no cubre del todo.
- [ ] **Enmienda v2.0.0** (2026-10-17): principio IV redefinido (solo nivel y programa son excluyentes; perfil
  mínimo con CV; la ciudad no es requisito). Falta la aprobación por PR de otro integrante.
- [ ] **Reemplazar el CV en una postulación *Enviada*** (antes de que la empresa la revise): ¿se anota
  como fase posterior?

## 3.1 Features pendientes (no olvidar)

- [ ] **Restablecer la contraseña** (decidido el 2026-10-16): queda fuera de la primera muestra y se construye
  después. Exige enmendar la constitución (hoy el único correo del MVP es la confirmación de cuenta). Detalle de
  pantallas y reglas en `docs/modulos.md`, sección «Feature pendiente: restablecer la contraseña».

## 4. Pendientes externos

- [ ] **Documento fuente:** `docs/context(pre-constitucion).md` cita `docs/Praxis_Metodologia_Tradicional_Final_APA.docx`,
  que no está en el repo. Hay que subirlo o quitar la referencia.
- [ ] **Residencia de datos (`TODO(DATA_RESIDENCY)` en la constitución):** Vercel, Railway, R2 y Resend
  pueden guardar datos fuera de Colombia. Antes de usar datos reales hay que revisar la transferencia
  internacional que exige la Ley 1581.
- [ ] **Wompi en producción:** para cobrar de verdad hace falta un comercio registrado, con RUT y cuenta
  bancaria. En modo de pruebas no hace falta.

## 5. Git

- [ ] **Commit pendiente:** `docs/`, `.specify/` y `.claude/` todavía no están en git. Hay que subir
  `.claude/skills/` para que todo el equipo tenga los comandos `/speckit-*`.
  - Mensaje sugerido: `docs: constitución v1.1.0, spec-kit y contexto de producto`.
