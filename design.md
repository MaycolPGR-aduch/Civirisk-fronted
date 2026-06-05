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
  * “2. Supabase activa el motor ML”
  * “3. Se genera PI24”
  * “4. El mapa y dashboard se actualizan”

No usar lenguaje alarmista. Mantener tono preventivo.

## 12. Riesgo visual

Componente `RiskBadge` debe representar:

* bajo
* medio
* alto

Debe ser consistente en todo el sistema.

Ejemplo visual:

* Bajo: badge verde
* Medio: badge ámbar
* Alto: badge rojo

El score se interpreta así:

* 0 a 39: bajo
* 40 a 69: medio
* 70 a 100: alto

## 13. Mapa

Aunque la primera versión pueda tener placeholder, debe reservarse espacio para:

* mapa central,
* filtros,
* leyenda,
* capas de riesgo,
* marcadores.

La leyenda debe mostrar:

* Robo
* Accidente
* Zona oscura
* Emergencia
* Riesgo bajo
* Riesgo medio
* Riesgo alto

Cuando se implemente Leaflet:

* no saturar con muchos popups abiertos,
* usar colores por riesgo,
* usar iconos por tipo de incidente,
* mantener controles visibles.

## 14. Dashboard

El dashboard debe priorizar:

* ranking de riesgo,
* últimas predicciones,
* alertas recientes,
* reportes recientes,
* distribución por tipo de incidente.

Evitar mostrar demasiadas métricas sin contexto.

Cada KPI debe indicar:

* qué mide,
* valor,
* periodo o explicación breve.

## 15. Alertas

Las alertas deben mostrarse en lista o cards.

Cada alerta debe incluir:

* título,
* mensaje,
* zona,
* tipo de incidente,
* nivel de riesgo,
* score,
* fecha/hora.

Ordenar por más reciente primero.

Riesgo alto debe verse importante, pero no exagerado.

## 16. Estados de interfaz

Toda pantalla que cargue datos debe tener:

* estado loading,
* estado error,
* estado vacío.

Ejemplos:

* Loading: “Cargando predicciones…”
* Empty: “Aún no hay predicciones registradas.”
* Error: “No se pudieron cargar los datos.”

## 17. Reglas de código mantenible

### Separar responsabilidades

No colocar toda la lógica en `App.jsx`.

Usar:

* `services/` para Supabase.
* `utils/` para helpers.
* `data/` para constantes.
* `components/ui/` para componentes reutilizables.
* `components/layout/` para layout.
* `pages/` para pantallas.

### Servicios

Los servicios deben encapsular llamadas a Supabase.

Ejemplo:

* `reportsService.createReport(payload)`
* `predictionsService.getRiskPredictions()`
* `authService.signIn(email, password)`

Las páginas no deberían repetir consultas largas.

### Componentes

Los componentes deben:

* tener nombres claros,
* recibir props simples,
* evitar lógica innecesaria,
* ser reutilizables cuando tenga sentido.

### Manejo de errores

Todas las operaciones async deben usar try/catch o devolver errores controlados.

Nunca ocultar errores de Supabase. Mostrar mensaje simple al usuario y dejar `console.error` para depuración.

### Constantes

No repetir listas de zonas, tipos o niveles de riesgo en muchas pantallas.

Usar:

* `src/data/zones.js`
* `src/utils/risk.js`

### Nombres

Usar nombres en inglés para campos que coinciden con base de datos:

* `type`
* `severity`
* `zone_name`
* `lighting`
* `people_flow`

Usar textos visibles en español para el usuario:

* “Tipo de incidente”
* “Severidad”
* “Zona”
* “Iluminación”
* “Flujo de personas”

## 18. Seguridad frontend

Nunca colocar `SUPABASE_SERVICE_ROLE_KEY` en el frontend.

Solo usar:

* `VITE_SUPABASE_URL`
* `VITE_SUPABASE_ANON_KEY`

La seguridad de acceso debe apoyarse en:

* Supabase Auth
* Row Level Security
* políticas de base de datos

## 19. Accesibilidad básica

* Botones con texto claro.
* Inputs con label.
* Contraste suficiente.
* No depender solo del color para indicar riesgo; también mostrar texto.
* Estados focus visibles.
* Evitar textos muy pequeños en formularios.

## 20. Criterio de aceptación visual

La primera versión del frontend se considera aceptable si:

* Login y registro se ven profesionales.
* El layout principal tiene sidebar/topbar.
* El formulario permite insertar reportes correctamente.
* Home muestra una visión general limpia.
* Dashboard puede listar predicciones si existen.
* Alertas puede listar alertas si existen.
* Mapa tiene una estructura visual lista para integración.
* El diseño se mantiene consistente en todas las páginas.
