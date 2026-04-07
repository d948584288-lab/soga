#!/bin/sh
set -e
cd /app
if [ "${SKIP_MIGRATIONS:-0}" != "1" ]; then
  prisma migrate deploy
fi
exec node dist/main.js
