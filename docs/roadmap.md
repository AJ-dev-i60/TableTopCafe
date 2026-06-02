# Roadmap — TableTopCafe

Phased delivery plan for v1. Each milestone is a coherent slice that leaves the system in a working, deployable state. Milestones are sequential — later ones assume earlier ones — but the boundary between them is what "done" looks like, not a task list.

This plan is consistent with [requirements.md](./requirements.md) and [ARCHITECTURE.md](./ARCHITECTURE.md). Where it deviates from the sequencing the operator suggested, the reason is noted inline.

## Milestone 0 — Walking skeleton

The repo exists, the stack boots, and a request from the public internet reaches the app through the operator's reverse proxy and gets a real response.

**In scope:**

- Nuxt 3 + TypeScript project initialized with the directory layout from `CONVENTIONS.md`.
- `docker-compose.yml` with `app` and `db` services, named volumes for Postgres data and photos.
- Drizzle configured against Postgres, with `drizzle-kit migrate` running on app container start. One trivial migration exists (e.g. a `health_check` table) to prove the migration pipeline works end-to-end.
- One route (`/`) renders a placeholder page server-side.
- One server route (`/api/health`) returns `{ ok: true, db: 'connected' }` after pinging Postgres.
- Tailwind v4 wired up with the design tokens file from the architecture doc, even if the tokens are placeholder values. CSS custom properties resolve in the rendered page.
- Vitest and Playwright installed and configured. One Vitest test and one Playwright smoke test exist and pass.

**Done when:** the operator can `docker compose up` on the VPS, hit the public URL through the reverse proxy, and see the placeholder page render. `/api/health` returns success. `npm test` and `npm run test:e2e` both pass locally and in a CI workflow (GitHub Actions, minimal config).

## Milestone 1 — Read-only catalogue with seed data

The customer-facing catalogue works end-to-end against hand-seeded data. No staff interface yet.

**In scope:**

- Full schema for `games`, `tags`, `game_tags`, `photos` (no `users`, `sessions`, or `bgg_games_cache` yet). Audit columns present but populated with placeholder values during seeding.
- A seed script that loads ~20 real games with real tags and locally-stored placeholder photos, sufficient to exercise the catalogue UI at realistic-ish density.
- Customer catalogue route (`/`): card grid (editorial default) and list view toggle, persisted to `localStorage`.
- Search by name, filter by player count, play time, and tags. Filters combine (AND across categories, OR within a multi-select).
- Featured games surface at the top (up to three).
- Game detail page (`/games/[id]`).
- Image pipeline: `sharp` processes uploads (or in this milestone, the seed script's photos) into thumb/card/detail sizes in WebP + JPEG. `<img srcset>` and `loading="lazy"` in use.
- The "catalogue shows library, not real-time availability" note appears somewhere visible.
- PWA manifest, icons, and minimal service worker — installability works on mobile.

**Done when:** a customer on a phone can load the URL, browse 20 games in either view, search and filter, open a game's detail page, and "install" the catalogue as a PWA. A Playwright smoke test exercises the catalogue + filter flow.

## Milestone 2 — Staff auth and game CRUD

Staff can log in and manage the catalogue manually. BGG is not involved yet.

**In scope:**

- `users` and `sessions` tables, Lucia configured, Argon2id password hashing.
- Login page at `/staff/login`, session cookie, route-level auth middleware on everything under `/staff`.
- One admin user seeded via a one-shot script (credentials provided via env var on first boot).
- Staff dashboard at `/staff` after login.
- Add game: full form with manual entry of all fields. Tag type-ahead from existing tags, inline new-tag creation.
- Edit game: same form, pre-populated.
- Soft-delete game: removes from public catalogue, retains in DB.
- Photo upload: one or more photos per game, processed through the same `sharp` pipeline as the seed script.
- Audit fields populated correctly on create, edit, delete.

**Done when:** an admin can log in, add a game manually with photos and tags, see it appear in the public catalogue, edit it, soft-delete it (it disappears from the catalogue), and log out. A Playwright smoke test exercises log-in → add game → see it on the public catalogue.

## Milestone 2.5 — Tokenization and convention remediation ✅

Internal cleanup milestone inserted between M2 and M3. No new features, no visual redesign, no behavioural changes. The purpose is to make the architectural claim in ARCHITECTURE.md — that the app is skinnable via tokens — actually true. Before this milestone, spacing and font-size tokens were defined but had no consumers, `bg-white` and `text-white` were hardcoded in 20+ places, sticky offsets were measured-pixel literals, and Inter was named in the token file but never loaded.

**In scope:**

- Token set expanded: `--color-brand-foreground`, a 10-step warm neutral scale (placeholder values, calibrated to the existing palette's warm cast, to be refined in M5), semantic typography tokens (`--font-size-card-title`, `--font-size-meta`, `--font-size-ui`, etc.) layered on the primitive size scale, layout chrome heights (`--header-height`, `--toolbar-height`), motion tokens (`--duration-fast`, `--duration-base`), and z-index layers (`--z-toolbar`, `--z-header`).
- All hardcoded colors replaced: `bg-white` → `bg-[--color-surface]` everywhere; `text-white` on brand surfaces → `text-[--color-brand-foreground]`; `rounded-lg` (Tailwind built-in) → `rounded-[--radius-md]` on GameCard.
- Semantic font-size token wiring: components use generated utilities (`text-card-title`, `text-meta`, `text-tag`, `text-ui`, `text-body`, `text-detail-title`, `text-section-label`) rather than raw Tailwind size utilities. Selective spacing wiring: major layout boundaries use named token utilities (`px-md`, `py-lg`, `mb-md`, etc.); micro-layout fine-tuning stays as numeric Tailwind utilities (the selective-explicit convention).
- Hardcoded z-indices, transition durations, and sticky offsets replaced: `z-20`/`z-10` → `z-header`/`z-toolbar`; `duration-150`/`duration-100` → `duration-base`/`duration-fast`; `top-[57px]` → `top-[--header-height]`; `top-[115px]` → a scoped CSS calc from `--header-height` and `--toolbar-height`.
- Inter loaded self-hosted via `@fontsource/inter` (weights 400/500/600/700), removing the Google Fonts runtime dependency.
- Shared components extracted to `app/components/shared/`: `FeaturedBadge` (pure presentational pill, placement is the parent's responsibility), `Button` (primary and danger variants), `Input` (v-model, `invalid` prop for error state, full attr inheritance).
- Login page SSR re-enabled after the root cause (a `v-show` + Tailwind v4 CSS-variable-in-text ambiguity) was confirmed already fixed in commit 294fee4.

**Out of scope:** visual redesign, any new feature, touching `server/api/` or `server/db/`.

**Done when:** changing a token value in `tokens.css` propagates to every consumer without additional code changes. ✅

## Milestone 3 — BGG integration

> **Superseded (2026-06-01).** The live BGG integration described below no longer works: the XML API is gated (`401`) and BGG's public pages are Cloudflare-blocked for server-side `fetch` (`403`). Delivered instead: **name autocomplete** from a static committed `board-games.json` (no DB cache, no weekly cron) and **description + players + play-time enrichment from Wikipedia's open API** (`server/services/wikipedia.ts`, `GET /api/wikipedia/info`). Wikipedia parses the `{{Infobox game}}` template to fill player-count ranges and play-time ranges in addition to the description summary; all fields remain editable. See the 2026-06-01 note in `ARCHITECTURE.md` and `docs/progress.md`. The text below is kept for historical context.

Data-entry workflow becomes fast enough for the 400-game session.

**In scope:**

- `bgg_games_cache` table with `(bgg_id, name, normalized_name)` and a trigram index.
- One-shot ingestion script that populates the cache from a BGG data source. The exact source is a milestone deliverable — see "Uncertainty" below.
- Weekly cron task inside the app container that refreshes the cache.
- Add-game form: type-ahead against `bgg_games_cache`, "fetch game info" button that calls BGG's XML API for the selected game, parses the response, and pre-fills form fields.
- "Fetch game info" also surfaces BGG-hosted images as one-click candidates. Selecting one triggers a server-side fetch-and-store through the existing photo pipeline.
- Graceful degradation: if BGG is unreachable, the type-ahead still works (cache is local) and the "fetch game info" button shows a clear error rather than hanging.

**Done when:** a staff member can start typing "Catan", pick the right entry from the type-ahead, click "fetch game info", see the form pre-fill, click a BGG image to attach it, edit anything they want, and save — without leaving the keyboard for the common path.

## Milestone 4 — Remaining features ✅

Everything else the requirements doc calls for.

**In scope:**

- Mark/unmark games as featured (max three, enforced in UI and at the data layer). Optional featured note.
- Tag management view: rename tags, consolidate duplicates (merge source tag's games onto target, remove source).
- Tag soft-delete (`archived_at` set; existing `game_tags` rows untouched; tag drops out of customer filters and staff type-ahead).
- Soft-deleted games view, restore action.
- Admin-only routes: create staff account, reset staff password, delete staff account.
- Role enforcement: staff vs admin distinguished in middleware, not just in UI.

**Done when:** every functional requirement in `requirements.md` has a working implementation. Playwright smoke tests cover the featured-game flow and the tag-merge flow.

## Milestone 5 — Polish and the 400-game data entry session

The system is ready to be the real catalogue for the café.

**In scope:**

- Design pass on the editorial catalogue view against the chosen visual reference. This is where the design-token values stop being placeholders and become the real palette/type/spacing scale.
- Performance pass on a representative low-end Android: catalogue grid scroll, image loading, time-to-interactive on the catalogue route.
- The 400-game data entry sprint itself. Treated as a milestone deliverable because it is the first real load on the system and will surface bugs that synthetic testing won't.
- Any small fixes that come out of the data-entry sprint.
- A printed QR code on each table pointing to the public catalogue URL.

**Done when:** the catalogue is live, ~400 games are in it, the café has QR codes on tables, and the owner has signed off on the visual design.

## Sequencing notes

The operator's suggested order is preserved as-is. One thing I considered moving and decided not to: BGG integration (milestone 3) could plausibly come before staff CRUD (milestone 2), since the BGG-assisted form is the form staff will actually use. The reason it stays where it is: manual CRUD is the fallback path that has to work anyway (per the requirements, ~30 of the 400 games will need manual entry), and getting it working first means milestone 3 is a pure enhancement rather than a from-scratch build. If BGG integration turns out to be harder than expected, the system is still useful at the end of milestone 2.

## Uncertainty

**The BGG data source for the names cache is unresolved.** Three options: BGG's XML API with a slow bulk-scrape (slow, rate-limited, fragile), a community-maintained data dump (depends on what's currently available and maintained), or a one-time hand-curated seed of the few thousand most popular games (limits the type-ahead to mainstream titles, which may actually be fine for this café). I'd resolve this at the start of milestone 3, not now — by then we'll know more about how often staff actually hit obscure titles. Worth flagging because it could push milestone 3's scope up or down.

**Milestone 5 has an unbounded "polish" component.** The design pass and performance pass are real work and could easily expand. The hard stop is "owner signs off and the catalogue goes live" — beyond that, further polish becomes post-v1 work, not part of this roadmap.
