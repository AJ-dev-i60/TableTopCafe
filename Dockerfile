FROM node:22-alpine AS deps
WORKDIR /app
# Explicit development mode so npm ci always installs devDependencies
# regardless of the host build environment's NODE_ENV
ENV NODE_ENV=development
COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
# git is required at build time so nuxt.config.ts can derive the version
# from the latest commit's timestamp
RUN apk add --no-cache git
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Production deps only — provides drizzle-orm, postgres, sharp, zod for seed script
COPY package*.json ./
RUN npm ci --omit=dev
# Built server output
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/server/db/migrations ./server/db/migrations
# Seed script + its TypeScript source dependencies (run via node --experimental-strip-types)
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/server/db/schema ./server/db/schema
COPY --from=builder /app/server/db/client.ts ./server/db/client.ts
COPY --from=builder /app/server/db/migrate.ts ./server/db/migrate.ts
COPY --from=builder /app/server/config.ts ./server/config.ts
COPY --from=builder /app/server/services/photos.ts ./server/services/photos.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
