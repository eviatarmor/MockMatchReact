FROM node:22-alpine

WORKDIR /app

# Expect compose to mount monorepo root at /app and set working dir to api
# Install deps on container start so host node_modules (Windows) is not required
COPY package.json package-lock.json* ./
# Full monorepo install is heavy; studio image relies on volume mount + npm install at runtime

RUN npm install -g drizzle-kit@0.31.4

EXPOSE 4983

# Run from /workspace/api (mounted). drizzle.config.ts reads DATABASE_URL.
WORKDIR /workspace/api
CMD ["sh", "-c", "drizzle-kit studio --host 0.0.0.0 --port 4983"]
