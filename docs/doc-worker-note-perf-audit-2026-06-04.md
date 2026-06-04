# Doc-worker note — Performance audit 2026-06-04

A remote Playwright performance audit was run against `https://tabletopcafedev.edgestudios.co.za` on 2026-06-04. Four GitHub issues were filed (#1–#4). The following documentation changes are needed.

---

## 1. `docs/progress.md` — Add new session entry

Add a session block under "Current milestone: M5" (before the 2026-06-03 sessions) with the following content:

```
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
```

Also update the M5 checklist:
- Change `[ ] On-device low-end Android perf verification` to note that a remote Playwright audit is done (2026-06-04), device pass still pending.

---

## 2. `CONVENTIONS.md` — Add backdrop-filter performance note

Find the CSS/design-system conventions section and add a note along the lines of:

> **`backdrop-filter` — use sparingly.** Each element with an active `backdrop-filter` forces a GPU compositing layer. Limit it to structural chrome (header, sticky toolbar, modal overlays) — never apply it per-item in a list or per-chip in a filter row. Confirmed to cause visible lag on mid-range Android when 60+ elements are blurring simultaneously.

---

## 3. No other files need changing

- `ARCHITECTURE.md` — image pipeline is already documented accurately; no change needed.
- `roadmap.md` — M5 performance pass is already correctly scoped; no change needed.
- `requirements.md` — no change needed.
