# CiviRisk AI - Frontend Dashboard

Esta es la interfaz de usuario de **CiviRisk AI**, una plataforma moderna de seguridad ciudadana que integra reportes en tiempo real, mapas de calor interactivos y predicción de riesgo mediante Inteligencia Artificial (motor predictivo PI24).

---

## 🛠️ Tecnologías y Librerías

El proyecto está construido sobre el siguiente stack de frontend:

* **React** con **Vite** para HMR ultra-rápido.
* **React Router DOM v7** para enrutamiento dinámico y protección de rutas.
* **Supabase JS Client** para autenticación, inserción de datos y suscripciones en tiempo real.
* **Tailwind CSS v4** con `@tailwindcss/vite` para un diseño de UI moderno y premium.
* **Lucide React** para iconografía.
* **Recharts** para visualización interactiva de gráficos de riesgo.
* **Leaflet y React Leaflet** (preparado para futura integración cartográfica completa).

---

## 🏗️ Arquitectura Funcional y Flujo de Predicción

El sistema opera bajo un flujo desacoplado donde el frontend **nunca llama directamente al motor de Machine Learning**:

```
[ Ciudadano ]
      │
      ▼ (Llena formulario de incidente)
[ React Frontend ] ───(Inserta reporte)───► [ Supabase PostgreSQL (reports) ]
                                                        │
                                                        ▼ (Gatilla automáticamente)
                                            [ Database Webhook (HTTP POST) ]
                                                        │
                                                        ▼
                                            [ FastAPI ML Backend ]
                                                        │
                                                        ▼ (Calcula PI24 score)
                                            [ Supabase (risk_predictions & alerts) ]
                                                        │
      ▲                                                 │
      └───────(Escucha cambios vía Realtime)────────────┘
```

1. **Usuario** inicia sesión o se registra.
2. Accede a la ruta `/app/reportar` y llena los atributos del incidente (iluminación, afluencia, severidad, tipo y zona urbana).
3. El frontend de React inserta el reporte en Supabase en la tabla `reports`.
4. El **Supabase Database Webhook** reacciona instantáneamente llamando a la API del backend ML en FastAPI.
5. El backend ML calcula la estimación de probabilidad de riesgo **PI24** y guarda la predicción en la tabla `risk_predictions` (además de gatillar alertas críticas en la tabla `alerts` si el riesgo supera el umbral alto).
6. El frontend de React recibe la actualización mediante las suscripciones realtime de Supabase y refresca dinámicamente los gráficos, listados y el mapa.

---

## 🚀 Instrucciones de Inicio Rápido

Siga estos pasos para ejecutar y probar la aplicación localmente:

### 1. Instalar Dependencias

Clona o navega al directorio del proyecto y ejecuta:
```bash
npm install
```

### 2. Configurar Variables de Entorno

Copie el archivo `.env.example` para crear su archivo `.env` local:
```bash
cp .env.example .env
```
Abra el archivo `.env` y configure las credenciales de Supabase:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-publica
VITE_BACKEND_URL=http://127.0.0.1:8000
```
> **Importante**: Nunca use la clave de rol de servicio (`service_role`) en el frontend.

### 3. Ejecutar en Desarrollo

Inicie el servidor de desarrollo local de Vite:
```bash
npm run dev
```
La aplicación estará disponible por defecto en `http://localhost:5173`.

### 4. Crear un Usuario de Prueba

1. Diríjase a la ruta `/register`.
2. Ingrese su Nombre, Correo Electrónico y Contraseña (mínimo 6 caracteres).
3. Una vez registrado, el sistema guardará su nombre en la metadata del perfil (`full_name`) e iniciará sesión automáticamente, redirigiéndole al panel principal (`/app`).

### 5. Probar el Formulario de Reporte

1. Diríjase a la sección **Registrar Incidente** (`/app/reportar`).
2. Rellene los campos. Al seleccionar una **Zona Urbana**, las coordenadas de Latitud y Longitud se autocompletarán de forma segura.
3. Decida si desea enviar el reporte con su usuario registrado o marcar la casilla de **Reportar de forma anónima** (lo que enviará `user_id = null` en el payload).
4. Presione **Enviar Reporte**.

### 6. Confirmación de Operación

1. Verifique en su panel de Supabase que la fila se ha insertado correctamente en la tabla `reports`.
2. Si el backend ML de FastAPI está encendido y el webhook está configurado, observará en las secciones **Dashboard** (`/app/dashboard`) y **Alertas** (`/app/alertas`) cómo las predicciones se actualizan automáticamente sin necesidad de recargar la página.

---

## 🌐 Guía de Despliegue

CiviRisk AI Frontend es una aplicación web SPA (Single Page Application). Puede desplegarse en cualquier proveedor de hosting estático moderno.

### 1. Compilación de Producción

Ejecute el siguiente comando para generar los archivos estáticos optimizados en la carpeta `dist`:
```bash
npm run build
```

### 2. Despliegue en Vercel (Recomendado)

1. Instale la CLI de Vercel o conecte su repositorio de GitHub en el panel web de [Vercel](https://vercel.com).
2. Configure los parámetros de build:
   - **Framework Preset**: `Vite` (o `Other`)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. En la sección **Environment Variables**, agregue:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_BACKEND_URL`
4. Para evitar errores 404 al recargar rutas internas (debido a React Router), cree un archivo `vercel.json` en la raíz con el siguiente contenido:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```

### 3. Despliegue en Netlify

1. Suba su repositorio a GitHub y conéctelo en el panel de [Netlify](https://netlify.com).
2. Configure la build:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
3. Añada las variables de entorno (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_BACKEND_URL`) en la configuración del sitio.
4. Para dar soporte a las rutas internas del Router, cree un archivo `_redirects` dentro de la carpeta `public` (o `dist` después de compilar) con:
   ```text
   /*    /index.html   200
   ```

