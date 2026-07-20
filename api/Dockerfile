# syntax=docker/dockerfile:1
# Build from monorepo root:
#   docker build -f api/Dockerfile -t mockmatch-api .

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY api/package.json ./api/
COPY packages/schemas/package.json ./packages/schemas/
RUN npm ci --workspace=@mockmatch/api --workspace=@mockmatch/schemas --include-workspace-root

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S mockmatch && adduser -S mockmatch -G mockmatch \
  && apk add --no-cache wget
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/api/node_modules ./api/node_modules
COPY --from=deps /app/packages ./packages
COPY package.json package-lock.json ./
COPY api ./api
COPY packages/schemas ./packages/schemas
# schemas package ships TypeScript source; tsx runs API + workspace imports
USER mockmatch
WORKDIR /app/api
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1
# default API; worker override: ["npx", "tsx", "src/worker.ts"]
CMD ["npx", "tsx", "src/index.ts"]
