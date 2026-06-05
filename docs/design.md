# CiviRisk AI - Guía de diseño y mantenibilidad frontend

## 1. Objetivo visual

CiviRisk AI debe sentirse como una plataforma profesional de monitoreo ciudadano, no como una página experimental. El estilo debe transmitir confianza, seguridad, claridad y modernidad.

La interfaz debe parecer un dashboard SaaS moderno orientado a:

* reportes ciudadanos,
* monitoreo geográfico,
* analítica de riesgo,
* alertas preventivas,
* toma de decisiones.

## 2. Principios de diseño

### Claridad primero

Cada pantalla debe responder rápidamente:

* ¿Dónde estoy?
* ¿Qué información veo?
* ¿Qué acción puedo realizar?
* ¿Qué significa el nivel de riesgo?

Evitar pantallas sobrecargadas. Usar títulos, subtítulos y jerarquía visual clara.

### Diseño profesional

Usar:

* bordes redondeados,
* sombras suaves,
* colores sobrios,
* buen espaciado,
* cards limpias,
* iconos consistentes,
* estados visuales para loading, error y empty.

Evitar:

* colores demasiado saturados,
* demasiadas animaciones,
* fondos oscuros complejos,
* gradientes exagerados,
* textos largos dentro de cards pequeñas.

### Consistencia

Todos los botones, badges, cards, formularios y tablas deben seguir la misma lógica visual.

La app debe mantener una identidad consistente:

* azul para navegación y acciones principales,
* rojo para riesgo alto,
* ámbar/naranja para riesgo medio,
* verde/esmeralda para riesgo bajo,
* gris/slate para fondos y textos secundarios.

## 3. Paleta de colores recomendada

Usar clases Tailwind aproximadas:

### Color primario

* `blue-600` para botones principales.
* `blue-700` para hover.
* `blue-50` para fondos suaves.
* `blue-100` para estados seleccionados.

### Riesgo bajo

* Texto: `emerald-700`
* Fondo: `emerald-50`
* Borde: `emerald-200`

### Riesgo medio

* Texto: `amber-700`
* Fondo: `amber-50`
* Borde: `amber-200`

### Riesgo alto

* Texto: `red-700`
* Fondo: `red-50`
* Borde: `red-200`

### Neutros

* Fondo app: `slate-50`
* Cards: `white`
* Bordes: `slate-200`
* Texto principal: `slate-900`
* Texto secundario: `slate-500` o `slate-600`

## 4. Tipografía

Usar la fuente por defecto del sistema o Inter si se agrega después.

Jerarquía recomendada:

* Título de página: `text-2xl` o `text-3xl`, `font-bold`, `text-slate-900`
* Subtítulo: `text-sm` o `text-base`, `text-slate-500`
* Título de card: `text-sm`, `font-semibold`, `text-slate-700`
* Métrica principal: `text-2xl`, `font-bold`, `text-slate-900`
* Texto auxiliar: `text-xs` o `text-sm`, `text-slate-500`

## 5. Layout principal

Usar un layout base con:

### Desktop

* Sidebar fijo a la izquierda.
* Contenido principal a la derecha.
* Topbar superior dentro del área principal.
* Máximo aprovechamiento horizontal para mapa/dashboard.

### Mobile

* Sidebar colapsable o navegación superior.
* Cards en una sola columna.
* Formularios con ancho completo.
* Botones grandes y fáciles de tocar.

## 6. Sidebar

El sidebar debe incluir:

* Logo o icono de CiviRisk AI.
* Nombre del sistema.
* Navegación:

  * Inicio
  * Reportar incidente
  * Mapa en tiempo real
  * Dashboard
  * Alertas
* Estado visual de ruta activa.
* Pie pequeño con versión o texto del proyecto.

Estilo:

* Fondo blanco.
* Borde derecho `border-slate-200`.
* Iconos Lucide.
* Item activo con fondo `blue-50`, texto `blue-700`.

## 7. Topbar

Debe incluir:

* Título contextual de la pantalla.
* Nombre o email del usuario.
* Botón de cerrar sesión.
* Opcional: indicador “Sistema en línea”.

No sobrecargar con demasiados elementos.

## 8. Cards

Las cards deben usar:

* `bg-white`
* `border border-slate-200`
* `rounded-2xl`
* `shadow-sm`
* `p-5` o `p-6`

Las cards deben tener:

* título claro,
* valor o contenido principal,
* texto secundario,
* icono opcional.

## 9. Botones

### Botón principal

Usar para acciones principales:

* Registrar incidente
* Iniciar sesión
* Crear cuenta
* Guardar

Clases sugeridas:
`bg-blue-600 text-white hover:bg-blue-700 rounded-xl px-4 py-2.5 font-medium`

### Botón secundario

Usar para navegación secundaria:
`bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-xl px-4 py-2.5 font-medium`

### Botón peligro

Solo para acciones críticas:
`bg-red-600 text-white hover:bg-red-700`

## 10. Formularios

Los formularios deben:

* mostrar labels claros,
* usar placeholders útiles,
* validar campos obligatorios,
* mostrar mensajes de error,
* mantener espaciado vertical suficiente.

Inputs/selects:
`w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100`

Textarea:

* mínimo 4 filas.
* contador opcional si se desea.

Mensajes:

* Éxito: verde suave.
* Error: rojo suave.
* Información: azul suave.

## 11. Formulario de reporte

La página de reporte debe sentirse confiable y rápida.

Debe tener:

* título: “Registrar incidente”
* descripción breve
* formulario en card principal
* panel lateral informativo opcional:

  * “¿Qué pasa después?”
  * “1. Se registra el reporte”
  * ...
