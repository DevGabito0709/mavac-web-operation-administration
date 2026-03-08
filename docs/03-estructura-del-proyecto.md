# Estructura del proyecto

Organización de carpetas y archivos del backend.

---

## 1. Árbol principal

```
mavac-web-operation-administration/
├── server.js                    # Entrada: Express, middlewares globales, montaje de rutas
├── package.json
├── .nvmrc                       # Node 24
├── .env                         # Variables de entorno (no versionado)
├── .env.example                 # Plantilla (si existe)
├── .dockerignore                # Excluye node_modules, .env, etc. del build (contexto = raíz)
│
├── docker/                      # Configuración Docker
│   ├── Dockerfile               # Imagen Node 20 Alpine para producción
│   ├── docker-compose.yml       # Solo PostgreSQL (desarrollo)
│   └── docker-compose.prod.yml  # Backend + PostgreSQL (producción)
│
├── base_datos/
│   ├── db.js                    # Pool de conexión PostgreSQL
│   └── web_proyectos.sql        # Esquema (tabla credenciales)
│
├── routes/
│   ├── public.routes.js         # "/" → login (EJS), redirecciones
│   ├── auth.routes.js           # /api/login, /api/logout, /api/session, /api/csrf-token
│   ├── inicio_oficina.routes.js # /inicio-oficina (vista)
│   ├── cobranzas.routes.js      # /cobranzas (vista)
│   ├── administracion.routes.js # /administracion (vista)
│   └── cobranzas.api.routes.js # /api/cobranzas/estado, /api/cobranzas/procesar
│
├── middlewares/
│   ├── auth.js                  # authPage, authApi, redirectIfAuthenticated (JWT)
│   ├── csrf.js                  # csrfProtection (cookie + header)
│   └── rateLimit.js             # loginRateLimit, cobranzasRateLimit
│
├── utils/
│   ├── logger.js                # logInfo, logWarn, logError, getClientIp
│   └── csrfToken.js             # generateCsrfToken
│
├── views/
│   ├── layouts/                 # Layout base (si existe)
│   ├── pages/                   # login.ejs, inicio_oficina.ejs, cobranzas.ejs, administracion.ejs
│   └── partials/                # head.ejs, scripts.ejs, sidebar.ejs
│
├── public/
│   ├── shared/                  # Assets compartidos
│   └── modules/                 # CSS/JS por módulo (login, inicio_oficina, cobranzas, administracion)
│
├── seed_credenciales.js         # Script para insertar usuarios de prueba (bcrypt)
└── docs/                        # Documentación
    ├── README.md
    ├── 01-arquitectura.md
    ├── 02-proposito-y-alcance.md
    ├── 03-estructura-del-proyecto.md
    ├── 04-despliegue-pm2-nginx-certbot.md
    └── 05-despliegue-docker.md
```

---

## 2. Rutas HTTP (resumen)

| Ruta | Método | Auth | Descripción |
|------|--------|------|-------------|
| `/` | GET | redirectIfAuth | Página de login |
| `/health` | GET | — | Health check JSON |
| `/api/csrf-token` | GET | — | Devuelve cookie CSRF |
| `/api/login` | POST | — | Login (rate limit) |
| `/api/logout` | POST | authApi + CSRF | Cerrar sesión |
| `/api/session` | GET | authApi | Datos de sesión |
| `/inicio-oficina` | GET | authPage | Vista inicio oficina |
| `/cobranzas` | GET | authPage | Vista cobranzas |
| `/administracion` | GET | authPage | Vista administración |
| `/api/cobranzas/estado` | GET | authApi | Estado de procesos cobranzas |
| `/api/cobranzas/procesar` | POST | authApi + CSRF + rateLimit | Lanzar proceso cobranzas |

Los estáticos se sirven bajo `/shared` y `/modules` desde `public/`.

---

## 3. Convenciones

- **Rutas:** archivos `*.routes.js` en `routes/`, montados en `server.js` sin prefijo adicional (las rutas ya incluyen `/api/...` o paths como `/inicio-oficina`).
- **Vistas:** EJS en `views/pages/`; partials en `views/partials/`. Cada ruta de página pasa `title`, `styles`, `scripts`, y en algunas `sidebarTitle`, `buttons`.
- **Middlewares:** auth y CSRF se aplican por ruta; rate limit solo en login y cobranzas/procesar.
- **Base de datos:** un único pool en `base_datos/db.js`; el esquema inicial está en `base_datos/web_proyectos.sql`.
