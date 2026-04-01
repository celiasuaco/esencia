FROM node:20-alpine

WORKDIR /app

# Copiamos archivos de dependencias
COPY package*.json ./

# Instalamos (esto fallaba antes, pero aquí dentro de Docker usará la versión correcta)
RUN npm install --ignore-scripts

COPY . .

# Vite usa el puerto 5173 por defecto
EXPOSE 5173

# Arrancamos en modo desarrollo permitiendo conexiones externas
CMD ["npm", "run", "dev", "--", "--host"]