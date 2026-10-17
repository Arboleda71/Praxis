# Módulos de la primera muestra académica

> Estado al 2026-10-15. Base: `.specify/memory/constitution.md` v1.1.0 y `docs/context(pre-constitucion).md`.
> Los números romanos citan principios de la constitución; «§» cita secciones del contexto de producto.
>
> **Alcance de la muestra:** login, creación de cuenta, perfil (estudiante y empresa) y formulario de vacantes.
> Sirve para diseñar los mockups antes de `/speckit-specify`. Cada módulo es una futura spec con su rama
> (`001-nombre`), en el orden de esta lista.
>
> **Todas las pantallas:** se diseñan primero a 360 px y luego se amplían a escritorio; usan el tema MUI de
> `apps/web/src/app/theme.ts`; los estados se dicen con texto, no solo con color; todo se usa con teclado; los
> errores dicen qué corregir (X). Solo español; fechas en formato colombiano; datos ficticios (VIII).

---

## M0 · Estructura y navegación

**Objetivo:** el esqueleto común para que todos los mockups compartan cabecera, navegación y páginas de error.

**Roles:** visitante, estudiante, empresa.

**Pantallas**
1. Cabecera pública: logo, «Ingresar», «Crear cuenta».
2. Cabecera con sesión, según el rol:
   - Estudiante: «Mi perfil».
   - Empresa: «Perfil de la empresa», «Mis vacantes».
   - Menú de cuenta (ambos): correo de la cuenta y «Cerrar sesión».
3. Página de inicio mínima: qué es Praxis, que es para prácticas y no para empleo (I), y llamados a
   registrarse como estudiante o como empresa.
4. Página no encontrada (404) y página sin permiso (acceso a algo de otro rol).

**Reglas**
- Sin cifras, testimonios ni logos de convenios inventados en el inicio (IX).
- No se presenta como trámite oficial ni reemplaza el SGVA o los convenios (I, IX).
- Pie de página con enlace a la política de tratamiento de datos (VIII).

**Estados:** menú móvil abierto/cerrado; enlace activo marcado con algo más que color.

**Fuera de alcance:** las 5 últimas vacantes para el visitante, buscador, notificaciones.

**Depende de:** nada.

---

## M1 · Cuentas y acceso

**Objetivo:** que estudiantes y empresas creen su cuenta, confirmen el correo e inicien sesión.

**Roles:** visitante (registro, login); estudiante y empresa (cerrar sesión).

**Pantallas**
1. Elegir tipo de cuenta: «Soy estudiante» / «Soy empresa», con una línea de qué puede hacer cada uno.
2. Registro de estudiante.
3. Registro de empresa.
4. «Revisa tu correo»: a qué correo se envió el enlace y botón «Reenviar».
5. Confirmación de correo: éxito (con enlace a completar el perfil) o enlace vencido/inválido (con «Reenviar»).
6. Iniciar sesión.
7. Política de tratamiento de datos (página de texto).

**Campos**
- Ambos: correo, contraseña (con las reglas visibles antes de escribir), confirmar contraseña y casilla de
  autorización de tratamiento de datos **sin marcar**, con enlace a la política (VIII).
- Empresa, además: razón social y NIT con dígito de verificación.
- Nada más: el resto va en el perfil (minimización, VIII).

**Reglas**
- Una sola cuenta por empresa: un NIT ya registrado no se puede volver a registrar (§4.3).
- El NIT se valida con el formato y el dígito de verificación de la DIAN; si falla, el error dice cuál (X).
- Correo ya registrado: mensaje que invita a iniciar sesión.
- Límite de intentos en login y registro, con un mensaje que dice cuánto esperar (XIV).
- El login fallido no revela si el correo existe.
- La confirmación del correo es el único correo del MVP. La empresa no puede publicar sin confirmarlo (§4.3).
- *Técnico (no afecta el mockup):* contraseña con argon2, sesión en cookie `httpOnly`, `Secure`, `SameSite` (XIV).

**Estados:** enviando (botón deshabilitado con texto), error por campo, error general, demasiados intentos,
cuenta sin confirmar al iniciar sesión (aviso con «Reenviar» y acceso permitido al perfil).

**Fuera de alcance:** restablecer la contraseña (feature pendiente, ver abajo), login con Google u otros,
cuenta de administrador, eliminar cuenta.

**Depende de:** M0.

**Preguntas abiertas**
- ¿El estudiante sin correo confirmado puede editar su perfil? Propuesta: sí; solo la empresa queda bloqueada
  para publicar.

---

## M2 · Catálogos compartidos

**Objetivo:** las listas cerradas con las que el perfil del estudiante y los requisitos de la vacante usan los
mismos campos y se pueden comparar (II). No tiene pantallas propias: alimenta los selectores de M3 y M5.

**Catálogos**
| Catálogo | Valores | Lo usan |
|---|---|---|
| Nivel de formación | Técnico, tecnólogo, universitario | M3, M5 |
| Programa | Lista cerrada; semilla ficticia para la muestra | M3, M5 |
| Ciudad | Municipios del Valle de Aburrá | M3, M4, M5 |
| Modalidad | Presencial, híbrida, remota | M5 |
| Jornada | Tiempo completo, medio tiempo | M3, M5 |
| Idioma y nivel | Idiomas + MCER A1, A2, B1, B2, C1, C2 | M3, M5 |
| Avance académico | Semestre o periodo (ver pregunta abierta) | M3, M5 |
| Sector de la empresa | Lista corta | M4 |

**Reglas**
- No existe ningún catálogo de edad, sexo, estado civil ni foto (VII).
- Los catálogos viven en `packages/contracts` para que la web y la API usen los mismos valores.

**Depende de:** nada.

**Preguntas abiertas** (ya en `docs/pendientes-constitucion.md` §3)
- Los técnicos y tecnólogos del SENA no cuentan por semestres: ¿con qué unidad se compara el avance?
- ¿De dónde sale la lista de programas? ¿SNIES?

---

## M3 · Perfil del estudiante

**Objetivo:** que el estudiante declare los datos que después se comparan con los requisitos de las vacantes.

**Roles:** estudiante (solo el suyo, VI).

**Pantallas**
1. Ver mi perfil, con un indicador de «Perfil mínimo: completo / incompleto» y qué falta.
2. Editar perfil por secciones:
   - Formación: nivel, programa, institución, avance académico.
   - Disponibilidad: ciudad de residencia, disponible desde (fecha), jornada.
   - Idiomas: idioma y nivel MCER (0 o más).
   - Aval: «¿Tienes aval de tu institución?» sí/no, y subir el soporte (opcional, recomendado).
   - Hoja de vida: subir o reemplazar el CV.
3. Subida de archivo (CV y soporte del aval): nombre, tamaño, reemplazar, ver.

**Reglas**
- Perfil mínimo = nivel de formación + programa. Sin eso no habrá postulación (IV); el perfil lo dice claro.
- Un campo vacío se muestra como «Falta información» con un enlace para completarlo (IV).
- El aval se rotula «Aval declarado (con soporte)» o «Aval declarado (sin soporte)», nunca «verificado» (IX, §4.2).
- Se invita a subir el soporte del aval, sin obligarlo.
- Archivos: solo PDF de máximo 5 MB; si no cumple, el error dice por qué (XIV).
- No hay campos de edad, sexo, estado civil ni foto (VII). Solo se piden datos que se usan (VIII).
- El estudiante ve y edita su perfil en cualquier momento (derecho de rectificación, §8).

**Estados:** perfil vacío (primera vez, con guía para empezar por el perfil mínimo), guardando, guardado,
error por campo, subiendo archivo (con progreso), archivo rechazado.

**Fuera de alcance:** buscar vacantes, ver elegibilidad, postular, eliminar cuenta, exportar datos.

**Depende de:** M1, M2.

---

## M4 · Perfil de la empresa

**Objetivo:** la ficha pública de la empresa y su habilitación para publicar vacantes.

**Roles:** empresa (ver y editar la suya). Los datos públicos de la ficha los verán otros roles más adelante.

**Pantallas**
1. Ver la ficha de la empresa, con el rótulo «Datos declarados por la empresa».
2. Editar la ficha.
3. Panel «Para publicar vacantes necesitas»:
   - Correo confirmado: hecho / pendiente (con «Reenviar»).
   - NIT válido: hecho / pendiente (con «Corregir NIT»).

**Campos:** razón social, NIT + DV, sector, ciudad, sitio web, descripción, correo y teléfono de contacto.
Logo opcional.

**Reglas**
- Sin insignia de «verificada»; la verificación es automática y solo comprueba correo y NIT (IX, §4.3).
- El NIT se valida con el algoritmo de la DIAN; el error dice qué corregir (X).
- Una sola cuenta por empresa (§4.3).

**Estados:** ficha incompleta (guía para completarla), guardando, guardado, error por campo, habilitada / no
habilitada para publicar.

**Fuera de alcance:** planes y pagos, varios usuarios por empresa, ver candidatos.

**Depende de:** M1, M2.

---

## M5 · Vacantes de la empresa

**Objetivo:** que la empresa cree una vacante con requisitos estructurados, la publique y la gestione.

**Roles:** empresa (solo las suyas, VI, XIV).

**Pantallas**
1. Mis vacantes: lista con título, estado en texto (Borrador / Abierta / Cerrada), fecha de vigencia y acciones.
   Lista vacía con «Crear vacante». Contador «Te quedan N de 2 publicaciones gratis en estos 6 meses».
2. Formulario de vacante por pasos:
   1. Datos generales.
   2. Requisitos.
   3. Revisión: resumen de todo antes de guardar o publicar.
3. Detalle de la vacante (vista de la empresa), con su estado y, si está cerrada, el motivo.
4. Confirmar publicación: avisa que los requisitos ya no se podrán cambiar.
5. Confirmar cierre: avisa que no se puede reabrir.
6. Confirmar eliminación (solo borradores).
7. Publicación bloqueada: dice qué falta (correo, NIT o cupo) y cómo resolverlo.

**Datos generales:** título, descripción (texto libre, no se evalúa), modalidad, ciudad (solo si es presencial
o híbrida), duración, fecha de inicio y fecha de vigencia (obligatoria).

**Requisitos** (§5.2)
| Requisito | Tipo |
|---|---|
| Nivel de formación (uno o varios) | Siempre excluyente |
| Programa (uno o varios, del catálogo) | Siempre excluyente |
| Avance académico mínimo | Excluyente o deseable |
| Exige aval (sí/no) | Excluyente o deseable |
| Ciudad (la de la plaza) | Excluyente o deseable |
| Fecha de inicio | Excluyente o deseable |
| Jornada | Excluyente o deseable |
| Idioma y nivel mínimo (opcional) | Excluyente o deseable |

Cada requisito opcional tiene un selector **Excluyente / Deseable** con una línea que explica la diferencia.

**Reglas**
- Ciclo: Borrador → Abierta → Cerrada. No se reabre (§5.1).
- Borrador: se edita todo y se puede eliminar. Abierta: solo se edita la descripción. Una vacante publicada
  nunca se borra (II, V).
- Publicar exige correo confirmado, NIT válido y cupo. Cada publicación consume un cupo (§5.1).
- Cupo de la muestra: 2 publicaciones gratis cada 6 meses. Sin cupo, se dice claramente y no se ofrece ni se
  simula un pago, porque los planes están fuera de la muestra (IX).
- Los requisitos no se escriben en texto libre ni se evalúan contra la descripción (II).
- No hay campo de edad, sexo, estado civil ni foto (VII).
- Validaciones con mensaje claro: vigencia posterior a hoy; ciudad obligatoria si no es remota; al menos un
  nivel y un programa.
- Al llegar la fecha de vigencia, la vacante pasa sola a Cerrada con el motivo «venció»; si la cierra la
  empresa, el motivo es «cerrada por la empresa».

**Estados:** lista vacía, guardando borrador, borrador guardado, error por campo y por paso, publicada,
cerrada (con motivo), publicación bloqueada.

**Fuera de alcance:** ver postulantes, planes y pagos (Wompi), que el estudiante vea la vacante.

**Depende de:** M1, M2, M4.

---

## Feature pendiente: restablecer la contraseña

> **No olvidar.** Decidido el 2026-10-16: se construye después de la primera muestra. Exige enmendar la
> constitución, porque hoy el único correo del MVP es la confirmación de cuenta.

- **Pantallas:** enlace «¿Olvidaste tu contraseña?» en Iniciar sesión; «Olvidé mi contraseña» (pide el correo y
  siempre responde «Si el correo está registrado, te enviamos un enlace»); «Nueva contraseña» desde el enlace del
  correo (contraseña + confirmar; éxito, o enlace vencido/usado con «Pedir otro enlace»).
- **Reglas:** enlace de un solo uso y de vida corta; la respuesta no revela si el correo existe; al cambiarla se
  cierran las sesiones abiertas; límite de intentos en la solicitud (XIV).
- **Antes de construirlo:** enmienda de la constitución (Notificaciones y fila «Correo» del stack).

## Fuera de la primera muestra

Van en muestras posteriores, en este orden sugerido (recorrido *buscar → comprobar → postular → seguir*, XI):

1. Vista del visitante: las 5 últimas vacantes abiertas.
2. Búsqueda y filtros del estudiante.
3. Detalle de la vacante con la comprobación de cada requisito.
4. Postulación (con la copia del perfil y del CV).
5. Seguimiento de la postulación y candidatos de la empresa.
6. Notificaciones dentro de la web.
7. Planes y pagos con Wompi en modo de pruebas.
8. Administrador (fase posterior al MVP).
