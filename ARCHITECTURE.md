# Architecture — TableTopCafe

This document describes the shape of the TableTopCafe system: how it's structured, what technologies it uses and why, and the constraints that shaped those choices. It assumes the [requirements document](./requirements.md) as context and does not restate feature decisions made there.

## System shape

TableTopCafe is a single Dockerized web application serving two interfaces from one Node.js process: a public catalogue at `/` and a staff/admin interface at `/staff`, separated by route-level authentication middleware. Both interfaces talk to the same PostgreSQL database in a sibling container; uploaded and fetched photos live on a named Docker volume mounted into the app container. Board-game name search for data entry is served from a static committed JSON file bundled into the build; there is no background refresh task.

There is no separate API tier, no message queue, no cache layer, no CDN, no microservices. The expected load (≤30 concurrent readers, ≤2 concurrent writers, ~400 catalogue rows) makes any of those a liability rather than an asset. The system is deliberately a monolith on a single host.

## Backend

**Runtime: Node.js 22 LTS with TypeScript, end-to-end.** TypeScript is non-negotiable: this codebase will be substantially developed by AI agents, and a strong type system catches the class of mistakes agents most commonly make. Type information must flow from the database schema through the data-access layer to the route handlers and into the rendered templates with no `any` escape hatches.

**Framework: Nuxt 3 (Vue 3, SSR, Nitro server).** A single Nuxt application serves both the customer catalogue and the staff interface. Nuxt's server routes (`/server/api/...`) handle write operations and JSON endpoints for the staff app; the customer-facing pages are server-rendered for fast first paint on slow devices and progressively hydrated. The decision to use one framework for both surfaces — rather than, say, Astro for the public side and a separate SPA for staff — trades a small amount of public-side performance for a substantially simpler codebase, single build pipeline, and one mental model for agents and humans to hold.

**Database access: Drizzle ORM over PostgreSQL.** Drizzle was chosen over Prisma and Kysely specifically for its TypeScript inference quality and its lightweight runtime. Schema is defined in TypeScript files under `db/schema/`, migrations are generated via `drizzle-kit`, and queries are written in Drizzle's SQL-like builder. Raw SQL is permitted where it's clearer than the builder, particularly for the trigram-based name search.

**Authentication: Lucia.** Six users, no recovery flow, no email verification, admin resets passwords manually. Sessions are cookie-based, stored in Postgres. Passwords are hashed with Argon2id. The full auth surface is one library and roughly two database tables; pulling in a hosted auth provider would be operational overkill.

## Frontend

**The catalogue and staff app are both Vue 3 components inside the same Nuxt application,** with different routes and different layouts. The public catalogue is server-rendered with selective hydration; the staff interface is a more conventional client-side-interactive set of pages behind auth middleware.

**Theming via design tokens is a hard architectural constraint.** All visual values — colors, spacing, typography, radii, shadows, breakpoints — are defined as CSS custom properties in a single tokens file and consumed via Tailwind v4's CSS-first `@theme` configuration. Components reference tokens by name (`var(--color-surface)`, `--space-md`), never literal values. This is the discipline that makes a future reskin a token-file change rather than a refactor. It does not make a structural redesign painless — only a visual one.

**Performance on low-end mobile devices is treated as a first-class requirement.** Concretely: the catalogue grid uses `content-visibility: auto` on each card so off-screen items skip layout/paint/compositing while remaining in the DOM (all cards are rendered server-side for SSR; `content-visibility` skips the GPU work for off-screen ones on scroll), images are served as WebP with JPEG fallback in three sizes (thumbnail, card, detail) via `srcset` and `loading="lazy"`, and the initial HTML is server-rendered so first paint doesn't wait for JavaScript. The public-side JavaScript budget is treated as scarce: server rendering is preferred over client hydration wherever it doesn't cost interactivity, and adding a client-side dependency to the catalogue route requires deliberate justification rather than being a default.

**The customer can toggle between an editorial card grid (default) and a dense list view.** Both render from the same data and apply the same filters; the choice persists in a cookie (`ttc-catalogue-view`, 1-year `maxAge`) via Nuxt's `useCookie` composable so the value is available server-side during SSR and client-side after hydration — avoiding the hydration mismatch that `localStorage` would cause. The editorial view is the design-investment surface and should be anchored to a clear visual reference (current target: Apple's product-listing aesthetic, adapted for higher density given 400 items rather than 12).

**Progressive Web App support is included from v1:** a web app manifest, an icon set, and a minimal service worker for installability. No offline functionality is in scope — the service worker exists only to satisfy install criteria.

## Data model

The schema centres on five core tables: `games`, `tags`, `game_tags` (join), `photos`, and `users` (plus `sessions` for auth). The shape follows the requirements doc directly with two architectural notes:

**Tags use a soft `archived_at` column rather than hard deletion.** Deleting a tag in the UI sets `archived_at`; the customer filter list and the type-ahead exclude archived tags, but existing `game_tags` rows are untouched. This implements the requirement that deleting a tag must not mass-untag games.

**The `games` table represents a catalogue title, not a physical copy.** Today these are the same thing and the distinction is invisible. In a future where availability tracking is added, a `game_copies` table can be introduced (one row per physical box, with availability state) without modifying the `games` table or its relationships. This is the only forward-looking compromise in the schema; it costs nothing now and avoids a painful migration later.

Audit fields (`created_by`, `created_at`, `last_edited_by`, `last_edited_at`, `deleted_by`, `deleted_at`) live on `games` directly. Full change-history is explicitly out of scope per the requirements.

The `bgg_games_cache` table that existed in earlier versions of the schema has been dropped (migration `0005_breezy_blue_blade.sql`, 2026-06-02). The original design called for it to hold the local name index refreshed weekly by a cron task; that approach was retired on 2026-06-01 when the live BGG integration was removed (see the External integrations section below). The name-search data now lives in a static committed JSON file at `server/data/board-games.json`.

## Photos

**All photos are stored locally on the VPS, regardless of origin.** Staff can either upload a file or paste a URL (including BGG image URLs surfaced by the "fetch game info" action); in both cases, the server downloads the source, processes it through `sharp` into three derived sizes (thumb 200px, card 600px, detail 1200px) in WebP and JPEG, and writes them to the photos volume under a content-addressed path. Hotlinking to external images is explicitly forbidden — it would leak customer IPs to third parties at read time and create a runtime dependency on someone else's hosting.

The photos volume is the single piece of mutable filesystem state the application owns. It must be included in any backup strategy alongside the database dump.

## External integrations

**BoardGameGeek is the source of the known-games list and used for two distinct purposes:**

1. *Name autocomplete during data entry.* Served entirely from the local `bgg_games_cache` table. No live BGG calls. Refreshed weekly.
2. *Detail enrichment.* Triggered explicitly by a "fetch game info" button after the staff member has selected a game. Hits BGG's XML API for the chosen game, parses the response, and pre-fills the add/edit form. The staff member reviews and edits before saving.

This separation means data entry continues to work cleanly even if BGG is down — only the optional enrichment step degrades. The image-rights situation around BGG-sourced images is acknowledged: photos are surfaced as one-click candidates that, on confirmation, are fetched and stored locally per the photos policy above.

> **Update (2026-06-01): live BoardGameGeek integration retired.** BGG's XML API now returns `401 Unauthorized` (gated behind approved access), and its public game pages are behind Cloudflare, which blocks the server's `fetch` by client fingerprint (`403`) regardless of headers — so neither the XML enrichment nor a public-page scrape works from the deploy host. The live integration and its plumbing (XML/scrape services, the "fetch game info"/cover endpoints, the weekly `bgg:refresh` cron, and the `bgg_games_cache` table's use) were removed. What remains:
> - *Name autocomplete* is served from a **static committed `server/data/board-games.json`** (~42k games from BGG's public ranks export; name + bggId only) via `server/utils/gameNames.ts` and `/api/game-names/search`. No DB cache, no weekly refresh, nothing seeded on deploy. The `bgg_games_cache` table was dropped in migration `0005` (2026-06-02).
> - *Detail enrichment* now comes from **Wikipedia's open API** (`server/services/wikipedia.ts`, `GET /api/wikipedia/info`) — not Cloudflare-gated. It finds the article, confirms it's a tabletop game via the `{{Infobox game}}` template (so a no-article/video-game/disambiguation result returns nothing rather than a wrong match), and pre-fills the **description** (intro summary) plus **players and play time** parsed from the infobox (ranges, `{{ubl}}` lists, hours→minutes handled). All fields editable.
> - The public detail page keeps a **"View on BoardGameGeek"** link built from the captured `bggId`.

## Deployment & operations

The application ships as two containers managed by `docker compose`: `app` (Nuxt + Nitro) and `db` (PostgreSQL 16). A named volume holds the photos directory; another holds the Postgres data directory. A `.env` file holds runtime configuration (database URL, session secret, BGG API base URL); secrets are not committed and are managed by the operator out-of-band. Database migrations run automatically on container start via `drizzle-kit migrate`.

**Two deployment environments run on the same VPS via Coolify:**

- **Production** tracks the `main` branch at `tabletopcafe.edgestudios.co.za`. It has its own dedicated PostgreSQL instance. The `AUTO_SEED` environment variable is never set here — production data is managed exclusively by staff through the admin interface.
- **Dev** tracks the `dev` branch at `tabletopcafedev.edgestudios.co.za`. It has a separate PostgreSQL instance. `AUTO_SEED=true` is set, so `docker-entrypoint.sh` runs migrations and then the seed script on every container start, giving the dev environment a consistently populated catalogue for testing. The seed data is test-only and has no bearing on production.

The container is fronted by the operator's existing reverse proxy on the VPS, which handles TLS termination. The application itself listens on plain HTTP inside the Docker network.

Backups are handled out-of-band by the operator (container imaging plus volume snapshots, pulled to client-side storage). No backup infrastructure is built into the application.

No application-level metrics, tracing, or alerting infrastructure exists. Logs are written to stdout and captured by Docker. This is appropriate for the stated best-effort uptime requirement and the absence of an SLA; adding observability infrastructure now would be premature.

## Conventions for AI-agent-driven development

Because this codebase will be developed primarily by AI agents and Claude Code, structural uniformity matters more than it would in a human-only codebase. A `CONVENTIONS.md` at the repo root captures the rules agents are expected to follow: directory layout, naming conventions, where database queries live, how route handlers are structured, how components are organized, and which patterns to prefer when several would work. Agents are pointed at this file as standard context.

A minimal test harness exists from day one: Vitest for unit and integration tests, Playwright for a small suite of end-to-end smoke tests (customer loads catalogue, staff logs in, staff adds a game). The harness exists less for human-written test coverage than to give agents a tight feedback loop.

## Architectural non-goals

The following are deliberate architectural exclusions, distinct from feature-level scope decisions in the requirements doc:

- **No multi-tenant deployment.** The application assumes a single café. Supporting multiple cafés from one deployment would require tenant scoping on every table, query, and route, and is not built in.
- **No horizontal scaling.** The application is a single-process, single-container deployment with local filesystem state for photos. It cannot be run as multiple replicas behind a load balancer without first moving photos to object storage and sessions to a shared store.
- **No background job queue.** There is no scheduled background work in the current implementation — the weekly BGG cache refresh that originally motivated an in-process cron was removed on 2026-06-01 along with the live BGG integration. Long-running or retry-heavy background work is not supported by this architecture.
- **No event sourcing or change-data-capture.** The database is the system of record and the only source of truth. The requirements explicitly exclude full change history; the architecture does not provide hooks for adding it later without rework.
- **No client-side offline mode.** The service worker exists for PWA installability only. The application requires a network connection to function.
- **No public API.** The server routes under `/api` are implementation details of the staff interface, not a stable contract for third-party consumers.
