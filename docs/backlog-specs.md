# Backlog de specs

> Creado el 2026-11-11. Features con código pendiente, listas para `/speckit-specify`. Cada entrada trae el texto de
> entrada y lo que debe resolverse antes. Al crear la spec, anota su carpeta (`specs/0NN-…`) y márcala.

## S1 · Restablecer la contraseña

- [x] Spec creada: `specs/012-restablecer-contrasena` (2026-11-11). Implementada y verificada en local; falta el PR.
- **Fuente:** PM021 (`docs/pendientes-mvp.md`), `docs/modulos.md` «Feature pendiente».
- **Antes:** enmienda v4.1.0 de la constitución (hecha el 2026-11-11; falta la aprobación de otro integrante).

> Restablecer la contraseña. Enlace «¿Olvidaste tu contraseña?» en Iniciar sesión. La página «Olvidé mi contraseña»
> pide el correo y siempre responde «Si el correo está registrado, te enviamos un enlace». La página «Nueva
> contraseña» se abre desde el enlace del correo: pide contraseña y confirmación, y muestra éxito o «enlace vencido o
> usado» con «Pedir otro enlace». El enlace sirve una sola vez y dura poco. La respuesta no revela si el correo
> existe. Cambiar la contraseña cierra todas las sesiones abiertas. La solicitud tiene límite de intentos (XIV).

## S2 · Aviso de vencimiento del plan

- [ ] Spec creada:
- **Fuente:** `docs/pendientes-constitucion.md` §2 (§7 del contexto). Hoy Planes y pagos solo muestra la fecha
  (`apps/web/src/components/PlanesEmpresa.tsx`).
- **Antes:** decidir cuántos días antes se avisa.

> Aviso de vencimiento del plan de empresa. N días antes de que venza el plan Básico o Ilimitado, la empresa recibe
> una notificación dentro de la web y ve un aviso en Planes y pagos con la fecha y cómo renovar. No hay cobro
> automático; la renovación sigue siendo manual. Solo notificaciones dentro de la web, sin correo.

## S3 · Reemplazar el CV de una postulación Enviada

- [ ] Spec creada:
- **Fuente:** `docs/pendientes-constitucion.md` §3.
- **Antes:** decisión de producto: ¿entra ahora o queda para una fase posterior?

> Reemplazar el CV de una postulación Enviada. Mientras la empresa no la haya revisado, el estudiante puede cambiar
> el CV copiado en su postulación. La empresa ve la versión vigente y la fecha del cambio. Después de «En revisión»,
> ya no se puede.

## S4 · Supresión de la cuenta

- [ ] Spec creada:
- **Fuente:** `docs/produccion.md` §5 (flujo de supresión), Ley 1581.
- **Antes:** se dejó fuera del MVP el 2026-10-08; hace falta antes de usar datos reales. El esquema ya separa los
  datos personales del historial.

> Supresión de la cuenta (Ley 1581). El usuario pide eliminar su cuenta. Se anonimizan sus datos personales, se
> conserva el historial de postulaciones y vacantes sin identificarlo (V), y se borran del bucket el CV, el soporte
> del aval y la foto, incluidas las copias que quedaron en las postulaciones. Cierra todas las sesiones.
