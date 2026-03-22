# Despliegue en Render (DocenTrack)

## Servicios

| Componente | Ejemplo de URL |
|------------|----------------|
| Frontend (Static Site) | `https://docentrack-web.onrender.com` |
| API (Web Service) | `https://docentrack-api.onrender.com` |
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
| `RUN_SEED` | Opcional: solo el valor exacto **`true`** ejecuta `seed_data` en el build. **Borra la variable** o déjala vacía en producción (no hace falta poner `false`). Repetir `RUN_SEED=true` en cada deploy **no suele romper el login** (las contraseñas demo solo se asignan al crear usuarios), pero alarga el build y puede acercarte al límite de tiempo de Render. |

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

### Comprobar que la API responde y que CORS está bien (desde tu PC)

Sustituye las URLs si las tuyas son distintas.

**Salud del servicio (sin CORS):**

```bash
curl -sS -o /dev/null -w "%{http_code}" https://docentrack-api.onrender.com/api/token/
```

Debería devolver **405** (Method Not Allowed) o **400** — significa que el servidor Django está vivo. Si da **000** o timeout, el servicio está dormido o caído (espera y reintenta en el plan gratuito).

**Preflight CORS (lo que hace el navegador antes del login):**

```bash
curl -sS -D - -o /dev/null -X OPTIONS "https://docentrack-api.onrender.com/api/token/" ^
  -H "Origin: https://docentrack-web.onrender.com" ^
  -H "Access-Control-Request-Method: POST" ^
  -H "Access-Control-Request-Headers: content-type,authorization"
```

En **Windows PowerShell** usa comillas simples o `curl.exe` y cabeceras sin `^`:

```powershell
curl.exe -sS -D - -o NUL -X OPTIONS "https://docentrack-api.onrender.com/api/token/" `
  -H "Origin: https://docentrack-web.onrender.com" `
  -H "Access-Control-Request-Method: POST" `
  -H "Access-Control-Request-Headers: content-type,authorization"
```

Debes ver en la respuesta algo como: `access-control-allow-origin: https://docentrack-web.onrender.com` (o el mismo origen que enviaste).

**Login real (POST):**

```bash
curl -sS -X POST "https://docentrack-api.onrender.com/api/token/" ^
  -H "Content-Type: application/json" ^
  -H "Origin: https://docentrack-web.onrender.com" ^
  -d "{\"username\":\"alumno1\",\"password\":\"alumno123\"}"
```

Si devuelve JSON con `access` y `refresh`, la API y la BD están bien; si el navegador sigue fallando, el problema es casi seguro **CORS** o **`VITE_API_URL`** antigua en el build del frontend.

## 5. Plan gratuito

- **Cold start**: el API puede tardar tras inactividad.
- Si recreas la base de datos, vuelve a ejecutar migraciones y `seed_data` (o usuarios manuales).

---

## 6. El login dejó de funcionar tras redeploy

### ¿`RUN_SEED` olvidado en `true`?

No es la causa más habitual: `seed_data` **no cambia** las contraseñas de usuarios que ya existían (solo las pone al crearlos). Sí puede:

- Hacer el **build más lento** (riesgo de timeout en plan gratuito).
- Fallar el build si hay un error en el seed (menos común).

**Qué hacer:** en el servicio **API** → **Environment**, **elimina** `RUN_SEED` o deja de poner `true`. Vuelve a desplegar solo el API.

### Otras causas frecuentes de 401

1. **Credenciales**: en producción no son las de tu SQLite local. Usa `alumno1` / `alumno123` (u otras del seed) o restablece con el comando de abajo.
2. **`CORS_ALLOWED_ORIGINS`** o **`VITE_API_URL`** cambiados o mal escritos (URL del frontend/API). El frontend debe apuntar al **mismo host** que la URL pública del Web Service (ej. `https://docentrack-api.onrender.com/api/`), no a otro subdominio antiguo.
3. **Frontend sin rebuild** tras cambiar `VITE_*` (esas variables se inyectan en **build**).
4. **Error “blocked by CORS policy” / sin `Access-Control-Allow-Origin`**: a menudo es **`DisallowedHost`** en Django (host del API no permitido). El código añade `.onrender.com` en `ALLOWED_HOSTS` cuando existe la variable de entorno `RENDER` (Render la define automáticamente). Tras actualizar `settings.py`, **vuelve a desplegar el servicio API**.
4. **Base de datos nueva o vacía** tras un reset.

### Recuperar contraseñas demo sin borrar datos

En **Render → API → Shell**:

```bash
cd backend   # si hace falta; a veces el cwd ya es el del proyecto
python manage.py seed_data --force-passwords
```

Esto restablece contraseñas conocidas para `admin`, `profesor1`, `profesor2`, `alumno1`…`alumno10` sin duplicar encuestas ni respuestas.

Si no existen usuarios, ejecuta una vez:

```bash
python manage.py seed_data
```

---

## 7. Ver la base de datos de producción “en tiempo real”

Render no incluye un phpMyAdmin integrado para PostgreSQL, pero puedes:

### Opción A — Datos sensibles desde Render (rápido)

1. **Dashboard** → tu servicio **PostgreSQL** → pestaña **Info** (cadena de conexión interna/externa).
2. **API → Shell** y ejecuta:

   ```bash
   python manage.py dbshell
   ```

   (SQL crudo; escribe `\q` para salir si es `psql`.)

3. O **Django**:

   ```bash
   python manage.py shell
   ```

   Ejemplo:

   ```python
   from django.contrib.auth.models import User
   User.objects.values_list('username', flat=True)
   ```

### Opción B — Cliente gráfico (DBeaver, pgAdmin, TablePlus)

1. En el **PostgreSQL** de Render, copia **External Database URL** (o host, puerto, usuario, contraseña, base de datos).
2. En el plan **gratis**, a veces hace falta **añadir tu IP** en “Inbound IP restrictions” si Render lo ofrece para tu instancia.
3. Conecta con SSL (suele ser obligatorio).

### Opción C — Solo lectura / backups

Render permite **exportar** o snapshots según plan; revisa la documentación actual de [Render PostgreSQL](https://render.com/docs/databases).

### Nota de seguridad

No compartas la URL de conexión ni el `.env` en público; rota credenciales si se filtran.
