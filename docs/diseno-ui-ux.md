# Guía de diseño UI/UX de Praxis (plugin ui-ux-pro-max)

> Creado el 2026-11-11. Recoge cómo se usó el plugin **ui-ux-pro-max** para auditar y rediseñar los mockups de
> `docs/praxis-mockups.pen` (M6 hacia abajo y módulos propuestos S2, S3, S4 y Administrador). Sirve para repetir el
> mismo proceso en módulos nuevos. La constitución (`.specify/memory/constitution.md`) manda sobre esta guía.

## 1. El plugin

- **Qué es:** un plugin de Claude Code (skill, no MCP) con reglas de UI/UX y un buscador local en Python.
  Repositorio: `nextlevelbuilder/ui-ux-pro-max-skill`.
- **Instalación** (a nivel de usuario, no toca el repo):

  ```bash
  claude plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
  claude plugin install ui-ux-pro-max@ui-ux-pro-max-skill
  ```

  Se carga al abrir una sesión nueva de Claude Code. Requiere Python 3.
- **Buscador:** `~/.claude/plugins/cache/ui-ux-pro-max-skill/ui-ux-pro-max/<versión>/.claude/skills/ui-ux-pro-max/scripts/search.py`

  ```bash
  python -I search.py "<consulta de 2 a 5 términos>" --domain ux -n 2
  python -I search.py "job board recruitment" --design-system -p "Praxis"
  ```

  En Windows, exportar `PYTHONIOENCODING=utf-8` antes de ejecutarlo. Una intención por consulta; si sale vacío o
  fuera de tema, reintentar una vez con términos más concretos.

### Consultas que sirvieron

| Necesidad | Consulta |
|---|---|
| Estilo para el producto | `"job board education internship portal" --domain product` |
| Sistema de diseño | `"job board recruitment" --design-system -p "Praxis"` |
| Responsive | `"responsive breakpoints container width" --domain ux` |
| Objetivos táctiles | `"touch target size mobile" --domain ux` |
| Texto en móvil | `"readable font size mobile body" --domain ux` |
| Largo de línea | `"line length measure" --domain ux` |
| Errores de formulario | `"error summary validation" --domain ux` |
| Estados vacíos | `"empty state guidance action" --domain ux` |
| Diálogos destructivos | `"modal dialog confirmation destructive" --domain ux` |
| Carga de archivos | `"file upload progress"`, `"drag drop upload alternative" --domain ux` |
| Tablas | `"data table mobile" --domain ux` |
| Sin resultados | `"search filter empty results" --domain ux` |

## 2. Decisiones de estilo

- **Estilo:** *Flat Design + Minimalism* (lo que el plugin recomienda para «Job Board/Recruitment»): sin sombras ni
  degradados, formas simples, íconos y tipografía como protagonistas.
- **Paleta y tipografía:** se mantiene la de marca (`apps/web/src/app/theme.ts` y variables del `.pen`: `$primary`
  `#1E40AF`, `$secondary` `#F97316`, Poppins para títulos, Inter para cuerpo). El plugin propuso otra paleta y otra
  fuente: **no se adoptaron**; su recomendación «azul profesional + verde de éxito» ya coincide con Praxis.
- **Componentes:** solo los de la librería del `.pen` (Button, Chip de estado, Alert, TextField, Select, Checkbox,
  AppBar, BottomNavigation, Pie). **No se modifican los componentes base**; los ajustes (altura 44 px, color de error)
  van como override de instancia.
- **Íconos:** Material Symbols Rounded, nunca emojis.
- **Lo implementado no se toca desde el diseño:** las diferencias con el código se anotan en una tarjeta «Notas» del
  módulo, no se proponen como cambio de código.

## 3. Reglas aplicadas

### Base (todas las pantallas)

| Regla | Valor en Praxis |
|---|---|
| Viewport móvil | 360 × 740 px; la pantalla mide al menos 740 px y crece si el contenido es más largo |
| Viewport escritorio | 1920 × 1080 px; al menos 1080 px |
| Texto de cuerpo | 16 px, interlineado 1,5 (móvil y escritorio) |
| Texto de detalle | 14 px mínimo (13 px solo en metadatos muy secundarios) |
| Objetivos táctiles en móvil | 44 px de alto; 8 px entre objetivos |
| Botones de texto (enlaces) | padding 12 × 8, alto 44 px en móvil |
| Estados | siempre con texto (Chip o Badge con palabra), nunca solo color (X) |
| Contenido en escritorio | 720 px para lectura, 960–1200 px para listas y tableros |

### Patrones

1. **Resultado primero.** Lo que el usuario quiere saber va arriba: «Puedes postularte», «Tu plan vence…»,
   «Acceso revocado». Se usa un *aviso* (callout): borde izquierdo de 4 px, fondo suave del tono, ícono y título.
2. **Excluyente separado de deseables** (IV). El nivel de formación va en su propia tarjeta; los deseables aparte
   con «No bloquean tu postulación…».
3. **Comparación «Pide / Tú»** en cada requisito, con su Chip (Cumple / No cumple / Falta información). Lo que falta
   se resalta en ámbar. Sin conteos ni porcentajes (III).
4. **Programa sin estado** (II): programas solicitados como *pills*, el programa del estudiante debajo y la pill
   «La empresa revisa la afinidad».
5. **Acción principal siempre visible:** barra de acción fija sobre la navegación en móvil; panel lateral de 360–380 px
   en escritorio (dos columnas).
6. **Estados vacíos:** ícono en círculo, el mensaje real de la app y la acción que ya existe. Nunca una línea suelta.
   «Sin resultados» incluye una sugerencia y «Limpiar búsqueda».
7. **Diálogos:** siempre sobre la pantalla que los abre, con velo `#0B1F4B99`, en móvil y escritorio.
   Móvil: botones apilados a todo el ancho, el principal arriba. Escritorio: diálogo de 520 px, acciones a la derecha.
8. **Acciones destructivas:** botón en `$error`; antes, explicar consecuencias en dos tarjetas «Se borra» (borde rojo,
   cruces) y «Se conserva» (neutra). Confirmación con contraseña cuando la acción es sobre la cuenta.
9. **Historiales como línea de tiempo** (V): punto por evento, el actual relleno.
10. **Cabecera con mosaico de ícono:** cuadro de 48–56 px con fondo suave del tono, título y subtítulo.
11. **Filas de configuración:** mosaico + título + descripción + chevron; la opción destructiva en rojo y al final.
12. **Carga de archivos:** comparación antes → después, zona de carga con botón «Elegir archivo» (alternativa al
    arrastre), PDF máx. 5 MB y error en la propia fila del archivo.
13. **Planes:** tarjeta «Tu plan» (fecha exacta + barra de uso real); planes con precio, «COP · 6 meses» y lo que
    incluyen con marcas de verificación; pill «Pagos de prueba · Wompi sandbox». Sin cuentas regresivas (IX).
14. **Listas de administración:** resumen por estado, filtros como pills, avatar con iniciales; en móvil tarjetas,
    no tabla ancha.
15. **Notificaciones:** ícono por tipo, fondo y borde azul + punto si está sin leer.
16. **Navegación:** la entrada activa coincide con la sección; si la ruta no está en la navegación, ninguna activa.

### Tonos

| Tono | Color | Fondo | Uso |
|---|---|---|---|
| ok | `$success` | `#E8F5E9` | cumple, aprobado, éxito |
| err | `$error` | `#FDECEC` | bloqueo, rechazo, destructivo |
| warn | `$warning` | `#FEF3C7` | falta información, por vencer |
| info | `$primary` | `$primary-soft` | información, ya postulado |
| neu | `$text-muted` | `#F1F5F9` | cerrado, retirado, anonimizado |
| sec | `#C2410C` | `$secondary-soft` | en revisión, plan |

## 4. Proceso para un módulo nuevo

1. Leer la spec y la constitución; listar estados (vacío, error, bloqueo, éxito).
2. Consultar el plugin (sección 1) solo para las preocupaciones del módulo.
3. Diseñar móvil primero y luego escritorio, con los patrones de la sección 3.
4. Pasada de verificación en el `.pen`:
   - pantallas móviles ≥ 740 px y escritorio ≥ 1080 px;
   - texto de cuerpo 16 px, botones 44 px en móvil;
   - sin nodos recortados (`ctx.problems`), sin solapes entre módulos;
   - diálogos con pantalla de fondo en ambos tamaños.
5. Dejar una tarjeta «Notas · Reglas propuestas y decisiones pendientes» en el módulo.

### Checklist antes de entregar

- [ ] Cada estado tiene texto, no solo color.
- [ ] Hay estado vacío, de error y de bloqueo cuando aplica.
- [ ] La acción principal se ve sin desplazarse (barra fija o panel).
- [ ] Las acciones irreversibles explican consecuencias y usan color de error.
- [ ] Ningún dato inventado se presenta como real (IX); los ejemplos son ficticios (VIII).
- [ ] Nada de edad, sexo, estado civil ni foto como requisito (VII).

## 5. Trabajo en Pencil (gotchas)

- El `.pen` está cifrado: solo se toca con las herramientas de Pencil; hay que **guardar desde la app** (Ctrl+S).
- En `execute`, las funciones globales **no persisten** entre llamadas; los strings sí. Los ayudantes se guardan como
  texto en la variable global `SRC` y se cargan con `eval(SRC)` al inicio de cada llamada. Si la app se reinicia,
  `SRC` se pierde y hay que redefinirla.
- Ayudantes usados: `H.screenM/H.screenD` (pantallas con AppBar y navegación por rol), `H.both` (móvil + escritorio),
  `H.group/H.regroup` (grupo de pantallas y reemplazo en su sitio), `H.ovl` (diálogo sobre pantalla), `H.callout`,
  `H.tile`, `H.head`, `H.pill`, `H.timeline`, `H.setrow`, `H.two`, `H.polishM` (44 px y alto mínimo), `H.fixD`.
- Los marcos raíz tienen `depth` 0 en los visitantes de `Get`.
- La salida de `execute` lista todos los nodos con nombre: no nombrar textos sueltos para no saturar el contexto.
- Al crecer un módulo apilado, reacomodar los de abajo para que no se solapen.

## 6. Auditar la app real

Se hizo con una prueba Playwright temporal (borrada después) que siembra datos por la API y recorre las rutas en
320, 375, 768, 1024, 1440 y 1920 px. Mide: desborde horizontal, axe WCAG 2.2 AA, objetivos < 24 y < 44 px, texto
< 12 px, cuerpo < 16 px en móvil, largo de línea (> 90 caracteres) y ancho del contenido; guarda capturas de página
completa. Resultado del 2026-11-11: 0 desbordes y 0 violaciones axe; hallazgos de diseño en la memoria del proyecto
(fecha de disponibilidad desfasada en `Postulaciones.tsx`, ids crudos de catálogo, botones de 36 px, cuerpo de 14 px
en móvil, anchos de contenido sin token común).
