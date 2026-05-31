# Progress — TableTopCafe

Granular session-level state: what's done, what's next, and anything needed to resume on a fresh machine. For the milestone plan and scope definitions see `docs/roadmap.md` — this file tracks *where we are*, not *where we're going*.

## Current milestone: M5 — Polish 🚧

**Status: Visual design pass owner-verified on dev. Catalogue + staff form regressions fixed end-to-end on dev (2026-05-30 late session). `/app/photos` persistent volume now mounted on dev AND prod via Coolify API. `dev` → `main` merged 2026-05-31 — prod now carries the full M5 polish set (auto-deploy triggered). Shared-component token migration awaits design sign-off. Auth bypass + data entry sprint still pending.**

### Session — 2026-05-31

**Merged `dev` → `main` (next-action #1, done).** `main` was 61 commits behind `origin/main` locally; fast-forwarded to `origin/main` (build 5), then `git merge --no-ff dev`. Only conflict was a modify/delete on `BUILD_NUMBER` (main bumped it, dev deleted it as part of the commit-timestamp version rewrite) — resolved by taking dev's deletion. Merged `main` tree is byte-identical to `dev`. Pushed `291d223..6c7a108` → triggers GitHub CI + Coolify prod auto-deploy. CI not pollable locally (`gh` not installed) — verify via repo Actions tab; prod build version should now read `v26.05.3x.xxxx` (commit-timestamp scheme) instead of `BUILD_NUMBER=5`.

### Session end — 2026-05-30 (late session, picks up from earlier pivot point)

**Pushed to `origin/dev`:**
- `c73f138` fix(catalogue): rescue photo-fallback from SSR/hydration race. The earlier `df5de96` `@error="imageFailed = true"` was a Vue directive (not a real HTML attribute), so the SSR'd `<img>` shipped with no `onerror` — when the browser fired `error` before Vue hydrated, the event was lost. Cross-engine probe confirmed: Chromium 0/20 cards flipped to fallback, Firefox ~12/20, WebKit ~3/20 (user-reported "toggle on refresh" was warm-vs-cold-cache deciding the race). Added a one-shot `onMounted` check that flags any `<img>` already in the loaded-but-broken state (`complete + naturalWidth=0 + non-empty currentSrc` — distinguishes errored from lazy-not-yet-fetched). `@error` still covers post-mount failures. Applied to `GameCard`, `GameListItem`, `games/[id].vue` (heroImgEl), `staff/index.vue` (DOM walk over `img[data-game-id]`).
- `5612ab9` fix(staff): widen add/edit-game wrapper + fix missing-photo thumb. `max-w-2xl` (672 px) wrapper + `grid-template-columns: 1fr 320px` was collapsing the left form column to ~190 px (inputs at 1-char widths, Save clipped) — raised to `max-w-5xl`. Same hydration race applied to `PhotoUpload.vue` existing-photo gallery: `data-photo-hash` + `onMounted` sweep + `watch(props.existingPhotos)` re-sweep. Fallback shows a muted "image-with-slash" icon + `title="Photo file missing: <hash>"` (honest staff-facing signal, not a pretty gradient).
- `6517641` fix(seed): ensure placeholder photos exist on every dev redeploy. Hoisted `writePlaceholderPhoto()` above the existing-game check in `scripts/seed.ts`. Hash is deterministic (same `(r,g,b)` → same sha256 → same files) so it's a no-op when files exist and a recovery step when `/app/photos` is empty. `AUTO_SEED=true` on dev runs this every container start, so dev now self-heals after a redeploy.

**Coolify infrastructure changes (not in git):**
- Added persistent volume mount on **dev** app (`vf08pr98087artadb771ek3p`): name `vf08pr98087artadb771ek3p-photos` → `/app/photos` (Docker named volume, storage UUID `kpavuxxlttbco97n1lawulns`). Verified dev catalogue post-redeploy: 20/20 photos return 200, 0 broken, 0 fallback.
- Added same persistent volume mount on **prod** app (`m1uovgct8k8ncbp8ec4h9ewp`): name `m1uovgct8k8ncbp8ec4h9ewp-photos` → `/app/photos` (storage UUID `wewu0c5c4mibz5ty1ou4sxv7`). Prod redeploy triggered, container came back healthy. **Future staff-uploaded photos now persist across redeploys** — was a launch-blocker for the 400-game sprint. (API call: `POST /api/v1/applications/{uuid}/storages` with body `{"name":"photos","type":"persistent","mount_path":"/app/photos"}`. Coolify auto-prefixes the volume name with the app UUID.)

**Verified on dev (Playwright, multi-engine):**
- Catalogue grid: 20/20 cards render `<picture>` with successful image loads (was: 0/20 in Chromium, 12/20 Firefox, 3/20 WebKit pre-fix).
- Staff add-game / edit-game: two-column layout intact, BGG search input 544 px (was ~80 px), Cancel + Save buttons fully visible (was: clipped at left).
- Edit-game PhotoUpload gallery: missing-photo thumbnails show the muted "missing" icon (was: alt-text overlay).
- `/games/[id]` hydration mismatch warning **gone** as a side-effect of `c73f138` (the warning was triggered by the same SSR/CSR drift on the hero `<picture v-if>` branch).

**Next action when resuming (in priority order):**
1. ✅ **Merge `dev` → `main`** (done 2026-05-31, commit `6c7a108`) — prod now carries every fix shipped since the M5 visual pass. **Follow-up: confirm the prod deploy went green** (GitHub Actions run on `main`, then check `https://tabletopcafe.edgestudios.co.za` renders the M5 catalogue and the header version reads the commit-timestamp scheme, not `v5`).
2. **Investigate build-version drift** — `nuxt.config.ts` derives version from `git log -1 --format=%cI HEAD` but deployed dev build shows times ~5 min later than the actual commit timestamp (e.g. commit at 22:50 → deploy reports `v26.05.30.2255`). Theory: Coolify creates a transient internal commit during the build (merge of remote ref, etc.) and the build container reads that commit's time. Worth confirming with `docker exec` once during a fresh deploy to see what `git log -1` inside the builder actually returns.
3. **Shared-component token migration** — awaiting design sign-off on mapping (see queue below). Files: [app/components/shared/Button.vue](app/components/shared/Button.vue), [app/components/shared/Input.vue](app/components/shared/Input.vue), [app/pages/staff/login.vue](app/pages/staff/login.vue).
4. **Auth bypass removal** — explicitly deferred until last per owner instruction. Pre-req: resolve Coolify `ADMIN_PASSWORD` mismatch root cause first, otherwise prod admin is locked out.

**Design-team asks queued (blocking the items below):**
- `Button.vue` paddings (`9px 16px`, `6px 12px`, `6px 8px`, `gap: 7px`) and `Input.vue` padding (`9px 11px`) — none map cleanly to existing spacing tokens (`--spacing-sm: 8px`, `--spacing-md: 16px`). Decide: add button/input-specific tokens, or accept ±1-2px nudges to fit existing scale?
- `login.vue` literals (`max-width: 360px`, `padding: 30px 28px`, `margin-bottom: 22px`, `font-size: 20px/13px`, `letter-spacing: -0.02em`) — need new login-specific tokens or sign-off on a mapping using existing tokens.
- **QR codes for tables** — physical artwork: laminated card design, brand/wordmark, "Scan to browse our games" copy, target dimensions, print-ready PDF. Code side is trivial once design exists.
- **Audit fields display** — requirements capture `created-by/at`, `last-edited-by/at`, `deleted-by/at` in the DB but they're not surfaced anywhere. Decide: surface on edit page? Which of the 6 fields? Placement/typography?

**Open audit findings still in scope (no design needed):**
- Performance pass on representative low-end Android — catalogue scroll, image loading, TTI.
- 400-game data entry sprint — operational, will surface real bugs.



### M5 checklist
- [x] Tokens: Felt & Slate palette, glass tokens, `--mesh-bg`, new radii/shadows/semantic font sizes — `tokens.css`
- [x] Catalogue glass: mesh + frosted header/footer in `default.vue`, glass toolbar + 1→2→3 responsive grid in `index.vue`
- [x] `GameCard.vue` restructured — photo-as-background, scrim, frosted info panel, responsive aspect ratio (16/10→4/3→3/4), brand-gradient no-photo fallback
- [x] `FeaturedBadge.vue` — glass pill variant (translucent green, blur, star icon)
- [x] `GameListItem.vue` — flat bordered rows, brand-gradient thumbnail fallback, new tokens
- [x] `CatalogueFilters.vue` — glass filter chips (unselected: semi-translucent; selected: solid brand)
- [x] Detail page `games/[id].vue` — glass hero (full-bleed photo + scrim + title overlay), glass content panels, responsive sticky two-column on desktop, no-photo fallback
- [x] Staff layout `staff.vue` — flat white nav bar, brand underline active link, 58px height
- [x] Staff login `login.vue` — rebuilt to match `design/staff.html` spec: 360px card, border, centered wordmark + muted subtitle, scoped CSS (no Tailwind utility layout)
- [x] Staff dashboard `staff/index.vue` — proper table (thumb + name + pill columns), segmented filter, status pills, brand-gradient thumbnail fallback
- [x] `Button.vue` — all layout/sizing moved to scoped CSS (`display`, `padding`, `font-size`, `font-family`, `transition`, `cursor`, `white-space: nowrap`); Tailwind utilities removed from template
- [x] `Input.vue` — all layout/sizing moved to scoped CSS (`display: block`, `width: 100%`, `padding: 9px 11px`, `font-size: 14px`, `font-family: inherit`); Tailwind utilities removed from template
- [x] `GameForm.vue` — two-column desktop layout (details left, featured+photos right in cards), BGG block with dashed brand-accent border, right-aligned footer actions
- [x] `StaffGameListItem` query extended to include `photoHash` (first photo per game)
- [x] CSS variable fix: Tailwind v4.3 generates `utility-[--variable]` without `var()` — public M5 components migrated to scoped CSS with explicit `var()` or inline `style` attributes
- [x] Staff-admin Tailwind v4.3 regression fix (2026-05-30, commit `9721da3`): the original M5 migration missed the staff admin surface (64 broken occurrences across 7 files). Now migrated to the same pattern as the public catalogue. Affected: `staff/{BggSearch,PhotoUpload,TagTypeahead}.vue`, `staff/games/{new,[id]/edit}.vue`, `staff/tags/index.vue`, `staff/users/index.vue`
- [x] Catalogue no-photo fallback bug fix (2026-05-30, commit `df5de96`): `v-if="game.photoHash"` only checked the DB column — when the served file 404s the browser rendered the broken `<img>` with its alt text. Added `@error` handler + flag in `GameCard`, `GameListItem`, `games/[id].vue` hero, `staff/index.vue` thumbnail
- [x] Catalogue SSR/hydration race fix (2026-05-30, commit `c73f138`): the `df5de96` `@error` handler missed events that fired before Vue hydrated — `onMounted` post-mount sweep now catches images already in the loaded-but-broken state. Same pattern applied to `PhotoUpload.vue` existing-photo gallery in commit `5612ab9`
- [x] Staff form layout regression fix (2026-05-30, commit `5612ab9`): `max-w-2xl` on `staff/games/new.vue` + `[id]/edit.vue` collapsed the form's 2-col layout (`1fr 320px`) to a ~190 px left column. Raised to `max-w-5xl`. Restores M5 design intent.
- [x] Dev seed-on-redeploy photo recovery (2026-05-30, commit `6517641`): `scripts/seed.ts` now writes placeholder photos on every game iteration, not only on insert. Defends against `/app/photos` being ephemeral when re-seeding
- [x] `/app/photos` persistent volume mount on **dev** and **prod** Coolify apps (2026-05-30, infra-only — not in git). Stops staff-uploaded photos from vanishing on every redeploy. Launch-blocker for the 400-game data entry sprint
- [x] Design alignment pass (diff against `design/glass.html` + `design/detail.html` mockups):
  - `GameCard.vue`: fallback letter 85% opacity (was 20%), smaller size (3rem vs 7rem), meta row gap 16px (was 10px), brand-tinted shadow on featured cards
  - `index.vue`: ★ star icon on Featured section label, view toggle changed to two separate bordered buttons with gap (was single grouped container)
  - `games/[id].vue`: back pill translucent 16% (was opaque 55%), "Staff pick" label added to featured note, tags use glass fill (was solid surface)
- [x] `seed-admin.ts` — now syncs password on every deploy (not just first boot); ADMIN_PASSWORD in Coolify is always the source of truth
- [x] `CLAUDE.md` — updated to pull from `origin dev` (was `origin main`)
- [ ] **Pre-launch cleanup (do before data entry):**
  - Remove auth bypass in `server/api/auth/login.post.ts` (TODO comment marks it) — explicitly deferred until last; resolve Coolify credentials mismatch first or prod admin is locked out
  - Replace hardcoded `px`/`font-size` literals in `SharedInput`, `SharedButton`, and `login.vue` with `var(--*)` token references — currently breaks skinnable-via-tokens guarantee. **Blocked on design sign-off** for token mapping (see Session end note above)
  - Resolve actual admin credentials issue (unknown why Coolify ADMIN_PASSWORD wasn't matching)
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

- **Version (replaces old `BUILD_NUMBER` scheme as of 2026-05-30, commit `74e446b`)**: computed at build time from `git log -1 --format=%cI HEAD` in `nuxt.config.ts`, formatted as `v{YY}.{MM}.{DD}.{HHMM}` in Africa/Johannesburg time (e.g. `v26.05.30.1629`). No file in repo, no GH Actions bump job. Requires `git` in the Docker builder stage (`apk add --no-cache git` in the builder layer). Falls back to build-time `new Date()` with a console warning if git is unavailable. Header shows `Table-Top-Cafe  v…`.
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
