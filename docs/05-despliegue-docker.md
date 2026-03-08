# Despliegue en producción: Docker

Guía paso a paso para ejecutar la aplicación con **Docker** y **docker-compose**: backend Node.js y PostgreSQL en contenedores. Toda la configuración Docker está en la carpeta **`docker/`**.

---

## 1. Requisitos

- **Docker** 24+ y **Docker Compose** v2 (incluido en Docker Desktop o `docker compose` en Linux).
- **Dominio** (opcional para producción con HTTPS): si quieres SSL delante, necesitarás Nginx + Certbot en el host o un contenedor (p. ej. Caddy) que no se describe aquí; esta guía se centra en levantar app + BD con Docker.

---

## 2. Estructura de la carpeta `docker/`

| Archivo | Uso |
|---------|-----|
| `docker/Dockerfile` | Imagen del backend (Node 20 Alpine). El build usa el contexto de la **raíz del proyecto** para poder copiar el código. |
| `docker/docker-compose.yml` | Solo servicio PostgreSQL (desarrollo local). Volumen de datos en `../db_data`. |
| `docker/docker-compose.prod.yml` | Backend + PostgreSQL para producción. Variables desde `.env` en la raíz. |

El archivo **`.dockerignore`** está en la raíz del proyecto; Docker lo usa cuando el contexto del build es la raíz (así se excluyen `node_modules`, `.env`, etc.).

---

## 3. Imagen del backend (Dockerfile)

El proyecto incluye `docker/Dockerfile` que:

- Usa **Node 20 Alpine**.
- Copia `package.json` / `package-lock.json`, ejecuta `npm ci --omit=dev`.
- Copia el resto del código (contexto = raíz del proyecto).
- Expone el puerto 4000 y arranca con `node server.js`.

En `docker-compose.prod.yml` el build se define con `context: ..` y `dockerfile: docker/Dockerfile` para que el contexto siga siendo la raíz.

---

## 4. Desarrollo local (solo BD)

Para levantar solo PostgreSQL y desarrollar con `npm run dev` en el host:

```bash
# Desde la raíz del proyecto
docker compose -f docker/docker-compose.yml up -d
```

Los datos se persisten en `db_data/` en la raíz. Configura en tu `.env`: `DB_HOST=localhost`, `DB_PORT=5432`, etc.

---

## 5. Archivo .env para Docker

En la **raíz del proyecto**, crea o edita `.env` (Compose lo lee desde el directorio desde el que ejecutas el comando):

```env
DB_USER=postgres
DB_PASSWORD=contraseña_segura
DB_NAME=web_proyectus
JWT_SECRET=clave_larga_aleatoria
FRONT_ORIGIN=https://app.mavac.com.pe
COOKIE_DOMAIN=.mavac.com.pe
```

En producción usa secretos fuertes y, si es posible, un gestor de secretos (Docker Secrets, variables de CI/CD, etc.).

---

## 6. Pasos para levantar con Docker (producción)

### 6.1 Construir y levantar

**Desde la raíz del proyecto:**

```bash
cd /ruta/al/mavac-web-operation-administration
docker compose -f docker/docker-compose.prod.yml build
docker compose -f docker/docker-compose.prod.yml up -d
```

### 6.2 Comprobar que los contenedores están corriendo

```bash
docker compose -f docker/docker-compose.prod.yml ps
docker compose -f docker/docker-compose.prod.yml logs -f backend
```

### 6.3 Crear la tabla e inicializar datos (primera vez)

La base de datos se crea al arrancar el contenedor `db`, pero el esquema (tabla `credenciales`) hay que aplicarlo a mano. **Desde la raíz del proyecto** en el host:

```bash
docker compose -f docker/docker-compose.prod.yml exec -T db psql -U postgres -d web_proyectus < base_datos/web_proyectos.sql
```

(Opcional) Seed de credenciales: ejecutar el seed **dentro** del contenedor del backend (ya tiene las variables de entorno):

```bash
docker compose -f docker/docker-compose.prod.yml exec backend node seed_credenciales.js
```

Solo si tu `seed_credenciales.js` está pensado para ese entorno (en producción valora no usar seeds con contraseñas reales).

---

## 7. Exponer solo por reverse proxy (recomendado en producción)

En producción no sueles exponer el puerto 4000 directamente. Opciones:

1. **Quitar el `ports` del backend** en `docker/docker-compose.prod.yml` y poner Nginx (o Caddy) en el **host**: el host escucha 80/443 y hace proxy a `localhost:4000` solo si mapeas `4000:4000`. Mejor: usar una red interna y que Nginx esté en otro contenedor en el mismo compose que haga proxy a `backend:4000`.
2. **Añadir un servicio Nginx (o Caddy) en el mismo docker-compose** que escuche 80/443 y haga proxy a `http://backend:4000`. Certbot se puede ejecutar en el host y que Nginx del host lea los certificados, o usar un contenedor con Certbot integrado.

Ejemplo mínimo de **servicio Nginx en el compose** (sin Certbot; para HTTPS habría que montar certificados):

```yaml
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.ro:ro
    depends_on:
      - backend
```

Y un `nginx.conf` que haga `proxy_pass http://backend:4000;` con los headers habituales (`Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`). Detalles de Certbot con Nginx en Docker se dejan para una guía específica (ver [04-despliegue-pm2-nginx-certbot.md](./04-despliegue-pm2-nginx-certbot.md) en el host).

---

## 8. Comandos útiles

Todos los comandos se ejecutan **desde la raíz del proyecto**:

| Acción | Comando |
|--------|--------|
| Ver logs del backend | `docker compose -f docker/docker-compose.prod.yml logs -f backend` |
| Reiniciar backend | `docker compose -f docker/docker-compose.prod.yml restart backend` |
| Parar todo | `docker compose -f docker/docker-compose.prod.yml down` |
| Parar y borrar volúmenes | `docker compose -f docker/docker-compose.prod.yml down -v` (¡cuidado, borra la BD!) |
| Reconstruir tras cambios | `docker compose -f docker/docker-compose.prod.yml build --no-cache backend && docker compose -f docker/docker-compose.prod.yml up -d` |

---

## 9. Resumen

- **Carpeta `docker/`:** contiene `Dockerfile`, `docker-compose.yml` (solo BD) y `docker-compose.prod.yml` (app + BD). El `.dockerignore` está en la raíz.
- **Producción:** desde la raíz, `docker compose -f docker/docker-compose.prod.yml up -d`; primera vez aplicar `base_datos/web_proyectos.sql` al contenedor `db` y opcionalmente ejecutar el seed en el contenedor `backend`.
- **Desarrollo (solo BD):** `docker compose -f docker/docker-compose.yml up -d` y `npm run dev` en el host.
- **HTTPS:** usar reverse proxy (Nginx/Caddy) en el host según [04-despliegue-pm2-nginx-certbot.md](./04-despliegue-pm2-nginx-certbot.md) o añadir un servicio Nginx en el compose.
