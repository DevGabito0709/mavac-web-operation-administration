# MAVAC Web – Operación y Administración

Backend de la aplicación web de operaciones y administración de MAVAC (cobranzas, credenciales y oficina). Servidor Node.js con Express que sirve vistas EJS, autenticación JWT, integración con PostgreSQL y APIs para cobranzas (incluyendo automatizaciones Python).

---

## Resumen

| Aspecto | Detalle |
|--------|---------|
| **Stack** | Node.js 20+, Express 5, EJS, PostgreSQL, JWT, bcrypt |
| **Propósito** | Login, panel de oficina, cobranzas y administración con integración a Excel/OneDrive y automatizaciones |
| **Documentación** | Ver carpeta [`/docs`](./docs/README.md) para arquitectura, propósito y guías de despliegue |

---

## Requisitos

- **Node.js** 20+ (recomendado usar [nvm](https://github.com/nvm-sh/nvm); el proyecto incluye `.nvmrc` con versión 24)
- **PostgreSQL** 15+
- **Variables de entorno** (ver sección [Configuración](#configuración))

---

## Instalación rápida

```bash
# Clonar y entrar al proyecto
git clone <url-repo>
cd mavac-web-operation-administration

# Usar la versión de Node indicada
nvm use   # o: node -v  → debe ser 20+

# Dependencias
npm install

# Copiar y editar variables de entorno
cp .env.example .env
# Editar .env con DB_*, JWT_SECRET, FRONT_ORIGIN, COOKIE_DOMAIN, etc.
```

---

## Base de datos

1. Crear base de datos y usuario (por ejemplo `web_proyectus`).
2. Ejecutar el script SQL de esquema:

   ```bash
   psql -U postgres -d web_proyectus -f base_datos/web_proyectos.sql
   ```

3. (Opcional) Poblar credenciales iniciales:

   ```bash
   npm run seed
   ```

   **Nota:** El seed usa las contraseñas definidas en `seed_credenciales.js`; en producción no uses ese archivo con datos reales y gestiona usuarios de forma segura.

---

## Configuración

Variables de entorno mínimas para arrancar la aplicación:

| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto del servidor (ej. 3000 o 4000) |
| `JWT_SECRET` | Clave secreta para firmar tokens JWT |
| `FRONT_ORIGIN` | Origen permitido por CORS (URL del frontend) |
| `COOKIE_DOMAIN` | Dominio de las cookies (ej. `localhost` en dev) |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Conexión PostgreSQL |

Otras variables (Excel/OneDrive, Microsoft Graph, SMTP, etc.) se documentan en [docs](./docs/).

---

## Scripts

| Comando | Uso |
|---------|-----|
| `npm start` | Arrancar en producción (`node server.js`) |
| `npm run dev` | Desarrollo con recarga automática (nodemon) |
| `npm run seed` | Ejecutar seed de credenciales (requiere DB configurada) |

---

## Estructura del proyecto

```
├── server.js                 # Punto de entrada
├── routes/                   # Rutas por módulo (public, auth, inicio_oficina, cobranzas, administracion, cobranzas.api)
├── middlewares/              # auth, csrf, rateLimit
├── base_datos/               # db.js (pool PG) y web_proyectos.sql
├── utils/                    # logger, csrfToken
├── views/                    # Plantillas EJS (pages, partials)
├── public/                   # Estáticos (shared, modules)
├── docker/                   # Dockerfile, docker-compose (dev y prod)
├── docs/                     # Documentación (arquitectura, despliegue)
└── .dockerignore             # Excluye node_modules, .env, etc. del build
```

Detalle en [docs/03-estructura-del-proyecto.md](./docs/03-estructura-del-proyecto.md).

---

## Despliegue

- **Opción A – Servidor (PM2 + Nginx + Certbot):** [docs/04-despliegue-pm2-nginx-certbot.md](./docs/04-despliegue-pm2-nginx-certbot.md)
- **Opción B – Docker:** [docs/05-despliegue-docker.md](./docs/05-despliegue-docker.md)

---

## Documentación

| Documento | Contenido |
|-----------|-----------|
| [docs/README.md](./docs/README.md) | Índice de la documentación |
| [docs/01-arquitectura.md](./docs/01-arquitectura.md) | Arquitectura del sistema |
| [docs/02-proposito-y-alcance.md](./docs/02-proposito-y-alcance.md) | Propósito y alcance del proyecto |
| [docs/03-estructura-del-proyecto.md](./docs/03-estructura-del-proyecto.md) | Estructura de carpetas y archivos |
| [docs/04-despliegue-pm2-nginx-certbot.md](./docs/04-despliegue-pm2-nginx-certbot.md) | Producción con PM2, Nginx y Certbot |
| [docs/05-despliegue-docker.md](./docs/05-despliegue-docker.md) | Producción con Docker |

---

## Licencia

ISC (según `package.json`).
