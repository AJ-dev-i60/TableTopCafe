#!/bin/sh
set -e
echo "Running migrations..."
./node_modules/.bin/tsx server/db/migrate.ts
if [ "$AUTO_SEED" = "true" ]; then
  echo "Seeding database..."
  ./node_modules/.bin/tsx scripts/seed.ts
fi
if [ -n "$ADMIN_USERNAME" ] && [ -n "$ADMIN_PASSWORD" ]; then
  echo "Seeding admin user..."
  ./node_modules/.bin/tsx scripts/seed-admin.ts
fi
exec node .output/server/index.mjs
