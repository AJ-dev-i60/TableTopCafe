# Doc-worker note — Issues #1–#4 fixed — 2026-06-04

Commit `a988c08` on `dev` closes all four issues filed in the 2026-06-04 Playwright
performance audit. The following documentation updates are needed.

---

## 1. `docs/progress.md` — Add session entry and update M5 checklist

Add a session block under "Current milestone: M5" (after the 2026-06-04 remote audit
entry you were already asked to add) with the following content:

```
### Session — 2026-06-04 (issues #1–#4 fixed, commit a988c08)

Resolved all four issues from the Playwright audit filed earlier today.

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
```

Also update the M5 checklist:
- Add a note to the on-device perf item that issues #1–#4 are resolved; device-pass still pending.
- Mark the backdrop-filter issue as resolved (pre-authorized fix from HANDOFF.md §5 applied).

---

## 2. `CONVENTIONS.md` — Add backdrop-filter performance note

This is the same request as the earlier doc-worker note from the Playwright audit.
If it hasn't been added yet, add to the CSS/design-system conventions section:

> **`backdrop-filter` — use sparingly.** Each element with an active `backdrop-filter`
> forces a GPU compositing layer. Limit it to structural chrome (header, sticky toolbar,
> modal overlays) — never apply it per-item in a list or per-chip in a filter row.
> Confirmed to cause visible lag on mid-range Android when 60+ elements blur simultaneously.
> The `.chip-idle` rule in `CatalogueFilters.vue` was the main offender (32 chips = 89 total
> layers with drawer open); it was fixed in commit `a988c08`.

---

## 3. Close GitHub issues

The following issues can be closed with a reference to commit `a988c08`:
- #1 (timeLabel fractional hours)
- #2 (excessive backdrop-filter)
- #3 (FCP render-blocking CSS) — partially addressed; full verification pending
- #4 (PhotoLightbox CSS eagerly loaded on homepage)
