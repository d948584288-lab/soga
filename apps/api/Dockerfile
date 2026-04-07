# Monorepo root as context: docker build -f apps/api/Dockerfile .
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.12.4 --activate

WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/

RUN pnpm install --frozen-lockfile --ignore-scripts

COPY apps/api ./apps/api

ENV DATABASE_URL="postgresql://app:app@localhost:5432/app"
RUN pnpm --filter api exec prisma generate
RUN pnpm --filter api run build
RUN pnpm deploy --filter=api --prod /deploy --legacy

FROM node:22-alpine AS runner
RUN apk add --no-cache openssl libc6-compat \
  && npm install -g prisma@6.19.0

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /deploy ./
COPY apps/api/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 4000
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
