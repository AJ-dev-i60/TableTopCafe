# Progress — TableTopCafe

Granular session-level state: what's done, what's next, and anything needed to resume on a fresh machine. For the milestone plan and scope definitions see `docs/roadmap.md` — this file tracks *where we are*, not *where we're going*.

## Current milestone: M5 — Polish 🚧

**Status: Visual design pass complete on `dev`. Performance pass + data entry sprint pending.**

### M5 checklist
- [x] Tokens: Felt & Slate palette, glass tokens, `--mesh-bg`, new radii/shadows/semantic font sizes — `tokens.css`
- [x] Catalogue glass: mesh + frosted header/footer in `default.vue`, glass toolbar + 1→2→3 responsive grid in `index.vue`
- [x] `GameCard.vue` restructured — photo-as-background, scrim, frosted info panel, responsive aspect ratio (16/10→4/3→3/4), brand-gradient no-photo fallback
- [x] `FeaturedBadge.vue` — glass pill variant (translucent green, blur, star icon)
- [x] `GameListItem.vue` — flat bordered rows, brand-gradient thumbnail fallback, new tokens
- [x] `CatalogueFilters.vue` — glass filter chips (unselected: semi-translucent; selected: solid brand)
- [x] Detail page `games/[id].vue` — glass hero (full-bleed photo + scrim + title overlay), glass content panels, responsive sticky two-column on desktop, no-photo fallback
- [x] Staff layout `staff.vue` — flat white nav bar, brand underline active link, 58px height
- [x] Staff login `login.vue` — flat page bg, white centered card
- [x] Staff dashboard `staff/index.vue` — proper table (thumb + name + pill columns), segmented filter, status pills, brand-gradient thumbnail fallback
- [x] `Button.vue` — added `secondary` and `ghost` variants; all variants use `rounded-[--radius-md]`
- [x] `Input.vue` — `border-[--color-border-strong]`, focus ring `rgb(21_128_61/0.15)`, invalid ring
- [x] `GameForm.vue` — two-column desktop layout (details left, featured+photos right in cards), BGG block with dashed brand-accent border, right-aligned footer actions
- [x] `StaffGameListItem` query extended to include `photoHash` (first photo per game)
- [ ] Performance pass on representative low-end Android (catalogue scroll, image loading, TTI)
- [ ] 400-game data entry sprint
- [ ] QR codes on tables
- [ ] Owner sign-off → go live

---

## Previous milestone: M4 — Remaining features ✅

**Status: Complete on `dev`.**

### M4 checklist ✅
- [x] Featured max-3 enforcement — data layer (`countFeaturedGames`) + API guards (POST/PATCH 422) + UI counter/disable in `GameForm.vue`
- [x] Soft-deleted games view + Restore action — `restoreGame` query, `POST /api/staff/games/[id]/restore`, dashboard Live/Deleted/All filter + Restore button
- [x] Tag management view + API — rename (inline), merge into (with target picker), archive/unarchive; `GET /api/staff/tags`, `PATCH/DELETE /api/staff/tags/[id]`, `POST /api/staff/tags/[id]/merge`, `POST /api/staff/tags/[id]/restore`; Tags nav link in staff layout
- [x] Admin user management — `listUsers`, `updateUserPassword`, `deleteUser` queries; `GET/POST /api/staff/users`, `POST /api/staff/users/[id]/reset-password`, `DELETE /api/staff/users/[id]` (all `requireAdmin`); `/staff/users` page (add, inline reset-password, delete with self-delete guard); `app/middleware/admin.ts` client route guard; staff layout shows `username · role` and gates Users nav link to admins

---

## Previous milestone: M3 — BGG integration ✅

**Status: Complete on `dev` (build #3).**

### M3 checklist ✅
- [x] `bgg_games_cache` table (migration 0003) + `bgg_id` column on `games`
- [x] `server/services/bgg.ts` — BGG XML API v2 client with fast-xml-parser + Zod
- [x] `GET /api/bgg/search` — live search with local-cache fallback
- [x] `GET /api/bgg/thing/[id]` — full game detail for pre-fill
- [x] `POST /api/staff/games/[id]/photos/bgg-fetch` — server-side image fetch through sharp pipeline
- [x] Weekly Nitro scheduled task — refreshes cache for catalogued games
- [x] `BggSearch.vue` — debounced type-ahead (350ms, min 2 chars)
- [x] `GameForm.vue` — BGG panel at top; "Fetch game info" pre-fills all fields + surfaces BGG image
- [x] Unit tests: 7/7 passing

---

## Previous milestone: M2.5 — Tokenization and convention remediation ✅

**Status: Complete. `main` and `dev` are in sync at build #2.**

### M2.5 checklist ✅
- [x] Expanded token set: brand-foreground, 10-step warm neutral scale, semantic typography layer, layout chrome heights, motion tokens, z-index layers
- [x] All hardcoded colors replaced: `bg-white` → `bg-[--color-surface]`, `text-white` → `text-[--color-brand-foreground]`, `rounded-lg` → `rounded-[--radius-md]` on GameCard
- [x] Semantic font-size token wiring across all components (text-card-title, text-meta, text-tag, text-ui, text-body, text-detail-title, text-section-label)
- [x] Selective spacing wiring: major layout boundaries use named token utilities; micro-layout stays numeric
- [x] Hardcoded z-indices, durations, and sticky offsets replaced with token references
- [x] Inter loaded self-hosted via `@fontsource/inter` (weights 400/500/600/700)
- [x] Shared components: `FeaturedBadge`, `SharedButton` (primary + danger), `SharedInput` (v-model + invalid + attr inheritance)
- [x] Login page SSR re-enabled (root cause was already fixed in 294fee4; `ssr: false` was a leftover)
- [x] Verified on dev: Inter renders, sticky offsets correct, badges, forms all correct

**Next milestone:** M3 (see `docs/roadmap.md`).

---

## Deployment infrastructure (completed 2026-05-29)

- **Build number**: `BUILD_NUMBER` file in repo root. GitHub Actions bumps it after every successful CI run on `main` and commits back with `[skip ci]`. `nuxt.config.ts` reads it via `readFileSync`. Header shows `Table-Top-Cafe  #N`.
- **GitHub → Coolify webhooks**: Two webhooks on the repo (one per app). URL: `https://coolify.edgestudios.co.za/webhooks/source/github/events/manual`. Each signed with the app's `manual_webhook_secret_github` (HMAC-SHA256 via `X-Hub-Signature-256`). Auto-deploy now works on push.
- **Dev `SESSION_SECRET`**: Set in Coolify env vars for the dev app. Dev container stable.
- **Prod `SESSION_SECRET`**: Set in Coolify env vars for the prod app (confirmed 2026-05-29).

---

## Previous milestone: M2 — Staff auth and game CRUD ✅

**Status: M2 code complete. Awaiting CI run and deployment.**

### M0 — Walking skeleton ✅
- GitHub Actions CI passes (unit + e2e) on every push to `main`
- Production confirmed live on 2026-05-28: `https://tabletopcafe.edgestudios.co.za` renders
  placeholder page, `/api/health` returns `{"ok":true,"db":"connected"}`

### M0 ✅ · M1 ✅

### M1 progress (done)
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

## M2 checklist

1. ✅ DB schema: `users`, `sessions` tables — migration `0002_stiff_stick.sql`
2. ✅ Auth service: `server/services/auth.ts` — Argon2id password hashing, cookie sessions, `requireAuth`/`requireAdmin` guards
3. ✅ Server middleware: `server/middleware/auth.ts` — validates session cookie on every request, populates `event.context.user`
4. ✅ Auth API: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
5. ✅ User queries: `server/db/queries/users.ts` — `getUserByUsername`, `getUserById`, `createUser`
6. ✅ Game write queries: `createGame`, `updateGame`, `softDeleteGame`, `listAllGamesForStaff` added to `server/db/queries/games.ts`
7. ✅ Tag write query: `createTag` added to `server/db/queries/tags.ts`
8. ✅ Staff CRUD routes: `POST /api/staff/games`, `PATCH /api/staff/games/[id]`, `DELETE /api/staff/games/[id]`, `POST /api/staff/games/[id]/photos`
9. ✅ Admin seed script: `scripts/seed-admin.ts` — `npm run db:seed-admin` (requires `ADMIN_USERNAME` + `ADMIN_PASSWORD`)
10. ✅ Entrypoint updated: runs `seed-admin.ts` automatically when `ADMIN_USERNAME` + `ADMIN_PASSWORD` env vars are set
11. ✅ Staff layout: `app/layouts/staff.vue` with nav + sign out
12. ✅ Client auth middleware: `app/middleware/auth.ts` — redirects unauthenticated users to `/staff/login`
13. ✅ Staff pages: login, dashboard, add game, edit game
14. ✅ Staff components: `GameForm.vue`, `TagTypeahead.vue`, `PhotoUpload.vue`
15. ✅ Playwright smoke test: `tests/e2e/staff.spec.ts` — login → add game → verify on catalogue
16. ✅ CI updated — `ADMIN_USERNAME`/`ADMIN_PASSWORD`/`SESSION_SECRET` added, `db:seed-admin` step added

**M2 is code-complete and CI is green.**

**Production env vars confirmed set** (2026-05-29): `SESSION_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` are all configured in Coolify for the prod app.

### Required env vars for production (add in Coolify)

| Var | Notes |
|---|---|
| `SESSION_SECRET` | Random string ≥ 32 chars — used to sign session cookies |
| `ADMIN_USERNAME` | Initial admin login name |
| `ADMIN_PASSWORD` | Initial admin password (can remove after first boot) |
