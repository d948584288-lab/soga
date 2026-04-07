#!/usr/bin/env node
/**
 * Local env aligned with docker-compose.yml (Postgres 5432, Redis 6379).
 * Repo root: node scripts/sync-local-env.cjs
 * FORCE_SYNC_ENV=1 — overwrite existing api/.env and web/.env.development
 */
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const force =
  process.argv.includes("--force") ||
  process.env.FORCE_SYNC_ENV === "1" ||
  process.env.FORCE_SYNC_ENV === "true";

const apiEnv = `# Local dev — matches docker-compose.yml (user/password/db: app / app / app)
DATABASE_URL=postgresql://app:app@localhost:5432/app
REDIS_URL=redis://localhost:6379
API_PORT=4000
CORS_ORIGIN=http://localhost:3000
`;

const webEnvDev = `# Local dev — browser calls Nest directly (global API prefix /api)
NEXT_PUBLIC_API_URL=http://localhost:4000
`;

function writeFile(relPath, content) {
  const abs = path.join(root, relPath);
  if (!force && fs.existsSync(abs)) {
    console.log(`skip (exists): ${relPath} — use: FORCE_SYNC_ENV=1 pnpm setup:env`);
    return;
  }
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, "utf8");
  console.log(`wrote ${relPath}`);
}

writeFile("api/.env", apiEnv);
writeFile("web/.env.development", webEnvDev);
