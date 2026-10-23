# Praxis — Texto base de producto (para adaptar antes de la constitución)

> Fuente: `docs/Praxis_Metodologia_Tradicional_Final_APA.docx`. No se usan los mockups ni sus `.md`; el stack está en `.specify/memory/constitution.md`.
> Lo marcado como *(propuesta)* no está en el documento: es una inferencia para que el equipo la confirme o la tache.


---

## 1. Qué es Praxis

Praxis es un portal especializado en **prácticas profesionales**. Conecta a estudiantes que están habilitados para
iniciar su práctica con empresas que ofrecen plazas de práctica.

No es una bolsa de empleo general. Tampoco sustituye los trámites oficiales (como el SGVA del SENA o los convenios
institucionales). Cubre la **búsqueda y la preselección**: desde que el estudiante encuentra una vacante hasta que conoce
el resultado de su postulación.

## 2. Para qué sirve

**El problema:** las ofertas de práctica están repartidas en distintos portales y canales, y cada una presenta sus
condiciones de forma diferente (carrera, semestre, aval, modalidad, fechas y duración). El estudiante tiene que revisar
cada vacante a mano para saber si puede aplicar. La empresa recibe postulaciones de personas que no cumplen las
condiciones mínimas.

**Lo que hace Praxis:**
- **Al estudiante** le muestra, vacante por vacante, si cumple cada requisito. Solo le deja postularse cuando cumple los
  excluyentes y le permite seguir el estado de su proceso.
- **A la empresa** le da un espacio para publicar vacantes con requisitos claros y recibir postulaciones ordenadas de
  candidatos que ya cumplen lo mínimo.
- **A ambos** les da un mismo lenguaje: el perfil y la vacante usan los mismos campos estructurados, así que se pueden
  comparar.

**Piloto:** Medellín y el Valle de Aburrá, con estudiantes universitarios, técnicos y tecnólogos.

## 3. Principios inalienables

Ninguna spec, funcionalidad ni decisión de diseño puede romperlos.

1. **Práctica, no empleo.** Todo el producto (datos, filtros y textos) gira en torno a la práctica profesional académica.
   Lo que solo tiene sentido para el empleo general no entra.
2. **Requisitos explícitos y comparables.** Toda vacante declara sus requisitos en campos estructurados, no en texto libre
   que haya que interpretar.
3. **Elegibilidad transparente, sin puntajes.** Cada requisito se muestra como *cumple*, *no cumple* o *falta información*.
   Nunca se usa un porcentaje de afinidad ni un ranking opaco que parezca una probabilidad de contratación.
4. **No se postula a lo que no se cumple.** Solo el nivel de formación es excluyente (actualizado por constitución v4.0.0); si da *no cumple*, el sistema bloquea la postulación
   y **siempre dice por qué**. Consultar la vacante sigue estando permitido. Un dato que falta no bloquea: se muestra
   como *falta información* al estudiante y a la empresa, y el sistema invita a completarlo. La excepción es el
   **perfil mínimo** (nivel de formación, programa y CV): sin él no hay postulación. Lo demás lo decide la
   empresa en la entrevista, no el sistema.
5. **Trazabilidad del proceso.** Cada postulación tiene un estado y un historial que el estudiante puede ver. Ningún cambio
   de estado ocurre en silencio ni se borra. La única excepción es el derecho de supresión del titular de los datos: en
   ese caso el historial se anonimiza, no se borra (sección 8).
6. **Mínimo acceso a los datos.** Cada usuario ve solo lo que necesita para su rol. Los datos y documentos del estudiante
   (como el CV) solo los ven él mismo y las empresas a cuyas vacantes se postuló.
7. **No discriminación.** La edad y otros datos personales sensibles nunca son requisito de acceso ni de postulación.
8. **Protección de datos.** El tratamiento de datos personales sigue la Ley 1581 de 2012, con el RGPD (GDPR) europeo como
   referencia de buenas prácticas. Mientras sea una demostración académica, se usan **solo datos ficticios**.
9. **Honestidad.** Praxis no simula certificaciones, convenios, cifras ni verificaciones que no existen, ni se presenta
   como un trámite oficial.
10. **Claro y accesible para todos.** Los estados se comunican con texto (no solo con color), todo se puede usar con
    teclado y los errores explican qué corregir.
11. **MVP primero.** El alcance aprobado es la referencia. Lo que no sea esencial para el recorrido
    *buscar → comprobar → postular → seguir* va a una fase posterior.

## 4. Tipos de usuario

### 4.1 Visitante (sin sesión)
Un visitante **solo puede ver las 5 últimas vacantes publicadas**. No puede hacer búsquedas ni usar filtros. Para buscar,
ver requisitos o postularse tiene que crear una cuenta.
- **Puede:**
  - Ver la página pública.
  - Ver las **5 últimas vacantes abiertas**, con datos básicos (título, empresa, ciudad, modalidad, carrera y fecha de
    inicio).
  - Registrarse como estudiante o empresa e iniciar sesión.
- **No puede:**
  - **Hacer búsquedas.**
  - **Usar filtros.**
  - Ver cuántas vacantes activas hay en total.
  - Ver más vacantes que esas 5 ni el listado completo.
  - Ver el detalle completo de una vacante, sus requisitos ni si los cumple.
  - Postularse ni guardar vacantes.
  - Ver perfiles de estudiantes, candidatos ni datos no públicos de las empresas.

### 4.2 Estudiante
- **Puede:**
  - Crear y editar su perfil académico (programa, institución, avance académico, aval, disponibilidad) y subir su CV.
  - Buscar y filtrar vacantes por carrera, ciudad, modalidad, fecha de inicio y disponibilidad.
  - Ver el detalle de cualquier vacante abierta, con el estado de cada requisito frente a su perfil.
  - Postularse a las vacantes cuyos requisitos excluyentes cumple.
  - Consultar el estado y el historial de sus postulaciones.
  - Retirar una postulación mientras el proceso siga abierto. El retiro queda registrado en el historial.
- **No puede:**
  - Postularse si un requisito excluyente da *no cumple*.
  - Postularse sin el perfil mínimo completo: nivel de formación, programa y CV.
  - Postularse dos veces a la misma vacante, aunque haya retirado la primera postulación.
  - Ver otros estudiantes, sus perfiles ni sus postulaciones.
  - Ver los candidatos de una vacante ni cambiar el estado de una postulación.
  - Publicar vacantes ni actuar como empresa o administrador.
  - Pagar nada: el acceso del estudiante es gratuito.

#### Aval y habilitación
- El **aval** es la autorización o constancia que emite la institución educativa para hacer la práctica. Estar
  **habilitado** significa cumplir los requisitos académicos y administrativos que exige esa institución.
- Praxis es independiente de las instituciones: el estudiante **declara** su aval y puede subir un soporte documental.
  Esa declaración no equivale a una verificación institucional.
- La comprobación le corresponde a la institución y, cuando proceda, a la empresa. Praxis solo muestra «verificado» si
  existe un proceso real de validación (principio 9).
- **Se incentiva subir el soporte del aval:** el perfil y la postulación invitan a subirlo. *(propuesta)* La empresa ve
  si el aval declarado viene con soporte («Aval declarado, con soporte» o «sin soporte»), sin decir «verificado».

### 4.3 Empresa
Cada empresa tiene **una única cuenta** en Praxis. Desde ella publica vacantes, revisa postulaciones y gestiona sus
procesos de selección.
- **Puede:**
  - Crear y editar el perfil de la empresa.
  - Publicar, editar y cerrar **sus** vacantes, con requisitos estructurados y una fecha de vigencia (sección 5).
  - **Plan gratuito:** publicar hasta **2 vacantes cada 6 meses** sin costo.
  - **Planes de pago** (sección 7), ambos de 6 meses y pagados dentro de la app:
    - **Básico, COP 29.900:** 4 vacantes adicionales.
    - **Ilimitado, COP 59.000:** vacantes ilimitadas.
  - Ver las postulaciones recibidas en **sus** vacantes, con el perfil académico y el CV que el candidato tenía al
    postularse (sección 6).
  - Cambiar el estado de las postulaciones de **sus** vacantes.
- **No puede:**
  - Ver las vacantes en borrador, los candidatos ni los datos de otras empresas.
  - Buscar ni filtrar vacantes de otras empresas. Fuera de las suyas, solo ve lo mismo que un visitante.
  - Buscar ni consultar perfiles de estudiantes que no se postularon a sus vacantes. **En el MVP la empresa recibe
    candidatos; no los busca.** No se descarta una búsqueda de talento a futuro, pero tendría que respetar el
    principio 6.
  - Exigir requisitos discriminatorios (como la edad).
  - Borrar el historial de una postulación ni ocultarle su estado al estudiante.
  - Publicar por encima del límite gratuito sin un plan activo, ni por encima del cupo de su plan.
  - Cobrarle nada al estudiante: el acceso del estudiante siempre es gratuito.
  - Publicar vacantes sin haber confirmado su correo y registrado un NIT válido.

#### Verificación de empresas
La verificación es automática; ninguna persona revisa ni aprueba a la empresa.
- **Correo confirmado:** la empresa solo puede publicar después de confirmar su correo. Esto solo comprueba que el correo
  existe y es suyo.
- **NIT válido:** se valida el formato y el dígito de verificación (algoritmo de la DIAN). Así se detectan NIT mal digitados o
  inventados, pero no se comprueba que la empresa exista.
- **Sin insignia de "verificada":** Praxis no da a entender que revisó algo que no revisó (principio 9). La ficha de la
  empresa dice *"Datos declarados por la empresa"*.
- **El diseño modera:** los requisitos son campos estructurados (no existe un campo de edad) y la vacante exige datos de
  práctica como carrera y semestre (principios 1, 2 y 7).
- **Riesgo aceptado:** puede registrarse una empresa falsa. Es aceptable mientras el piloto sea académico y use solo datos
  ficticios (principio 8).

### 4.4 Administrador (fase posterior, fuera del MVP)
Es una funcionalidad futura sin relevancia para el MVP. Se construye cuando existan los módulos principales
(*buscar → comprobar → postular → seguir*). Su función es **controlar el acceso a la plataforma por motivos legales**,
no gestionar el contenido. El detalle se define cuando entre al alcance.
- **Puede:**
  - Ver los usuarios registrados de cada rol (estudiantes y empresas).
  - Revocar o restaurar el acceso de una cuenta cuando haya un problema legal.
- **No puede:**
  - Intervenir en la creación de perfiles, en la verificación de empresas ni en la creación de vacantes.
  - Intervenir en las postulaciones ni cambiar su estado.
  - Publicar o postularse en nombre de otros.
  - Borrar el historial de una postulación.
- **Alta:** no hay registro público para este rol.

## 5. Vacante

### 5.1 Ciclo de vida

```
Borrador ──publicar──▶ Abierta ──cerrar / vence──▶ Cerrada
```

| Estado | Quién la ve | Recibe postulaciones | Qué puede hacer la empresa |
|---|---|---|---|
| **Borrador** | Solo la empresa | No | Editar todo, publicar o eliminar |
| **Abierta** | Estudiantes (y visitantes si está entre las 5 últimas) | Sí | Editar solo la descripción; cerrar |
| **Cerrada** | La empresa y los estudiantes que se postularon | No | Seguir cambiando el estado de las postulaciones |

- **Publicar** exige correo confirmado, NIT válido y cupo disponible (plan gratuito o de pago). Cada publicación consume
  un cupo.
- **Los requisitos no se editan después de publicar.** A los postulados se les evaluó con esos requisitos, y cambiarlos
  rompería la comparación (principios 2 y 5). Si la empresa necesita otros requisitos, cierra la vacante y publica otra.
- **Fecha de vigencia obligatoria.** Al llegar a esa fecha, la vacante pasa sola a *Cerrada* con el motivo «venció».
  Si la cierra la empresa, el motivo es «cerrada por la empresa». El estudiante ve el motivo.
- **Las postulaciones en curso siguen vivas al cerrar.** Cerrar solo detiene las postulaciones nuevas. La empresa sigue
  revisando y cambiando estados, y el estudiante todavía puede retirarse.
- **No se reabre.** Para volver a ofrecer la plaza, la empresa publica una vacante nueva, que consume otro cupo.
- **Solo se elimina un borrador.** Una vacante que ya se publicó nunca se borra (principio 5).

### 5.2 Requisitos estructurados

Cada requisito compara un campo de la vacante con el mismo campo del perfil del estudiante. Solo el nivel de formación
es **excluyente** (bloquea la postulación si no se cumple; actualizado por constitución v4.0.0). Todos los demás son **deseables**: informan a
la empresa, que decide en la entrevista; el sistema no descarta a nadie por ellos (decisión del 2026-10-17). Si el
perfil no tiene el dato, el resultado es *falta información*: no bloquea, pero la empresa lo ve y al estudiante se le
invita a completarlo.

| Requisito | En la vacante | En el perfil | Cumple si… | Tipo |
|---|---|---|---|---|
| Nivel de formación | Técnico, tecnólogo y/o universitario | El nivel del estudiante | El nivel está entre los aceptados | Siempre excluyente |
| Programa (carrera) | Opcional: de 1 a 5 programas en texto libre | Su programa, en texto libre | No se evalúa: se muestra junto al del estudiante con «La empresa revisa la afinidad» (actualizado por constitución v4.0.0) | Nunca bloquea |
| Avance académico | Semestre mínimo (universitario) o etapa lectiva/productiva (SENA) | Semestre o etapa actual | Actual ≥ mínimo, dentro del mismo nivel | Siempre deseable |
| Aval | ¿Exige aval? (sí/no) | Aval declarado (sí/no) | No se exige, o el estudiante lo declaró | Siempre deseable |
| Fecha de inicio | Fecha de inicio de la práctica | Fecha desde la que está disponible | Disponible ≤ inicio | Siempre deseable |
| Jornada | Tiempo completo o medio tiempo | Jornada disponible | Coinciden | Siempre deseable |
| Idioma | Idioma y nivel mínimo (MCER, de A1 a C2) | Idiomas y nivel declarado | Nivel ≥ mínimo | Opcional; siempre deseable |

- **La modalidad** (presencial, híbrida o remota), **la ciudad** y **la duración** son datos de la vacante y sirven como
  filtros, pero no son requisitos. La ciudad no se compara con el estudiante: en el área metropolitana, que el candidato
  pueda llegar lo decide la empresa en la entrevista.
- **Lo que no existe como requisito:** edad, sexo, estado civil, foto ni cualquier otro dato sensible (principio 7).
- **Sin requisitos en texto libre.** La descripción de la vacante es texto libre, pero Praxis nunca evalúa contra ella.
  La excepción son los programas solicitados, en texto libre y sin evaluación (actualizado por constitución v4.0.0).
- **Cada candidato ve cada requisito por separado.** La empresa ve, para cada candidato, el resultado de cada requisito.
  No hay puntaje ni ordenamiento por afinidad (principio 3).

## 6. Postulación

- **Estados:** Enviada, En revisión, Entrevista, Seleccionada, Rechazada y Retirada.
- *(propuesta)* La empresa mueve los estados entre Enviada y Seleccionada o Rechazada. El estudiante solo puede pasar a
  Retirada, y solo mientras el proceso siga abierto, es decir, antes de Seleccionada o Rechazada.
- **Perfil mínimo para postularse:** nivel de formación, programa y CV son obligatorios. El nivel es el único requisito
  excluyente (actualizado por constitución v4.0.0); si el perfil mínimo faltara, un perfil vacío nunca daría *no cumple* y podría postularse a cualquier
  vacante. El CV es lo que la empresa necesita para decidir. El resto de los datos, incluido el aval (opcional), puede
  quedar en *falta información*.
- **Una postulación por estudiante y vacante.** Se controla en la lógica de negocio y con una restricción única en la base
  de datos `(estudiante, vacante)`.
- **Foto al postularse.** Al postularse se guarda una copia del perfil académico, del CV y del resultado de cada
  requisito. La empresa ve esa copia, aunque el estudiante cambie su perfil después.
- **Se le advierte al estudiante antes de confirmar:** *«La empresa verá tu perfil y tu CV tal como están ahora. Si los
  cambias después, esta postulación no se actualiza.»*

### 6.1 Notificaciones
- **MVP:** solo notificaciones dentro de la web, con un indicador de no leídas.
- **Fase posterior:** envío por correo. En el MVP el único correo es el de confirmación de cuenta.
- *(propuesta)* **Eventos:**
  - El estudiante recibe una notificación cuando cambia el estado de su postulación o cuando se cierra una vacante a la
    que se postuló.
  - La empresa recibe una notificación cuando le llega una postulación nueva o cuando un estudiante se retira.

## 7. Modelo de negocio

**Quién paga:** solo la empresa. El estudiante nunca paga y nunca se le cobra nada, ni directa ni indirectamente.

### 7.1 MVP: freemium con planes semestrales
- **Gratis:** 2 vacantes cada 6 meses por empresa. Alcanza para la pyme que recibe uno o dos practicantes por semestre,
  que es la mayoría y la que llena la plataforma de vacantes.
- **Dos planes de pago**, ambos de 6 meses contados desde que se aprueba el pago:

  | Plan | Precio | Vacantes además de las 2 gratis | Para quién |
  |---|---|---|---|
  | **Básico** | COP 29.900 | 4 adicionales | La empresa que se pasa del límite por poco |
  | **Ilimitado** | COP 59.000 | Ilimitadas | La empresa que recibe muchos practicantes |

- **Duración igual, cupo distinto.** Los dos planes duran lo mismo y solo cambia cuántas vacantes permiten. Así hay un
  solo periodo que controlar. Un plan más corto no conviene, porque un proceso de práctica rara vez se resuelve en
  menos de un semestre.
- *(propuesta)* **Pasar del Básico al Ilimitado:** se paga el Ilimitado completo, empieza un periodo nuevo de 6 meses y
  el Básico termina en ese momento. No hay prorrateo.
- **Cupo del plan Básico:** las 4 vacantes se usan después de las 2 gratis. Las que no se usen vencen con el plan.
- **Renovación manual:** no hay cobros automáticos. Al vencer, la empresa vuelve a pagar si quiere seguir publicando por
  encima del límite gratuito. *(propuesta)* La app le avisa unos días antes de que venza.
- **Al vencer el plan:** las vacantes abiertas siguen hasta su fecha de vigencia, para no cortar los procesos de los
  estudiantes. Lo que cambia es que la empresa vuelve al límite gratuito para publicar vacantes nuevas.
- **Activación automática:** si a la empresa no le queda cupo, la app le ofrece los planes al publicar. El plan se
  activa cuando el pago queda aprobado, sin intervención humana (no hay administrador en el MVP).
- **El cobro entra al MVP.**
- *(propuesta)* **Pasarela en modo de pruebas** mientras el piloto sea académico. No se procesan pagos reales con datos
  ficticios, y la app no simula cobros que no ocurren (principios 8 y 9).
- *(propuesta)* **Periodo móvil:** el límite gratuito cuenta las vacantes publicadas en los últimos 6 meses, contados
  hacia atrás desde hoy.
- *(propuesta)* **Qué cuenta:** cada paso de *Borrador* a *Abierta*. Los borradores no cuentan. Las vacantes cerradas o
  vencidas sí cuentan, porque ya se publicaron. Como no se reabre, no hay doble conteo.

**Por qué este modelo:** las prácticas se mueven por semestres, así que los planes siguen el mismo ritmo que el cupo
gratuito. El Básico le da a la pyme que se pasa del límite una opción barata sin obligarla a pagar el Ilimitado. Al no haber cobro automático, el MVP no necesita cobros recurrentes con tarjeta.

### 7.2 Fase posterior *(propuesta)*, para validar con datos del piloto
- **Convenios con instituciones educativas:** la institución paga por un panel con las postulaciones y los resultados de
  sus estudiantes, y a cambio confirma el aval. Así Praxis podría mostrar «aval verificado» de verdad (principio 9). Es
  la fuente de ingresos con más valor, pero exige convenios formales y el consentimiento del estudiante (sección 8).

### 7.3 Lo que no se vende
- **Datos de estudiantes ni acceso a perfiles** de quien no se postuló (principio 6).
- **Mejor posición pagada** en los resultados ni en la lista de candidatos. Sería un ordenamiento opaco (principio 3).
- **Publicidad** dirigida a estudiantes.

## 8. Protección de datos

La norma aplicable es la **Ley 1581 de 2012**. El **RGPD (GDPR)** se usa como referencia de buenas prácticas.

**En el MVP:**
- **Autorización previa y expresa:** al registrarse, el usuario acepta la política de tratamiento de datos con una casilla
  sin marcar de antemano. La política dice qué datos se recogen y para qué.
- **Minimización:** solo se piden los datos que usan el perfil, los requisitos o la postulación (principio 6).
- **Acceso y rectificación:** el estudiante ve y edita su perfil en cualquier momento.
- **Solo datos ficticios** mientras sea una demostración académica.

**En una fase posterior** (no es del MVP, pero es importante):
- **Eliminación de cuenta (derecho de supresión):** se borran el perfil, el CV, los soportes y las credenciales. Las
  postulaciones se conservan **anonimizadas** («Estudiante eliminado») para que el historial de la empresa no quede con
  huecos (principio 5).
- **Exportación de los propios datos** (portabilidad).
- *(propuesta)* **Diseño desde ya:** separar los datos personales del historial de postulaciones, para que más adelante
  se pueda anonimizar sin rehacer el modelo.

## 9. Matriz de acceso

| Recurso | Visitante | Estudiante | Empresa |
|---|---|---|---|
| Página pública | Ver | Ver | Ver |
| Total de vacantes activas | — | Ver | Ver |
| Buscar y filtrar vacantes | — | Sí | — |
| Comprobar requisitos de una vacante | — | Propio | — |
| Perfil académico del estudiante | — | Ver/editar el suyo | Copia al postularse, solo de quien se postuló |
| CV del estudiante | — | El suyo | Copia al postularse, solo de quien se postuló |
| Perfil de la empresa | Datos públicos | Datos públicos | Ver/editar el suyo |
| Vacantes | Las 5 últimas abiertas, con datos básicos | Ver las abiertas | Crear/editar/cerrar las suyas (gratis: 2 cada 6 meses; más con un plan Básico o Ilimitado; requiere correo confirmado y NIT válido) |
| Postular | — | Sí, si cumple los excluyentes | — |
| Postulaciones | — | Las suyas (estado e historial) | Las de sus vacantes, y cambiar su estado |
| Notificaciones | — | Las suyas | Las suyas |
| Cuentas de usuario | Registrarse | La suya | La suya |

El administrador no aparece en la matriz porque es una fase posterior; su alcance está en 4.4.

## 10. Gobernanza y forma de trabajo

Se define al construir la constitución. Estas ideas son el punto de partida:

- **Jerarquía:** la constitución está por encima de las specs. Si una spec la contradice, la que cambia es la spec.
- **Cambios a la constitución:** por PR, aprobado por el otro integrante del equipo. Lleva versión semántica: *mayor* si se
  quita o se cambia un principio, *menor* si se agrega uno y *parche* si solo se corrige la redacción.
- **Pruebas mínimas:** las reglas críticas tienen pruebas automáticas. Son la elegibilidad y el bloqueo de la
  postulación, el límite de vacantes, los permisos por rol y la regla de una postulación por estudiante y vacante.
- **Definición de terminado:** cumple los criterios de aceptación de su spec, sus pruebas pasan, se revisó en un PR y no
  rompe ningún principio.
- **Accesibilidad:** el objetivo es **WCAG 2.1 nivel AA** (principio 10).

## 11. Pendiente antes de la constitución

1. Confirmar o tachar las *(propuesta)*.
