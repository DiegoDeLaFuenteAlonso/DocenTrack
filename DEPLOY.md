# Despliegue en Render (DocenTrack)

## Servicios

| Componente | Ejemplo de URL |
|------------|----------------|
| Frontend (Static Site) | `https://docentrack-web.onrender.com` |
| API (Web Service) | `https://docentrack.onrender.com` |
| PostgreSQL | Variable `DATABASE_URL` en el servicio API |

Ajusta los nombres si tus servicios en Render tienen otros subdominios.

## 1. Rutas SPA (`/login`, refrescar, enlaces directos)

React Router necesita que **todas las rutas** sirvan `index.html` (rewrite, no redirect).

- En **[render.yaml](render.yaml)** el static site incluye `routes` (`/*` → `/index.html`). Si usas **Blueprint**, despliega desde el repo para aplicarlas.
- Si el sitio estático se creó **solo en el dashboard** y sigues viendo 404 en `/login`:
  - **Static Site** → **Redirects / Rewrites** → **Rewrite**: Source `/*`, Destination `/index.html`.
- También se publica **`frontend/public/_redirects`** (formato Netlify) en `dist/` por si el CDN lo interpreta.

Tras cambiar reglas, **vuelve a desplegar** el static site.

## 2. Variables de entorno

### Frontend (build time)

| Variable | Ejemplo |
|----------|---------|
| `VITE_API_URL` | `https://TU-API.onrender.com/api/` |

Debe terminar en **`/api/`** (barra final). Tras cambiarla, **vuelve a hacer build** del frontend.

### API (runtime)

| Variable | Descripción |
|----------|-------------|
| `CORS_ALLOWED_ORIGINS` | Origen del frontend, separado por comas si hay varios. Ej: `https://docentrack-web.onrender.com` |
| `RUN_SEED` | Opcional: `true` solo en el **primer deploy** (o cuando quieras datos demo) para ejecutar `seed_data` en el build. Luego quítala o pon `false`. |

Los orígenes en `CORS_ALLOWED_ORIGINS` pueden llevar espacios tras comas; el backend hace **strip** automático.

## 3. Login 401 en producción

La base de datos de **Render es distinta** de tu SQLite local. Hasta crear usuarios, `POST /api/token/` devolverá **401**.

### Opción A — Datos demo (`seed_data`)

1. En Render: **Web Service (API)** → **Shell** (o un deploy con `RUN_SEED=true` solo una vez).
2. Ejecuta:

   ```bash
   python manage.py seed_data
   ```

3. Credenciales de ejemplo (ver [seed_data.py](backend/evaluations/management/commands/seed_data.py)):

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `admin` | `admin123` | ADMIN |
| `profesor1` | `profesor123` | PROFESOR |
| `alumno1` | `alumno123` | ALUMNO |

### Opción B — Usuario manual

```bash
python manage.py createsuperuser
```

Y en el admin de Django, crea perfiles según tu modelo.

## 4. Comprobaciones

1. Abre `https://TU-FRONTEND.onrender.com/login` en ventana privada → debe cargar la app (no 404).
2. Refresca en `/login` → misma página.
3. Inicia sesión con un usuario existente en PostgreSQL → debe devolver **200** y redirigir según rol.

## 5. Plan gratuito

- **Cold start**: el API puede tardar tras inactividad.
- Si recreas la base de datos, vuelve a ejecutar migraciones y `seed_data` (o usuarios manuales).
