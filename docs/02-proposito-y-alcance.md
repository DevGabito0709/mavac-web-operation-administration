# Propósito y alcance del proyecto

Definición del objetivo del proyecto y de sus límites funcionales.

---

## 1. Propósito

**MAVAC Web Operación y Administración** es el backend de la aplicación interna de MAVAC que permite:

1. **Autenticación** de usuarios de oficina mediante usuario/contraseña almacenados en PostgreSQL.
2. **Panel de oficina** (inicio, cobranzas, administración) con vistas renderizadas en el servidor (EJS).
3. **Gestión de cobranzas** mediante APIs que pueden disparar automatizaciones (script Python externo) por entidad (PACIFICO, RIMAC, POSITIVA, MAPFRE).
4. **Integración** con Excel/OneDrive y Microsoft Graph (lectura de datos y correo) y envío de correos por SMTP (Office 365).

El sistema está pensado para uso interno, detrás de un proxy (Nginx o Caddy) y con HTTPS en producción.

---

## 2. Alcance funcional

| Área | Incluido | No incluido |
|------|----------|-------------|
| **Autenticación** | Login, logout, sesión JWT, cookies, CSRF | Registro público, recuperación de contraseña, 2FA |
| **Oficina** | Vistas de inicio, cobranzas, administración | Lógica de negocio compleja en front (se delega a módulos estáticos) |
| **Cobranzas** | API para iniciar proceso por entidades, rate limit, estado “en proceso” | El script Python y las automatizaciones viven en otro repositorio/ruta |
| **Datos** | Tabla `credenciales` en PostgreSQL | Otras tablas o servicios de datos (según evolución del proyecto) |
| **Despliegue** | Documentación para PM2+Nginx+Certbot y Docker | CI/CD o pipelines concretos (cada equipo los define) |

---

## 3. Usuarios objetivo

- Personal de oficina/operaciones que accede al panel tras iniciar sesión.
- Las credenciales se gestionan vía base de datos (y opcionalmente seed en desarrollo; en producción se recomienda gestión segura de usuarios).

---

## 4. Variables de entorno (resumen)

Necesarias para arranque:

- `PORT`, `JWT_SECRET`, `FRONT_ORIGIN`, `COOKIE_DOMAIN`
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`

Opcionales según funcionalidad:

- Excel/OneDrive: `API_KEY_ONEDRIVE_CLAVES_MAVAC`, `NOMBRE_HOJA_DATA_USUARIO`
- Microsoft Graph (Excel): `TENANT_ID_EXCEL`, `CLIENT_ID_EXCEL`, `CLIENT_SECRET_EXCEL`
- Microsoft Graph (Correo): `TENANT_ID_CORREO`, `CLIENT_ID_CORREO`, `CLIENT_SECRET_CORREO`, `USER_UPN_CORREO`
- SMTP: `SMTP_SERVER`, `SMTP_PORT`, `SMTP_REMITENTE`, `SMTP_PASSWORD`

En producción es importante no commitear `.env` y usar secretos del entorno o gestor de secretos.
