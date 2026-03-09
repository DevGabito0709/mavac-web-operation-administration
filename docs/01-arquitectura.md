# Arquitectura del sistema

Descripción de la arquitectura del backend MAVAC Web Operación y Administración.

---

## 1. Visión general

La aplicación es un **backend monolítico** en Node.js (Express) que:

- Sirve **vistas EJS** (login, inicio oficina, cobranzas, administración).
- Expone **APIs REST** para login, sesión, logout y cobranzas.
- Usa **JWT en cookie** para autenticación y **CSRF** en operaciones sensibles.
- Se conecta a **PostgreSQL** para credenciales.
- Puede invocar **scripts Python** externos para automatizaciones de cobranzas (entidades PACIFICO, RIMAC, POSITIVA, MAPFRE).

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                    Cliente (navegador)                  │
                    │         Origen: FRONT_ORIGIN (CORS + cookies)           │
                    └───────────────────────────┬─────────────────────────────┘
                                                │
                                                ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │              Reverse proxy (Nginx / Caddy)                │
                    │         SSL (Certbot) · Proxy a Node en puerto interno   │
                    └───────────────────────────┬─────────────────────────────┘
                                                │
                                                ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │                 Node.js (Express)                       │
                    │  server.js · Helmet · CORS · cookie-parser · rate-limit  │
                    ├─────────────────────────────────────────────────────────┤
                    │  Rutas: public · auth · inicio_oficina · cobranzas       │
                    │         administracion · cobranzas.api                  │
                    ├─────────────────────────────────────────────────────────┤
                    │  Middlewares: auth (JWT) · CSRF · rateLimit             │
                    └───────────────┬─────────────────────┬───────────────────┘
                                    │                     │
                    ┌───────────────▼───────┐   ┌─────────▼──────────┐
                    │     PostgreSQL        │   │  Proceso Python     │
                    │  (credenciales)       │   │  (cobranzas runner) │
                    └──────────────────────┘   └─────────────────────┘
```

---

## 2. Flujo de autenticación

1. **Login:** el cliente envía `POST /api/login` con `usuario` y `password`. El servidor:

   - Valida contra la tabla `credenciales` (bcrypt).
   - Emite un JWT y lo guarda en cookie `token` (httpOnly, secure, sameSite).
   - Devuelve cookie `csrf_token` para operaciones posteriores.
2. **Rutas protegidas (página):** el middleware `authPage` verifica la cookie `token`. Si no hay token o es inválido, redirige al login.
3. **Rutas protegidas (API):** el middleware `authApi` verifica la cookie `token`. Si no hay token o es inválido, responde 401.
4. **Logout:** `POST /api/logout` (con `authApi` y CSRF) limpia las cookies `token` y `csrf_token`.

---

## 3. Seguridad

| Mecanismo               | Uso                                                                       |
| ----------------------- | ------------------------------------------------------------------------- |
| **Helmet**        | Cabeceras HTTP seguras                                                    |
| **CORS**          | Origen único `FRONT_ORIGIN`, `credentials: true`                     |
| **JWT en cookie** | httpOnly, secure, sameSite lax, dominio `COOKIE_DOMAIN`                 |
| **CSRF**          | Token en cookie + header `x-csrf-token` en POST/PUT/PATCH/DELETE        |
| **Rate limit**    | Login: 5 intentos / 10 min; Cobranzas: 5 / min                            |
| **Validación**   | Usuario con regex, longitudes, tipos; entidades de cobranzas en whitelist |

---

## 4. Integraciones externas

- **PostgreSQL:** pool en `base_datos/db.js`; tabla `credenciales` (id, usuario, password_hash).
- **Excel/OneDrive y Microsoft Graph:** variables de entorno para lectura de hojas y correo (documentadas en propósito y en configuración).
- **SMTP:** envío de correos (Office 365).
- **Automatización Python:** `POST /api/cobranzas/procesar` lanza un proceso `python` que ejecuta un script externo (`../z_cobranzas_automatizaciones/api_cobranzas_runner.py`); el backend no incluye ese script.

---

## 5. Confianza de proxy

`app.set("trust proxy", 1)` está configurado para que, detrás de Nginx/Caddy, `req.ip` y el rate limit usen correctamente la IP del cliente (p. ej. `X-Forwarded-For`).

---

## 6. Logging

Los eventos relevantes (login, logout, errores, cobranzas) se registran en JSON por consola mediante `utils/logger.js` (logInfo, logWarn, logError), incluyendo IP, método, path y datos asociados.
