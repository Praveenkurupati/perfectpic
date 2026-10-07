# syntax=docker/dockerfile:1.4
# Multi-stage production Dockerfile for @repo/backend (Express Enterprise API)

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@9.15.0 turbo@2.11.4

# Stage 1: Prune monorepo for @repo/backend
FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune @repo/backend --docker

# Stage 2: Install dependencies
FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store pnpm install --no-frozen-lockfile

# Stage 3: Build application
FROM base AS builder
WORKDIR /app
COPY --from=installer /app/ .
COPY --from=pruner /app/out/full/ .
COPY turbo.json turbo.json

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=3072"

RUN --mount=type=cache,id=turbo-cache,target=/app/.turbo pnpm --filter=@repo/backend build

# Stage 4: Minimal Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

# Pre-create writable directories for uploads and logs, set ownership
RUN mkdir -p /app/uploads /app/logs && chown -R expressjs:nodejs /app

# Copy runtime node_modules and built dist bundle
COPY --from=builder --chown=expressjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=expressjs:nodejs /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=builder --chown=expressjs:nodejs /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder --chown=expressjs:nodejs /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder --chown=expressjs:nodejs /app/apps/backend/src/templates ./apps/backend/src/templates

USER expressjs

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:4000/api/health || exit 1

CMD ["node", "apps/backend/dist/server.js"]
