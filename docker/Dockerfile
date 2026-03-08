# Imagen base Node.js LTS (Alpine = más liviana)
FROM node:20-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar solo dependencias primero (mejor uso de caché de Docker)
COPY package.json package-lock.json* ./

# Instalar solo dependencias de producción, sin devDependencies
RUN npm ci --omit=dev

# Copiar el resto del código
COPY . .

# Puerto que expone la app (lo usa process.env.PORT en server.js)
EXPOSE 4000

# Variables por defecto; en la nube se sobreescriben con las reales
ENV NODE_ENV=production
ENV PORT=4000

# Arrancar la aplicación
CMD ["node", "server.js"]
