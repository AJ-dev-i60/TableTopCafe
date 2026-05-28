#!/bin/sh
set -e
if [ "$AUTO_SEED" = "true" ]; then
  echo "Seeding database..."
  ./node_modules/.bin/tsx scripts/seed.ts
fi
exec node .output/server/index.mjs
