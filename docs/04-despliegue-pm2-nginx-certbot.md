# Despliegue en producción: PM2 + Nginx + Certbot

Guía paso a paso para poner el backend en un servidor Linux (Ubuntu/Debian) usando **PM2** como gestor de procesos, **Nginx** como reverse proxy y **Certbot** para HTTPS.

---

## 1. Requisitos del servidor

- **SO:** Ubuntu 22.04 LTS o Debian 12 (recomendado).
- **Acceso:** SSH con usuario con permisos sudo.
- **Dominio:** Un dominio o subdominio apuntando al servidor (ej. `app.mavac.com.pe`).
- **Puertos:** 80 y 443 abiertos en el firewall.

---

## 2. Preparar el servidor

### 2.1 Actualizar el sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 2.2 Instalar Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # debe mostrar v20.x
npm -v
```

Si usas **nvm** en el servidor:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

### 2.3 Instalar PostgreSQL (si la BD va en el mismo servidor)

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

Crear base de datos y usuario:

```bash
sudo -u postgres psql -c "CREATE USER mavac_admin WITH PASSWORD 'tu_password_seguro';"
sudo -u postgres psql -c "CREATE DATABASE web_proyectus OWNER mavac_admin;"
sudo -u postgres psql -d web_proyectus -f /ruta/al/repo/base_datos/web_proyectos.sql
```

Ajustar `pg_hba.conf` si accedes desde otra máquina. En producción usa siempre contraseñas fuertes.

### 2.4 Instalar PM2 globalmente

```bash
sudo npm install -g pm2
pm2 -v
```

---

## 3. Desplegar la aplicación Node

### 3.1 Clonar el repositorio (o subir el código)

```bash
cd /var/www   # o la ruta que uses
sudo mkdir -p mavac-backend
sudo chown $USER:$USER mavac-backend
git clone <url-del-repo> mavac-backend
cd mavac-backend
```

Si subes por SFTP/rsync, coloca los archivos en esa carpeta (incluyendo `node_modules` o ejecutando `npm ci` en el servidor).

### 3.2 Instalar dependencias

```bash
cd /var/www/mavac-backend
npm ci --omit=dev
```

### 3.3 Configurar variables de entorno

```bash
cp .env.example .env
nano .env
```

Configura al menos:

- `PORT=4000` (puerto interno; Nginx hará proxy a este)
- `NODE_ENV=production`
- `JWT_SECRET=` una clave larga y aleatoria
- `FRONT_ORIGIN=https://app.mavac.com.pe` (tu dominio real)
- `COOKIE_DOMAIN=.mavac.com.pe` (o el dominio que uses)
- `DB_HOST=localhost` (o IP del servidor de BD)
- `DB_PORT=5432`
- `DB_NAME=web_proyectus`
- `DB_USER=mavac_admin`
- `DB_PASSWORD=...`

Guarda y cierra. Asegúrate de que `.env` no se suba a Git.

### 3.4 Probar que arranca

```bash
npm start
# Deberías ver "Node escuchando en http://127.0.0.1:4000"
# Ctrl+C para parar
```

### 3.5 Arrancar con PM2

```bash
pm2 start server.js --name "mavac-backend"
pm2 save
pm2 startup
# Ejecuta el comando que te indique pm2 startup (sudo env PATH=...)
```

Comandos útiles:

```bash
pm2 status
pm2 logs mavac-backend
pm2 restart mavac-backend
pm2 stop mavac-backend
```

Opcional: archivo **ecosystem.config.js** en la raíz del proyecto:

```javascript
module.exports = {
  apps: [{
    name: "mavac-backend",
    script: "server.js",
    cwd: "/var/www/mavac-backend",
    instances: 1,
    exec_mode: "fork",
    env: {
      NODE_ENV: "production"
    }
  }]
};
```

Luego:

```bash
pm2 start ecosystem.config.js
pm2 save
```

---

## 4. Instalar y configurar Nginx

### 4.1 Instalar Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 4.2 Crear sitio para la aplicación

Crear un virtual host (reemplaza `app.mavac.com.pe` por tu dominio):

```bash
sudo nano /etc/nginx/sites-available/mavac-backend
```

Contenido **sin HTTPS** (para obtener el certificado primero):

```nginx
server {
    listen 80;
    server_name app.mavac.com.pe;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Activar el sitio:

```bash
sudo ln -s /etc/nginx/sites-available/mavac-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Comprueba que desde el navegador (o curl) `http://app.mavac.com.pe` responde (el backend debe estar corriendo con PM2).

---

## 5. Obtener certificado SSL con Certbot

### 5.1 Instalar Certbot y plugin Nginx

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 5.2 Obtener el certificado

```bash
sudo certbot --nginx -d app.mavac.com.pe
```

Sigue las preguntas: email, aceptar términos, redirección HTTP→HTTPS (recomendado: Sí).

Certbot modificará automáticamente el bloque `server` en Nginx para usar SSL y la redirección.

### 5.3 Renovación automática

Certbot configura un cron/systemd timer. Comprobar:

```bash
sudo certbot renew --dry-run
```

Si todo va bien, no hará falta hacer nada más; el certificado se renovará solo.

---

## 6. Ajustar Nginx con HTTPS (revisión)

Tras Certbot, tu sitio debería verse similar a:

```nginx
server {
    listen 80;
    server_name app.mavac.com.pe;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name app.mavac.com.pe;

    ssl_certificate /etc/letsencrypt/live/app.mavac.com.pe/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.mavac.com.pe/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Si algo falla, revisa `sudo nginx -t` y `sudo systemctl status nginx`.

---

## 7. Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

---

## 8. Resumen de pasos y comprobaciones

| Paso | Acción |
|------|--------|
| 1 | Actualizar sistema, instalar Node 20, PostgreSQL (si aplica), PM2 |
| 2 | Clonar o subir código, `npm ci --omit=dev`, configurar `.env` |
| 3 | Probar `npm start` y luego `pm2 start server.js --name mavac-backend` |
| 4 | Instalar Nginx, crear site en `sites-available`, activar con symlink, `nginx -t`, reload |
| 5 | `certbot --nginx -d app.mavac.com.pe` y comprobar `certbot renew --dry-run` |
| 6 | Abrir puertos 80/443 con ufw y comprobar acceso por HTTPS |

---

## 9. Actualizar la aplicación en el futuro

```bash
cd /var/www/mavac-backend
git pull
npm ci --omit=dev
pm2 restart mavac-backend
```

Si usas `ecosystem.config.js`, el nombre del proceso puede ser `mavac-backend`; ajusta el comando si es distinto.

---

## 10. Troubleshooting

- **502 Bad Gateway:** la app no está escuchando en el puerto (p. ej. 4000). Revisa `pm2 status` y `pm2 logs`.
- **CORS o cookies:** verifica que `FRONT_ORIGIN` y `COOKIE_DOMAIN` coincidan con el dominio que usa el usuario en el navegador.
- **Nginx no arranca:** `sudo nginx -t` y revisa logs en `/var/log/nginx/`.
- **Certificado no se renueva:** revisa `sudo certbot renew --dry-run` y la configuración de cron/timer de certbot.
