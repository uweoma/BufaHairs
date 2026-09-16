# ---- BufaHairs backend (Express + Prisma) ----
# Multi-stage build. The runner keeps the built dist/, the generated Prisma
# client, the Prisma schema + migrations, and node_modules so that
# `prisma migrate deploy` and the seed script both work inside the container.

FROM node:20-alpine AS deps
WORKDIR /app
# Prisma needs openssl on Alpine.
RUN apk add --no-cache openssl libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci || npm install

FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate the Prisma client, then compile TypeScript to dist/.
RUN npx prisma generate && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl libc6-compat
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nodejs

# Runtime artifacts: compiled JS, node_modules (with generated client + CLI),
# Prisma schema/migrations/seed, and package.json (for npm run db:seed).
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

USER nodejs
EXPOSE 4000
ENV PORT=4000

# Apply pending migrations (idempotent) before starting the API server.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
