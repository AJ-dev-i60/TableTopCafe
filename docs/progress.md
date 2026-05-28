# Progress — TableTopCafe

Current state of the build and anything needed to resume on a fresh machine.

## Current milestone: M1 — Read-only catalogue with seed data

**Status: All M1 code complete. Ready to deploy and run `npm run db:seed` in production.**

### M0 — Walking skeleton ✅
- GitHub Actions CI passes (unit + e2e) on every push to `main`
- Production confirmed live on 2026-05-28: `https://tabletopcafe.edgestudios.co.za` renders
  placeholder page, `/api/health` returns `{"ok":true,"db":"connected"}`

### M1 progress
- [x] DB schema: `games`, `tags`, `game_tags`, `photos` — migration `0001_tough_pride.sql`
- [x] Seed script: ~20 real games with tags and placeholder photos (`scripts/seed.ts`, `npm run db:seed`)
- [x] Catalogue route (`/`): card grid + list toggle + search + filters (`app/pages/index.vue`)
  - Server-renders the full game list; filters are client-side
  - `server/db/queries/games.ts`, `server/db/queries/tags.ts`
  - `server/api/games/index.get.ts`, `server/api/tags/index.get.ts`
  - `app/composables/useFilters.ts`, `app/composables/useCatalogueView.ts`
  - `app/components/catalogue/GameCard.vue`, `GameListItem.vue`, `CatalogueFilters.vue`
  - Photo service + serving route: `server/services/photos.ts`, `server/api/photos/[hash]/[file].get.ts`
- [x] Game detail page (`/games/[id]`) — `app/pages/games/[id].vue`, `server/api/games/[id].get.ts`
- [x] Image pipeline: `sharp` added, `server/services/photos.ts` processes uploads into thumb/card/detail WebP + JPEG; `server/api/photos/[hash]/[file].get.ts` serves files
- [x] PWA manifest + service worker — `public/manifest.json`, `public/sw.js`, icons at `public/icon-{16,32,180,192,512}.png`
- [x] Playwright smoke test: browse → filter → open detail (`tests/e2e/catalogue.spec.ts`)

## Coolify deployment (VPS)

The app is deployed via Coolify 4.1.1 on `vps01.edgestudios.co.za` as **two separate apps** — one for production (`main` branch) and one for development (`dev` branch), each with its own database.

### Production app (`main` branch)

| Thing | Value |
|---|---|
| App UUID | `m1uovgct8k8ncbp8ec4h9ewp` |
| PostgreSQL DB UUID / hostname | `osjvno601sn7jz8a5hslm0qd` |
| Domain | `https://tabletopcafe.edgestudios.co.za` |
| Build pack | `dockerfile` (repo root `Dockerfile`) |
| Branch | `main` — auto-deploys on push |
| `AUTO_SEED` | **not set** — production data is persistent, seeding never runs automatically |

### Dev app (`dev` branch)

| Thing | Value |
|---|---|
| App UUID | `vf08pr98087artadb771ek3p` |
| PostgreSQL DB UUID / hostname | `f13ffkj6xl46qz6q7teofftm` |
| Domain | `https://tabletopcafedev.edgestudios.co.za` |
| Branch | `dev` — auto-deploys on push |
| `AUTO_SEED=true` | set — on every container start, runs migrations then seeds 20 games |

### How auto-seed works

`docker-entrypoint.sh` checks for `AUTO_SEED=true` at container start:
1. Runs `tsx server/db/migrate.ts` — applies any pending migrations
2. Runs `tsx scripts/seed.ts` — seeds ~20 games (script is idempotent)
3. Starts the server: `node .output/server/index.mjs`

**The seed script is test data only.** It exists so the dev environment always has a populated catalogue for testing. Production data is managed by staff via the admin interface and is never touched by the seed script.

**What was configured (all done via API on 2026-05-27):**
- Changed build pack from Nixpacks → Dockerfile
- Created a Coolify-managed PostgreSQL 16 (`postgres:16-alpine`) database
- Added `DATABASE_URL` env var to the app pointing to that database
- Set custom domain `https://tabletopcafe.edgestudios.co.za`

**Stale env vars that can be cleaned up in Coolify UI:**
- `NIXPACKS_NODE_VERSION=22` — leftover from Nixpacks, no longer used
- `POSTGRES_PASSWORD` — leftover from the user's initial setup; the DATABASE_URL now uses the Coolify-managed DB password directly

## SSH / infrastructure

- SSH: `ssh -i ~/.ssh/edgestudios_deploy root@172.0.0.71`
- Coolify UI: `https://coolify.edgestudios.co.za`
- Coolify API: `https://coolify.edgestudios.co.za/api/v1` (bearer token — generate in Coolify UI → Profile → API Tokens, or recreate via `docker exec coolify php artisan tinker`)
- Traefik routes traffic via the `coolify` Docker bridge — never add raw `ports:` mappings

## Key CI facts

- `.github/workflows/ci.yml` has two jobs: `unit` (Vitest) and `e2e` (Playwright + Postgres service container)
- Server readiness check uses a `curl` poll loop — `wait-on` was removed because it behaved differently from `curl` against the Nitro server
- `server/plugins/migrations.ts` uses an **isolated** postgres client (`max: 1`) that is closed after migrations complete — do not switch it back to the shared `db` singleton

## Next: M1 checklist

1. ✅ DB schema: `games`, `tags`, `game_tags`, `photos` tables + Drizzle migration
2. ✅ Seed script: `scripts/seed.ts` — `npm run db:seed`
3. ✅ Catalogue route (`/`): card grid + list toggle + search + filters
4. ✅ Game detail page — `app/pages/games/[id].vue`, `server/api/games/[id].get.ts`
5. ✅ Image pipeline — `server/services/photos.ts`, `server/api/photos/[hash]/[file].get.ts`
6. ✅ PWA manifest + service worker — `public/manifest.json`, `public/sw.js`
7. ✅ Playwright smoke test — `tests/e2e/catalogue.spec.ts` (5 tests)
8. ✅ CI updated — `db:migrate` + `db:seed` run before server in e2e job

**M1 is code-complete.** Push to `main` → CI runs → auto-deploys to Coolify prod. Production is never seeded automatically — real catalogue data will be entered by staff in M5. The `dev` branch auto-seeds on every build via `AUTO_SEED=true`.
