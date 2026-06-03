# Progress — TableTopCafe

Granular session-level state: what's done, what's next, and anything needed to resume on a fresh machine. For the milestone plan and scope definitions see `docs/roadmap.md` — this file tracks *where we are*, not *where we're going*.

## Current milestone: M5 — Polish 🚧

**Status: Large staff/catalogue UX pass landed on `dev` 2026-06-01 (photo management, detail-page redesign, sliders, list search/filters, tag-games manager, BGG→Wikipedia). All on `dev`, owner testing in progress; NOT yet merged to `main` — awaiting owner sign-off, then `dev`→`main`. Remaining for launch: 400-game data entry, low-end Android perf pass (code changes ✅ 2026-06-03 — on-device verification still pending), QR codes, backups confirmation. (Auth-bypass removal ✅ 2026-06-02; shared-component token migration ✅ 2026-06-03.)**

### Session — 2026-06-03 (low-end Android perf pass — code changes; on-device verification still pending)

Structural catalogue-perf changes that are known-good for low-end Android regardless of measurement. **Important:** a true device pass (scroll FPS, TTI/LCP) was NOT run — there's no local Postgres on this machine, so the app can't boot locally; these must be verified on the **dev deploy** against a real low-end Android or throttled emulation (see methodology below).

**Done (committed on `dev`):**
1. **Catalogue payload trimmed (biggest TTI lever).** `listVisibleGames()` / the `GameListItem` type no longer select `description` (≤2000-char Wikipedia text) or `featuredNote`. The catalogue list path never rendered them — search is name-only (`useFilters`), and only the detail page shows them (via the separate `GameDetail`/`getGameById`). For ~400 games this removes a large chunk of the SSR HTML + hydration payload (serialized + JSON-parsed on a slow CPU). `server/db/queries/games.ts`.
2. **`content-visibility: auto` on cards + list rows.** Off-screen `GameCard`s and `GameListItem`s skip layout/paint/compositing (including the per-card scrim + `backdrop-filter` panel) — the main scroll cost driver at 400 items. Cards' explicit `aspect-ratio` still resolves box height while contents are skipped, so the grid does not reflow on scroll; `contain-intrinsic-size` is the pre-first-render fallback only (cards `auto 300px`, rows `auto 73px`). Progressive enhancement — unsupported browsers ignore it.
3. **`theme-color` fixed** `#2563eb` (stray blue) → brand green `#15803d` in `nuxt.config.ts` (PWA status-bar tint; cosmetic).

Verified: `npm run build` clean, `npm run test` 10/10. Image handling was already good (correct `srcset`/`sizes`, `loading="lazy"`, WebP+JPEG, 1-yr immutable cache on `/api/photos`) — left as-is.

**Remaining / device-gated levers (verify on dev, apply only if measurement shows need):**
- **Per-card `backdrop-filter` → semi-opaque fill.** Pre-authorized by `design/HANDOFF.md` §5 ("if jank on a mid-range Android in catalogue scroll, drop the per-card panel blur to a semi-opaque fill first"). With `content-visibility` only on-screen cards composite the blur, so this may no longer be needed — confirm on device before sacrificing the frosted look.
- **Eager LCP image.** First visible image (mobile `FeaturedStrip` item, else first card) is currently `loading="lazy"`; mark it `loading="eager" fetchpriority="high"` for faster LCP on slow links. Needs a `priority` prop plumbed through `CatalogueBrowser` → card/strip. Deferred (modest win, small images).
- **Virtualization** only if 400 cards still jank after the above — `content-visibility` usually makes a virtual list unnecessary here.
- **Measurement methodology:** Chrome DevTools on the dev URL — Performance panel with 4×/6× CPU throttle + "Slow 4G", record a catalogue scroll (watch for long tasks / dropped frames); Lighthouse mobile for TTI/LCP/TBT. Ideally also a real low-end Android via remote debugging. Target: smooth scroll + reasonable TTI on the full ~400-game catalogue.
- **Adjacent a11y note (not perf, not changed):** `nuxt.config.ts` viewport sets `maximum-scale=1, user-scalable=no`, which disables pinch-zoom for the whole public catalogue — an a11y regression for café patrons. Flagging for a decision; the deliberate zoom-suppression in progress notes was about the detail lightbox/staff UI, not the public site globally.

### Session — 2026-06-03

**Shared-component token migration done.** The "blocked on design sign-off" flag was stale — `design/HANDOFF.md` §7 states there are no remaining design decisions, and §4e gives the exact Button/Input spec. Paid down the token debt in the shared-component scoped CSS (value-preserving — rendering unchanged):
- `Button.vue`: `font-size: 14px` → `var(--font-size-ui)`; transition `150ms` ×3 → `var(--duration-base)`.
- `Input.vue`: `font-size: 14px` → `var(--font-size-ui)`; focus/invalid ring `rgb(...)` literals → new `var(--color-focus-ring)` / `var(--color-error-ring)` tokens.
- `SearchInput.vue`: focus ring (identical 0.15 brand value) → `var(--color-focus-ring)` (folded in — same debt).
- `login.vue`: brand `20px` → `var(--font-size-xl)`; sub/label/error `13px` ×3 → `var(--font-size-meta)`.
- `tokens.css`: added `--color-focus-ring` (brand @15%) and `--color-error-ring` (error @15%).
- Per `CONVENTIONS.md` selective-explicit rule, micro-layout literals (button/input paddings, 7px gap, 16px icon, login margins, the `max-w` 360px footgun workaround) stay numeric.
- **Not tokenized (distinct deliberate values, flagged for later):** `FeaturedBadge.vue` glass fill `rgb(21 128 61 / 0.6)`, `RangeSlider.vue` thumb focus ring `rgb(21 128 61 / 0.25)`. `npm run build` clean.

### Session — 2026-06-02

**Auth bypass removed (commit `f73b730`).** The hardcoded dev-convenience bypass in `server/api/auth/login.post.ts` that allowed login with an empty password has been removed. `password: z.string().min(1)` validation is restored. Login now always requires real credentials; the admin account is bootstrapped via `seed-admin.ts` from the `ADMIN_USERNAME`/`ADMIN_PASSWORD` Coolify env vars on container start. Pre-launch checklist item closed.

**Dead BGG cache code removed; search renamed (commit `3e37311`).** Cleaned up the remaining dead code from the BGG retirement:
- Deleted `server/db/schema/bgg.ts` (the `bgg_games_cache` table schema).
- Dropped the `bgg_games_cache` table via migration `0005_breezy_blue_blade.sql` (the table was never populated in production; dropping it now is safe).
- Deleted `scripts/refresh-game-names.ts` (superseded by `scripts/convert-bgg-ranks.ts`).
- Removed the `gen:game-names` npm script.
- Renamed `app/components/staff/BggSearch.vue` → `GameSearch.vue` and its exported type `BggResult` → `GameSearchResult` to accurately reflect that the search is against the local static JSON, not live BGG.
- Moved `server/api/bgg/search.get.ts` → `server/api/game-names/search.get.ts`; the `/api/bgg/` directory is now empty and removed. `GameForm.vue` updated to import from the new location.

**Staff stats endpoint added (commit `f0dffb1`).** New `GET /api/staff/stats` returns `{ games, tags, users }` counts for the staff dashboard. Auth-gated via `requireAuth`.

**TagTypeahead dropdown fix (commit `a21f938`).** The tag input dropdown now reopens correctly after a selection is made. Mobile page zoom suppressed on the staff interface.

---

### Session — 2026-06-01

Large UX + features pass, all pushed to `origin/dev` across the day and being owner-tested. Grouped by area:

**Game detail page — full-screen redesign + photo lightbox.**
- New `app/layouts/detail.vue`: the title bar carries a "← Catalogue" back link (replacing the wordmark) so an opened game reads as its own screen. Detail page uses `definePageMeta({ layout: 'detail' })`; the old glass back-pill over the image is gone.
- New `app/components/catalogue/PhotoLightbox.vue`: full-screen viewer opened from the hero or any thumbnail. Cycles all photos via swipe / arrow buttons / ←→ keys / dots, with counter, Esc/backdrop/✕ close, focus-trap + scroll-lock (mirrors `FeaturedReplaceModal`). Directional slide animation between photos. Image is zoomable — pinch, double-tap, mouse wheel — to 3× with drag-to-pan (clamped), native page-zoom suppressed (`touch-action: none`). Click-off (the dark area, not the image) closes. Double-tap reliably toggles zoom (net-movement tap detection + pan deadzone).
- Removed the duplicated availability disclaimer (in-page note dropped; the global footer note remains).

**Staff photo management (the big one).**
- The lightbox doubles as a staff editor (`editable` prop): a toolbar with rotate-left / rotate-right (circular icons) / delete + busy spinner. Click a thumbnail in the Photos card to open it.
- Backend: `rotatePhoto` (re-process the detail image 90° into a new content hash via sharp), `deletePhotoFiles`, queries `deleteGamePhoto` / `updateGamePhotoHash` / `countPhotoHashReferences` / `gameHasPhoto` / `reorderGamePhotos`. Endpoints `DELETE photos/[hash]`, `POST photos/[hash]/rotate`, `POST photos/reorder`. File cleanup only when no other row (or a placeholder) shares the hash. `processPhoto` now auto-orients via EXIF (`.rotate()`) so phone-camera photos come out upright (content hash unaffected — it hashes the source).
- PhotoUpload UX: upload dropzone moved **above** existing photos; two rectangular full-width buttons — **Take a photo** (mobile camera via `capture=environment`) + **Upload**; existing photos are tap-to-view and **click-and-hold to drag-reorder** (elastic follow-the-finger, snaps into slots, persists on drop; long-press suppresses the browser image menu). A static dashed **cover slot** sits behind the first tile (tiles carry no outline) to show which photo is the cover.

**Add/edit game form.**
- Players and play time are now **double-ended sliders** (`app/components/shared/RangeSlider.vue`, pointer + keyboard): players 1–12 ("12+" at the top), time 5–240 min in 5-min steps. Min/max end labels removed to save vertical space.
- Description moved directly under the name; sliders below it. Name input is larger + bold (it's the title).
- **Featured controls removed from the form** — featuring is done only from the games list now. Featured state is still sent unchanged so edits preserve it; the optional featured-**note** stays in the backend but is intentionally unsurfaced (owner's call; re-add later if requested).

**Catalogue + staff lists.**
- Staff games list: whole row (table + mobile card) is clickable to edit; new **Featured** segmented filter; client-side **quick search** (new shared `app/components/shared/SearchInput.vue`). Same search added to Tags and Users.
- Featured carousel (mobile concept) now supports **mouse drag-to-scroll** on desktop (touch unchanged).

**Tags.**
- Rename is now a pencil icon next to the name; "Merge into…" is a proper button; the tag name links to a new **`/staff/tags/[id]` management page** that lists the games carrying a tag and lets you add (search picker) / remove games. New queries `getTagById` / `listGamesForTag` / `addGameToTag` / `removeGameFromTag`; endpoints `GET tags/[id]`, `POST`/`DELETE tags/[id]/games`.

**BGG retired → Wikipedia for descriptions.**
- Confirmed BGG is unusable server-side: XML API returns **401** (gated), and the public page is **Cloudflare-blocked for node `fetch` (403)** even though curl gets 200 — so the cover/detail scrapes never work from the deploy host. Removed all BGG network code (service, cover/fetch/thing/details endpoints, weekly `bgg:refresh` task + its schedule, cache queries). **Kept** the local name search (`/api/bgg/search` over the committed `board-games.json`) and the detail-page "View on BoardGameGeek" link. The unused `bgg_games_cache` table is left in place (avoids a prod migration).
- New **Wikipedia** integration (`server/services/wikipedia.ts`, `GET /api/wikipedia/info`): searches "`<name>` board game", confirms it's a tabletop game via the `{{Infobox game}}` template (rejects video games / disambiguation / wrong matches — stronger than a text "is-a-game" check), then fills **description** (intro summary, ≤2000) **+ players + play time** parsed from the infobox (handles ranges, `{{ubl}}` lists, hours→minutes; best-effort, each field only applied if found). The form's "Fetch from Wikipedia" button applies whatever it returns, all editable.

**Fixes worth remembering.**
- `max-w-sm`/`max-w-md` in this Tailwind v4 theme resolve to `--spacing-sm`/`-md` (8px/16px!) — the cause of the collapsed search boxes. Use explicit `max-w-[Nrem]`.
- PhotoUpload SSR 500: an `{ immediate: true }` watch read `dragActive` before its declaration (temporal dead zone) — declaration order fixed.
- Game-search dropdown reopened after selecting a result (the name write retriggered the watcher) — suppressed; and selecting a result now **always** updates the name (was only when empty).

**Verification:** `npm run build` clean and `npm run test` green throughout (now 9 unit tests incl. Wikipedia match-guard tests). e2e selectors preserved (the "add game" smoke test only fills the name). Interactive bits (lightbox gestures, drag-reorder, camera, Wikipedia fetch) verified on the dev deploy by the owner.

**Next actions (in priority order):**
1. **Owner finishes testing the 2026-06-01 set on `dev`** → then `dev`→`main` merge (prod deploy). Not before owner confirms.
2. **Pre-launch cleanup** (carried over): remove the auth bypass in `server/api/auth/login.post.ts`; resolve the Coolify `ADMIN_PASSWORD` mismatch first or prod admin is locked out.
3. ~~**Shared-component token migration**~~ ✅ done 2026-06-03 (see session note above).
4. **400-game data entry sprint**, **low-end Android perf pass**, **QR codes on tables**, **owner visual sign-off** — the remaining M5 launch items.
5. **Confirm backups** — daily Postgres + `/app/photos` volume backup (requirements call for it; verify it's actually configured in Coolify/VPS).

**Maintenance / tech-debt backlog (investigate, not scheduled):**
- **Dependency upgrade pass** — investigate moving Nuxt, Vue, Drizzle, Tailwind, sharp, Vitest/Playwright, and the rest of `package.json` to their latest stable versions. Scope the breaking changes (esp. Nuxt/Tailwind majors), do it on a branch with build+test+e2e as the gate. Not started; flagged here so it isn't forgotten.
- ~~Drop the now-unused `bgg_games_cache` table + `schema/bgg.ts`~~ **Done 2026-06-02 (commit `3e37311`)** — migration 0005 drops the table; `schema/bgg.ts` deleted.

### Session — 2026-05-31

**BGG cover image + detail-page link (no API needed).** BGG's XML API now requires approved app access (gated), but the **public website is reachable**, so: `server/services/bgg.ts` `fetchBggCoverUrl(bggId)` scrapes the public game page for the cover (`__itemrep` box image, falls back to `og:image`); new `POST /api/staff/games/[id]/photos/bgg-cover` downloads it through the existing `processPhoto` sharp pipeline and stores it as a game photo. GameForm now **captures `bggId` when a game is picked from search** (previously only the dead "Fetch game info" did), and that XML-API button is replaced by a **"Fetch cover from BGG"** button in the Photos card (shown for saved games with a linked BGG id). `GameDetail` gained `bggId`; the public detail page shows a **"View on BoardGameGeek"** link (`/boardgame/{bggId}`). Verified the scrape+download path (page reachable, cover = 200 image/png) and the regexes; build+unit green. Caveat: cover fetch depends on the café VPS being able to reach BGG's site (reachable from the dev sandbox, so likely fine — confirm post-deploy). The old XML endpoints (`/api/bgg/thing`, `bgg-fetch`, `searchBgg`/`fetchBggThing`) are left in place (still covered by `bgg.test.ts`).

**Search data upgraded to BGG's full catalog.** The Wikidata list (~3.9k) was too sparse — staff searches for common games (Azul, Dominion, Spirit Island, Everdell) returned nothing. Replaced with BGG's official `boardgames_ranks.csv` dump (owner downloaded it; `/data/` gitignored). New `scripts/convert-bgg-ranks.ts` (`npm run bgg:ranks`) slims it to `server/data/board-games.json`: **42,747 games** (filtered to `usersRated >= 30` from ~177k — drops the obscure long tail; override `MIN_RATINGS`). Added `usersRated` to each entry; `server/utils/gameNames.ts` now **ranks results by popularity** (most-rated first, name-length tiebreak) so e.g. "wing"→Wingspan, "azul"→Azul. Still in-memory, no DB, ships in the build (~3.7 MB JSON). Verified relevance locally; build+unit green. Note: the live "Fetch game info" auto-fill still depends on BGG being reachable from the café VPS (unverified; blocked from the dev sandbox).

**Staff-UX fixes + search rework (pushed to `origin/dev`, awaiting owner verification on dev deploy).** Four issues reported while testing the merged `main` build:
- `4020977` fix(staff): **session no longer drops on hard refresh.** Root cause: client middleware (`app/middleware/{auth,admin}.ts`) used raw `$fetch('/api/auth/me')`, which doesn't forward the `ttc_session` cookie during SSR → 401 → redirect to login. Switched to `useRequestFetch()`. Also: **Edit** on the staff dashboard is now a button (added optional `to` prop to `SharedButton` → renders a NuxtLink styled as a button); **"View catalogue"** now stays in the staff shell — extracted the catalogue body to `app/components/catalogue/CatalogueBrowser.vue` (data via props), `index.vue` is thin, new auth-gated `app/pages/staff/catalogue.vue` renders it under the staff layout.
- `[B]` feat(search): **add-game search reworked to a static committed name list.** BGG live XML API now returns 401 (verified v1+v2), and the old local cache was never populated. New `server/data/board-games.json` — **3,895 games (3,229 with BGG ids), generated once from Wikidata (CC0)** via `scripts/refresh-game-names.ts` (`npm run gen:game-names`, manual/network only). Read in-memory by `server/utils/gameNames.ts`; `server/api/bgg/search.get.ts` does instant local substring search. **No DB table, no migration, no seeding on deploy** — owner constraint: nothing may re-seed/wipe the staff-entered games. Auto-fill ("Fetch game info" → BGG `thing`) is now an explicit per-game button gated on the entry having a BGG id; degrades gracefully if BGG 401s.
- Verified locally: `npm run build` clean (JSON bundles into the server output), `npm run test` 7/7, search util tested directly. **Could NOT run app/e2e locally** — no local Postgres/Docker. e2e regressions added (reload-persistence, catalogue-stays-in-staff, edit-is-link) run in CI + on dev deploy.
- **Known data quirk:** base "Catan"/"Carcassonne" lack a BGG id in Wikidata (id sits on other entities) → those specific picks fall to manual entry; most titles carry an id.
- **Follow-up flagged:** if BGG `thing` auth proves permanent, swap the auto-fill source (Wikidata entity / other).

**Implemented design concept: mobile featured carousel** (`design/concepts/mobile-featured-presentation.md`, Concept A). New `app/components/catalogue/FeaturedStrip.vue` — a compact, scroll-snap horizontal carousel (72%-width glass cards, photo + scrim + single-line title overlay + bare star, peek of the next card, pagination dots with IntersectionObserver-driven active state, reduced-motion aware, **auto-advance off** for v1). `CatalogueBrowser.vue` shows the strip below `sm:` and keeps the full glass grid at `sm:`+ (`sm:hidden` / `hidden sm:grid`). Frontend-only, no data/server change; build clean. Catalogue e2e unaffected (strip emits no `<article>`; desktop shows the grid). **Staff featured-toggle concept deferred — when built, do the FULL version incl. the `featuredAt`/`featuredBy` migration (owner's choice).**

**Implemented design concept: staff featured-toggle (full version)** (`design/concepts/staff-featured-toggle.md`). Migration `0004_true_absorbing_man.sql` adds nullable `featured_at` + `featured_by_id` to `games` (additive, safe for prod). New queries `setFeatured`/`replaceFeatured` (atomic swap in a txn) + `createGame`/`updateGame` now maintain the featured audit; staff payload joins `users` for `featuredBy` username. New endpoints `POST /api/staff/games/[id]/feature` (optional `{replace}` for the at-cap atomic swap, 422 otherwise) + `/unfeature`. Staff list (`app/pages/staff/index.vue`): the Status column became the **Featured toggle** (★ Featured → hover "✕ Remove"; ☆ Feature → opens the replace-picker at the 3-cap), the under-name `FeaturedBadge` is replaced by a "Featured {relative} · by {who}" meta line, header shows "Featured N of 3", per-row pending spinner + inline error. New `app/components/staff/FeaturedReplaceModal.vue` (radio list of current 3 with thumb/relative-time/"recent" chip, focus-trap + Esc + restore-focus, disabled-until-selected Replace). New `app/utils/relativeTime.ts`. Build clean, unit 7/7. Seeded featured games show no when/by line until re-featured (graceful). Catalogue + public FeaturedBadge unchanged.

**Fixed top-bar overlap (content drawing over the header).** Root cause: `z-header`/`z-toolbar` were used as Tailwind classes but **Tailwind v4 generates no `z-{name}` utility from `@theme --z-*` vars** — they emitted zero CSS (verified absent in compiled output), so the sticky headers had no `z-index`. Since sticky-without-z-index makes no stacking context, glass content (`backdrop-filter` → its own stacking context) painted over the header. Fix: defined `@utility z-toolbar/z-header` in `tokens.css` (→ real `z-index:var(--z-*)` rules). Also fixed the catalogue toolbar's `top-[--header-height]` (the last remaining `-[--…]` shorthand, `var()`-stripped by v4.3 → no offset) by moving it to a scoped `.toolbar-sticky` class. Header (z 20) now stays above toolbar (z 10) above content. Affects both layouts + the catalogue toolbar/dropdowns.

**Made staff pages mobile-compatible (standard patterns, owner-approved).** A staff member can now add/edit/remove games from a phone.
- **Staff header** (`staff.vue`): inline nav + user/sign-out now `hidden sm:flex`; below `sm:` a hamburger toggles a dropdown panel (stacked nav links + username·role + Sign out). Menu closes on route change (watch `route.fullPath`) and on link tap.
- **Games dashboard** (`staff/index.vue`): the table is now `hidden sm:block`; below `sm:` games render as **stacked cards** (thumb + name + featured/meta line, the featured toggle, and full-width Edit/Delete or Restore buttons). The featured toggle was extracted to `app/components/staff/FeaturedToggle.vue` and is shared by the table and the cards (dead `pill-live`/`pill-featured` styles removed).
- **GameForm**: player/time min-max pairs are `grid-cols-1 sm:grid-cols-2` (stack on phones). **Add/Edit wrappers**: `p-4 sm:p-6` (less cramped on small phones). **Tags**: rename form + normal row now `flex-wrap`.
- Already-fine pages untouched (login, users, PhotoUpload, TagTypeahead, BggSearch).
- CI note: the responsive dual-render (desktop table + mobile cards) makes each game name appear twice in the DOM, which tripped `staff.spec` `getByText(gameName)` (strict-mode, 2 matches). Fixed by `.first()` (the desktop table node is visible at the CI viewport). Same `.first()` pattern as the catalogue carousel. Lesson: any responsive "render both, hide one" pattern needs `.first()`/visibility-scoped selectors in e2e.

**CI was red on `dev` — fixed.** The `ad075fe` and `8737c30` pushes failed the **E2E** job (unit job stayed green; local `npm run build`/`npm run test` can't catch e2e since there's no local DB). Two causes, both now fixed:
1. **Real bug:** `SharedButton`'s `to` prop used `resolveComponent('NuxtLink')` inside a template expression, which didn't resolve — Edit rendered as a bogus `<nuxtlink>` element instead of an `<a>`, so `getByRole('link', {name:'Edit'})` failed (and the link wouldn't have worked for users). Fixed by `import { NuxtLink } from '#components'` and using it in `<component :is>`.
2. **Test brittleness:** the mobile carousel renders the featured title in a hidden (`sm:hidden`) `<h3>` that is first in DOM, so `catalogue.spec.ts` `getByText('Catan').first()` resolved to the hidden node on desktop. Retargeted to the visible grid card `<h2>`.
Lesson: verify e2e via CI (or a local DB) before declaring frontend changes done — `build` + `unit` alone missed these. CI status is queryable via the GitHub API using cached git credentials when `gh` isn't installed.

**Design workflow tooling added.** New `design-worker` subagent (`.claude/agents/design-worker.md`, versioned in the repo) — a design-only, read-the-design-system persona that produces UI concepts/specs and saves them under `design/concepts/`, committing + pushing to `dev` so design (laptop) and implementation (home PC) can happen in separate sessions. It's forbidden from touching app source. `.gitignore` now tracks `.claude/agents/` but ignores machine-local `.claude` state. Invoke it explicitly ("use the design-worker …"); concepts come back here for the coding agent to implement.

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
3. ~~**Shared-component token migration**~~ ✅ done 2026-06-03 (see the 2026-06-03 session note above).
4. ~~**Auth bypass removal**~~ ✅ done 2026-06-02 (commit `f73b730`).

**Design-team asks queued (blocking the items below):**
- ~~`Button.vue`/`Input.vue` paddings + `login.vue` literals token mapping~~ — **Resolved 2026-06-03.** No new spacing tokens needed: per the `CONVENTIONS.md` selective-explicit rule, sub-grid micro-layout (paddings, `7px` gap, `max-w` 360px) stays numeric; only the reskin-relevant values (font-sizes, motion, focus-ring colors) were tokenized. See the 2026-06-03 session note.
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
- [x] **2026-06-01 UX + features pass** (see the 2026-06-01 session entry for detail):
  - Detail page → full-screen `detail` layout (back link in title bar) + `PhotoLightbox` (swipe/zoom/keyboard); duplicate availability note removed
  - Staff photo management: lightbox rotate/delete (+ endpoints + sharp re-process + EXIF auto-orient), drag-to-reorder (+ `photos/reorder`), mobile camera capture, upload-above-existing, static cover-slot indicator
  - Form: double-ended player/time sliders (`RangeSlider`), description above sliders, larger/bold name, featured controls removed (note kept backend-only)
  - Lists: clickable staff game rows, Featured filter, shared `SearchInput` on games/tags/users; desktop drag-scroll on the featured carousel
  - Tags: pencil-rename + Merge button + `/staff/tags/[id]` games manager
  - BGG live integration removed (Cloudflare/401); Wikipedia description fetch added; local name search + "View on BoardGameGeek" link kept
- [ ] **Pre-launch cleanup (do before data entry):**
  - ~~Remove auth bypass in `server/api/auth/login.post.ts`~~ **Done 2026-06-02 (commit `f73b730`)** — hardcoded bypass removed; `password: z.string().min(1)` validation restored. Login now requires a real credential on every request; bootstrapping is via `ADMIN_USERNAME`/`ADMIN_PASSWORD` env vars in Coolify.
  - ~~Replace hardcoded `px`/`font-size` literals in `SharedInput`, `SharedButton`, and `login.vue` with `var(--*)` token references~~ **Done 2026-06-03** — font-sizes/motion/focus-ring colors tokenized (incl. new `--color-focus-ring`/`--color-error-ring`); micro-layout literals intentionally kept numeric per the selective-explicit convention. Was never actually blocked (HANDOFF §7).
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

> **Note (2026-06-02):** Several M3 deliverables were subsequently removed or renamed as dead code. Items are annotated below.

- [x] `bgg_games_cache` table (migration 0003) + `bgg_id` column on `games` — *table dropped in migration 0005 (2026-06-02)*
- [x] `server/services/bgg.ts` — BGG XML API v2 client with fast-xml-parser + Zod — *removed 2026-06-01*
- [x] `GET /api/bgg/search` — live search with local-cache fallback — *replaced by static `GET /api/game-names/search` (renamed 2026-06-02)*
- [x] `GET /api/bgg/thing/[id]` — full game detail for pre-fill — *removed 2026-06-01*
- [x] `POST /api/staff/games/[id]/photos/bgg-fetch` — server-side image fetch through sharp pipeline — *removed 2026-06-01*
- [x] Weekly Nitro scheduled task — refreshes cache for catalogued games — *removed 2026-06-01*
- [x] `BggSearch.vue` — debounced type-ahead (350ms, min 2 chars) — *renamed to `GameSearch.vue` 2026-06-02*
- [x] `GameForm.vue` — BGG panel at top; "Fetch game info" pre-fills all fields + surfaces BGG image — *reworked: Wikipedia enrichment replaces BGG XML*
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
