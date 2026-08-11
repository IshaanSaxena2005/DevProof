FROM node:20-alpine
WORKDIR /app

# Prisma's query/schema engines link against OpenSSL, which alpine's base
# image doesn't ship — without this they fail at runtime with an opaque
# "Could not parse schema engine response" error.
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 5000

# Applies any pending migrations before the server starts, so a fresh
# database is brought up to date automatically on first run.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
