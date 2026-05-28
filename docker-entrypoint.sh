#!/bin/sh
set -e
if [ "$AUTO_SEED" = "true" ]; then
  echo "Running migrations before seed..."
  ./node_modules/.bin/tsx server/db/migrate.ts
  echo "Seeding database..."
  ./node_modules/.bin/tsx scripts/seed.ts
fi
exec node .output/server/index.mjs
