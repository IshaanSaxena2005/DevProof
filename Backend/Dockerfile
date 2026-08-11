FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 5000

# Applies any pending migrations before the server starts, so a fresh
# database is brought up to date automatically on first run.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
