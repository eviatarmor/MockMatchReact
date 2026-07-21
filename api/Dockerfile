# syntax=docker/dockerfile:1
# Build from monorepo root:
#   docker build -f api/Dockerfile -t mockmatch-api .
#
# Uses Debian slim (not Alpine) so Playwright Chromium can run for PDF export.

FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY api/package.json ./api/
COPY packages/schemas/package.json ./packages/schemas/
RUN npm ci --workspace=@mockmatch/api --workspace=@mockmatch/schemas --include-workspace-root

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

RUN apt-get update \
  && apt-get install -y --no-install-recommends wget ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd -r mockmatch \
  && useradd -r -g mockmatch -d /app -s /sbin/nologin mockmatch

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/api/node_modules ./api/node_modules
COPY --from=deps /app/packages ./packages
COPY package.json package-lock.json ./
COPY api ./api
COPY packages/schemas ./packages/schemas

# Install Chromium + OS deps for PDF print capture (npx playwright).
WORKDIR /app/api
RUN npx playwright install --with-deps chromium \
  && chown -R mockmatch:mockmatch /app /ms-playwright

USER mockmatch
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1
# default API; worker override: ["npx", "tsx", "src/worker.ts"]
CMD ["npx", "tsx", "src/index.ts"]
