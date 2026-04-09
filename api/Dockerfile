# Build from repo root: docker compose build api  (context ./api)
FROM docker.1panel.live/node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.12.4 --activate

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY prisma ./prisma
COPY src ./src
COPY nest-cli.json tsconfig.json tsconfig.build.json ./

ENV DATABASE_URL="postgresql://app:app@localhost:5432/app"
RUN pnpm exec prisma generate && pnpm run build
RUN pnpm prune --prod --ignore-scripts

FROM docker.1panel.live/node:22-alpine AS runner
RUN apk add --no-cache openssl libc6-compat \
  && npm install -g prisma@6.19.0

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 4000
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
