# Progress — TableTopCafe

Granular session-level state: what's done, what's next, and anything needed to resume on a fresh machine. For the milestone plan and scope definitions see `docs/roadmap.md` — this file tracks *where we are*, not *where we're going*.

> **Archive:** All history before 2026-06-03 is in `docs/progress-archive-2026-06-04.md`. That file covers M0–M2 checklists, M2.5 tokenisation pass, M3 BGG integration (later retired), M4 remaining features, the full M5 UX pass (2026-05-30 through 2026-06-01), all deployment infrastructure notes, and Coolify app/DB UUIDs.

---

## Current milestone: M5 — Polish 🚧

**Status: Large staff/catalogue UX pass landed and merged to `main` (prod). As of 2026-06-04 `dev` and `main` are byte-identical (both at `183856e`). Auth-bypass removal ✅ 2026-06-02, shared-component token migration ✅ 2026-06-03, Playwright perf audit + four fixes ✅ 2026-06-04. Remaining for launch: 400-game data entry, on-device low-end Android perf verification (four audit findings resolved — device pass still pending), backups confirmation, owner visual sign-off.**

---

### Session — 2026-06-04 (issues #1–#4 fixed, commit `a988c08`)

Resolved all four issues from the Playwright audit filed earlier the same day.

**#1 — Bug fix:** `timeLabel` now formats non-60-multiple durations as mixed units
(`1h 10m`) instead of raw division (`1.1666666666666667h`). Fixed in `GameCard.vue`
and `GameListItem.vue` (the detail page `[id].vue` already had the correct format).

**#2 — Perf:** Removed `backdrop-filter` from `.chip-idle` in `CatalogueFilters.vue`.
The 32 blurring chips with the filter drawer open forced 89 simultaneous GPU compositing
layers on mobile. Replaced with a plain semi-transparent background (opacity bumped
0.45→0.55 to compensate for no blur). The pre-authorized fix from `design/HANDOFF.md §5`.

**#3 — Perf (partial):** Added `experimental.inlineStyles: true` to `nuxt.config.ts` so
component CSS is embedded in the SSR HTML rather than fetched as render-blocking external
files. Also promoted the first 3 featured cards (or first 3 non-featured when featured is
empty) to `loading="eager"` + `fetchpriority="high"` so above-the-fold images start
downloading immediately. Full on-device mobile verification still pending.

**#4 — Perf:** Switched `CataloguePhotoLightbox` to `LazyCataloguePhotoLightbox` in
`[id].vue` and `PhotoUpload.vue`. Nuxt's `Lazy` prefix wraps the component in
`defineAsyncComponent`, deferring its JS and CSS chunk until the lightbox actually mounts —
it should no longer appear in the homepage network waterfall.

---

### Session — 2026-06-04 (remote performance audit via Playwright)

Remote audit run against the dev deploy using Playwright + browser Performance API (no throttling — numbers are best-case; real mobile will be worse).

**Key metrics:**
- TTFB: 92ms ✅
- FCP: **2844ms** ❌ (target ≤1800ms) — caused by 3 render-blocking CSS files and no resource preload hints
- DOM Interactive: 240ms ✅
- CLS: 0.000 ✅
- Long tasks: 0 ✅
- Elements with active `backdrop-filter` at page load: **61**
- Elements with active `backdrop-filter` with filter drawer open: **89**

**Findings — issues filed:**
- [#1](https://github.com/AJ-dev-i60/TableTopCafe/issues/1) — Bug: `timeLabel` emits fractional hours (e.g. "1.1666666666666667h") for non-multiples of 60 — `GameCard.vue` line 28
- [#2](https://github.com/AJ-dev-i60/TableTopCafe/issues/2) — Performance: excessive `backdrop-filter` on filter chips causes GPU compositing lag on mobile; `content-visibility` does NOT eliminate this — `.chip-idle` in `CatalogueFilters.vue` is the main offender (32 blurring chips when drawer open)
- [#3](https://github.com/AJ-dev-i60/TableTopCafe/issues/3) — Performance: FCP 2844ms; 3 render-blocking CSS files, no `<link rel="preload">` hints
- [#4](https://github.com/AJ-dev-i60/TableTopCafe/issues/4) — Performance: `PhotoLightbox`, `_id_`, `detail` route CSS files eagerly loaded on homepage

**Conclusion:** `content-visibility: auto` (added 2026-06-03) helps scroll performance but does NOT resolve the backdrop-filter compositing cost — the 89-element backdrop-filter count confirms the pre-authorized fix in `design/HANDOFF.md §5` is still needed.

---

### Session — 2026-06-03 (performance pass — code done, on-device verification pending)

Structural catalogue-perf changes that are known-good for low-end Android regardless of measurement. A true device pass (scroll FPS, TTI/LCP) was NOT run — no local Postgres on this machine, so these must be verified on the **dev deploy** against a real low-end Android or throttled emulation.

**Done (committed on `dev`):**
1. **Catalogue payload trimmed.** `listVisibleGames()` / the `GameListItem` type no longer select `description` or `featuredNote` — the catalogue list path never rendered them. For ~400 games this removes a large chunk of the SSR HTML + hydration payload.
2. **`content-visibility: auto` on cards + list rows.** Off-screen `GameCard`s and `GameListItem`s skip layout/paint/compositing. Cards' explicit `aspect-ratio` still resolves box height while contents are skipped, so the grid does not reflow on scroll. Progressive enhancement.
3. **`theme-color` fixed** `#2563eb` (stray blue) → brand green `#15803d` in `nuxt.config.ts`.

**Measurement methodology:** Chrome DevTools — Performance panel with 4×/6× CPU throttle + "Slow 4G", record a catalogue scroll; Lighthouse mobile for TTI/LCP/TBT. Ideally also a real low-end Android via remote debugging. Target: smooth scroll + reasonable TTI on the full ~400-game catalogue.

**Remaining device-gated levers (verify before applying):**
- Per-card `backdrop-filter` → semi-opaque fill — pre-authorized by `design/HANDOFF.md` §5, but `content-visibility` may have resolved the jank already.
- Eager LCP image — first visible item `loading="eager" fetchpriority="high"` (modest win, deferred).
- Virtualization — only if `content-visibility` isn't enough at 400 cards.

**Viewport zoom is intentionally disabled (owner-confirmed 2026-06-03):** `nuxt.config.ts` sets `maximum-scale=1, user-scalable=no` on purpose — fixes devices that loaded the page zoomed in by default, cutting off one side of the UI. Do NOT re-enable.

---

### Session — 2026-06-03 (shared-component token migration)

Paid down the token debt in shared-component scoped CSS (value-preserving — rendering unchanged):
- `Button.vue`: `font-size: 14px` → `var(--font-size-ui)`; transition `150ms` ×3 → `var(--duration-base)`.
- `Input.vue`: `font-size: 14px` → `var(--font-size-ui)`; focus/invalid ring `rgb(...)` literals → `var(--color-focus-ring)` / `var(--color-error-ring)`.
- `SearchInput.vue`: focus ring → `var(--color-focus-ring)`.
- `login.vue`: `20px` → `var(--font-size-xl)`; `13px` ×3 → `var(--font-size-meta)`.
- `tokens.css`: added `--color-focus-ring` and `--color-error-ring`.
- Per `CONVENTIONS.md` selective-explicit rule, micro-layout literals (button/input paddings, 7px gap, 16px icon, login margins, `max-w` 360px workaround) stay numeric.
- **Not tokenized (distinct deliberate values):** `FeaturedBadge.vue` glass fill `rgb(21 128 61 / 0.6)`, `RangeSlider.vue` thumb focus ring `rgb(21 128 61 / 0.25)`.

---

## M5 remaining checklist

- [x] ~~Auth bypass removed~~ — done 2026-06-02 (`f73b730`)
- [x] ~~Shared-component token migration~~ — done 2026-06-03
- [ ] **On-device low-end Android perf verification** — remote Playwright audit done 2026-06-04 (issues #1–#4 resolved in `a988c08`); device pass (scroll FPS, TTI/LCP on real low-end Android) still pending
- [ ] **400-game data entry sprint** — operational; will surface real bugs
- [ ] **Confirm backups** — daily Postgres + `/app/photos` volume backup required by spec; verify it's configured in Coolify/VPS
- [ ] **Owner visual sign-off** → go live
- [n/a] QR codes — owner-generated externally (3rd-party generator → catalogue URL), not a dev task

**Open owner decisions (from doc audit 2026-06-04):**
- Wikipedia integration: formally in-scope permanent feature, or temporary workaround? (requirements.md is silent on it)
- Featured note: deferred for later, or removed from scope? (stored in DB/API but not surfaced in UI)
- Tag "archive" vs "delete" terminology: is the rename acceptable?
- Audit fields (`created_by/at` etc.): storage-only sufficient for v1, or surface any in the edit form?
- `bgg_id` column: add to the requirements data model formally?
- Backups: confirmed configured, or still pending?
