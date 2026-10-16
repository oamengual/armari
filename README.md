# ARMARI — Tu Armario Inteligente & Estilista IA

Aplicación web progresiva (**Next.js + Supabase + Google Gemini 2.5 Flash + Open-Meteo**) de estética **Minimalista Editorial** para fotografiar tu ropa, eliminar el fondo automáticamente en el navegador, catalogar prendas con visión artificial y planificar tus outfits diarios, semanales y de viaje.

---

## ✨ Funcionalidades Principales

1. **Digitalización de Prendas sin Fondo (`@imgly/background-removal`)**:
   * Haz una foto con el móvil o súbela de la galería.
   * Recorte automático de fondo 100% gratuito en el navegador (PNG transparente estilo revista).
   * Auto-catalogación con **Gemini 2.5 Flash (Visión)**: detecta nombre, categoría, subcategoría, color hexadecimal, tejido, nivel de abrigo, temporadas y ocasiones.
2. **Collage Moodboard Editorial**:
   * Composición visual automática de tus conjuntos (Abrigo + Parte Superior + Parte Inferior + Calzado + Accesorios).
   * Botón **Cambiar prenda individual (Swap)** para rotar una sola pieza del look.
3. **Estilista Diario + Planificador Semanal (7 días)**:
   * Conectado en tiempo real al pronóstico meteorológico de tu ciudad vía **Open-Meteo API**.
   * Respeta el estado **"En lavadora / Sucio"** y tu regla configurable de **no repetir prendas en X días**.
4. **Modo Maleta de Viaje (Travel Capsule Wardrobe)**:
   * Introduce destino, días, tipo de equipaje y planes: la IA selecciona una cápsula compacta de tu armario con checklist interactiva y looks día por día.
5. **Estadísticas y Sostenibilidad**:
   * Valor del armario, **Coste por Uso (€/uso)** y detección de prendas olvidadas.

---

## 🚀 Guía Paso a Paso (De Cero a Producción)

### Paso 1: Obtener tu API Key gratuita de Google Gemini (1 minuto)
1. Entra en [Google AI Studio](https://aistudio.google.com/apikey).
2. Pulsa **"Create API key"** y copia la clave generada (`AIzaSy...`).

### Paso 2: Crear tu proyecto en Supabase (2 minutos)
1. Entra en [Supabase](https://supabase.com/dashboard) y pulsa **"New Project"**.
2. Ponle de nombre `armari` y elige una contraseña para la base de datos.
3. Una vez creado el proyecto, ve en el menú izquierdo a **SQL Editor** -> **"New query"**.
4. Abre el archivo [`supabase/schema.sql`](./supabase/schema.sql) de este proyecto, copia todo su contenido, pégalo en el editor SQL de Supabase y pulsa **Run**. *(Esto creará las tablas `profiles`, `garments`, `outfits`, `calendar_plans`, `trips`, las políticas de seguridad RLS y el bucket `garments` para las fotos).*
5. Ve a **Project Settings (icono de engranaje) -> API** y copia:
   * `Project URL` (`NEXT_PUBLIC_SUPABASE_URL`)
   * `anon public` key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### Paso 3: Configurar en local y probar
1. Duplica el archivo `.env.example` como `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Pega tus 3 claves en `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbG..."
   GEMINI_API_KEY="AIzaSy..."
   ```
3. Instala las dependencias y arranca el servidor de desarrollo:
   ```bash
   npm install
   npm run dev
   ```
4. Abre `http://localhost:3000`.

### Paso 4: Subir a GitHub y Desplegar en Vercel
1. Sube este repositorio a tu cuenta de GitHub.
2. Entra en [Vercel](https://vercel.com/new) e importa tu repositorio `ARMARI` desde GitHub.
3. En la sección **Environment Variables** de Vercel, añade las mismas 3 variables:
   * `NEXT_PUBLIC_SUPABASE_URL`
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   * `GEMINI_API_KEY`
4. Pulsa **Deploy**. ¡En menos de 1 minuto tendrás tu URL pública lista para instalar en la pantalla de inicio de tu móvil!
