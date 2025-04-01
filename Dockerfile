FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/workers ./workers
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/tsconfig.worker.json ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Make sure ts-node is properly installed
RUN npm install -g ts-node typescript
RUN npm install --no-save @types/node @types/amqplib axios amqplib

# Start script to run the main app and workers
RUN npm run build-workers
COPY start.sh ./
RUN chmod +x ./start.sh

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["./start.sh"]