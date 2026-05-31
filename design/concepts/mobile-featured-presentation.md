# Mobile featured-games presentation

**Status:** concept
**Milestone fit:** QOL addition on top of **M5** (catalogue polish). Pure
catalogue-presentation work — no new data, no server change. Slots cleanly into
the existing Glass Slate treatment.

---

## 1. Goal

On mobile, featured games currently render as the same large full-width glass
banner cards as everything else (`aspect-[16/10]`, ~210px tall each). With up to
3 featured games the customer scrolls past roughly two full phone screens of
featured content before reaching the normal catalogue. Make the featured section
**visually distinct and far more compact on mobile** so it reads as a curated
"staff picks" strip — a quick glance, not a wall — while keeping the full glass
card experience on tablet/desktop where there's room.

Featured is hard-capped at 3, so every concept below is tuned for exactly 1–3
items (never a long scroller).

---

## 2. Scope & shared decisions (apply to both concepts)

- **Mobile only.** Both concepts replace the featured *grid* with a compact
  treatment **below `sm:` (< 640px)** only. At `sm:` and up the existing
  responsive featured grid (`sm:grid-cols-2 lg:grid-cols-3`, `4/3` → `3/4`
  cards) is unchanged — desktop already has room and the big cards look good
  there. So this is a `block sm:hidden` compact strip paired with a
  `hidden sm:block` existing grid.
- **Section header is unchanged.** Keep the existing `<h2>` "Featured" label
  (`text-section-label`, uppercase, `tracking-wider`, brand star glyph,
  `--color-text-secondary`) above the strip. Gap from header to strip: `mb-3`
  (12px), matching the current grid. Gap from the featured section to the
  "All games" section below: `mb-xl` (32px) — unchanged.
- **The strip sits inside the existing `<section v-if="featured.length > 0">`**
  in `CatalogueBrowser.vue`; it only renders in **grid** view (list view already
  renders featured as compact rows in the flat list container — leave that as
  is). So the compact strip is the grid-view-on-mobile branch.
- **Tokens only.** No new tokens required for Concept A. Concept B introduces
  **one** optional token (noted there). Everything else reuses `--glass-*`,
  `--radius-*`, `--scrim`, `--shadow-*`, the type scale, and brand colors.
- **No-photo fallback** reuses the card's existing treatment: brand gradient
  (`linear-gradient(150deg, var(--color-brand), var(--color-brand-hover))`) +
  large low-opacity initial. The scrim still applies so the overlaid title reads.
- **Tap target:** each featured item is a `NuxtLink` to `/games/[id]`, min 44px
  in both axes (all concepts clear this comfortably).

---

## Concept A — Compact horizontal carousel (user's idea) ★ recommended

Three smaller cards in a horizontally-scrolling, snap-aligned rail. Each card is
basically **photo + title**, with the next card *peeking* at the right edge to
signal "swipe for more". Optional gentle auto-advance.

### Wireframe — mobile (< 640px)

```
┌─────────────────────────────────────────────┐
│ ★ FEATURED                                   │   ← existing h2, mb-3
│                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌────     │
│  │ photo  ★     │ │ photo  ★     │ │ pho     │  ← cards, ~72% width
│  │              │ │              │ │         │     16/10 aspect
│  │              │ │              │ │         │     next card peeks ~14%
│  │░scrim░░░░░░░░│ │░scrim░░░░░░░░│ │░scr     │
│  │ Wingspan     │ │ Azul         │ │ Cat     │  ← title only (overlay)
│  └──────────────┘ └──────────────┘ └────     │
│                  ● ● ○                        │  ← pagination dots, mt-2.5
└─────────────────────────────────────────────┘
        ↑ scroll-snap, swipe L/R, peek of next
```

### Spec

**Rail container**
- Horizontal scroller: `display: flex; overflow-x: auto; scroll-snap-type: x mandatory`.
- `gap: var(--spacing-sm)` (8px) between cards.
- Horizontal padding `px-md` (16px) so the first card aligns with the page
  gutter and the last card has breathing room; pair with
  `scroll-padding-inline: var(--spacing-md)` so snap respects the gutter.
- Hide the scrollbar (`scrollbar-width: none` + `::-webkit-scrollbar { display:none }`)
  — the dots are the affordance. Keep momentum scroll (`-webkit-overflow-scrolling: touch`).
- `overscroll-behavior-x: contain` so a swipe past the end doesn't trigger
  browser back/refresh.

**Card**
- Width: `flex: 0 0 72%` of the viewport. With `px-md` gutter + 8px gap this
  leaves ~14% of the next card peeking on a 360–400px phone — enough to read as
  "there's more", not so much it looks broken. (At the 1-item case the single
  card simply sits left-aligned at 72% with empty space — see "states".)
- Aspect ratio: **`16/10`** (matches the current mobile banner aspect, just
  smaller). A 72%-wide card on a 390px screen ≈ 281px wide × ~176px tall — about
  **45% shorter** than today's full-width banner.
- `scroll-snap-align: start`.
- Surface: identical glass card anatomy to `GameCard.vue` —
  `position: relative; overflow: hidden; border-radius: var(--radius-xl)`,
  `border: 1px solid rgb(255 255 255 / 0.40)`, `box-shadow` = the featured lift
  already defined (`0 14px 34px -10px rgb(21 128 61 / 0.5)`). Photo fills via the
  existing `<picture>`/`srcset` pipeline; mandatory `--scrim` layer on top.

**Compact title overlay (the key simplification)**
- Drop the full info panel (no players/time/tags in the compact card). Instead a
  single **title line** docked bottom-left over the scrim:
  `position:absolute; left: var(--spacing-sm); right: var(--spacing-sm); bottom: var(--spacing-sm)`.
- Title: `text-card-title` (16px), `font-semibold`, white, `line-clamp-1`
  (single line — these are short rail cards), with the existing
  `title-shadow` (`text-shadow: 0 1px 3px rgb(0 0 0 / 0.5)`) for legibility.
- No glass info-panel background here — the scrim alone carries the text (one
  line is cheap to make legible and it keeps the card clean). This also avoids an
  extra `backdrop-filter` per card, which is the perf-sensitive path.

**"Featured" treatment when compact**
- The whole strip lives under the "★ FEATURED" header, so per-card badges are
  redundant noise at this size. Replace the full glass `FeaturedBadge` with a
  **bare star glyph** top-left: a 16px filled star, `color:#fff`,
  `filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.55))`, at
  `top: var(--spacing-sm); left: var(--spacing-sm)`. It reads as "pick" without
  the pill chrome. (Don't rely on the star alone for the semantic — the section
  header is the label; the star is reinforcement, satisfying "don't rely on
  color/icon alone".)
- Optional: a 2px brand top-accent is *not* needed — the brand-tinted shadow
  already differentiates featured cards from the neutral "All games" grid below.

**Pagination dots**
- Centered row under the rail, `margin-top: var(--spacing-sm)` (8px). One dot per
  featured game (max 3).
- Active dot: `8px` circle, `background: var(--color-brand)`. Inactive:
  `6px` circle, `background: var(--color-border-strong)`. `gap: 6px`.
- Dots derive the active index from scroll position (`IntersectionObserver` on
  the cards, or nearest-snap math). Tapping a dot scrolls that card into view
  (`scrollIntoView({ behavior: 'smooth', inline: 'start' })`).
- **A11y:** dots are decorative *plus* operable — render as `<button>`s with
  `aria-label="Show featured game N"`. If 1 featured game, hide the dots entirely.

**Auto-advance (optional, off by a hair)**
- Default: advance to the next card every **5s**, smooth-scroll, loop back to
  the first after the last. Gentle and slow — this is ambient, not a slideshow.
- **Pause on interaction:** pause permanently (for the session) on the first
  user touch/scroll/focus within the rail; resume only on… nothing — once the
  user takes control, stop competing with them. (Simpler and less surprising than
  pause-and-resume timers.) Also pause when the tab is hidden
  (`document.visibilitychange`) and when the strip scrolls out of view
  (`IntersectionObserver`) to save battery.
- **`prefers-reduced-motion: reduce` → auto-advance is fully disabled** and the
  smooth-scroll on dot taps falls back to instant (`behavior:'auto'`). This is a
  hard requirement; gate the entire timer behind a reduced-motion check.
- Recommendation: ship auto-advance **off by default** for v1 and revisit. The
  peek + dots already communicate "swipe"; auto-motion on a catalogue the
  customer is actively reading is easy to find annoying and adds the reduced-
  motion/visibility/focus matrix above. If the café wants the "alive" feel, turn
  it on — the spec supports it.

**Interaction states**
- *Default:* cards at rest, first card flush to the gutter, dot 1 active.
- *Hover (desktop pointer, only relevant ≥ sm where this strip is hidden — n/a):*
  no hover state needed on the mobile strip.
- *Press/active:* card scales to `0.98` (`motion-safe` only) for tactile feedback;
  skip under reduced motion.
- *Focus-visible:* `outline`/ring via the existing `card-link` pattern
  (`focus-visible:ring-2`, `--tw-ring-color: var(--color-brand)`, offset 2px).
  When a card receives keyboard focus it must scroll into view (browsers do this
  for free with snap + focus).
- *Loading (SSR/hydration):* the photo pipeline already handles lazy load +
  failed-image fallback (`imageFailed`). No skeleton needed — featured is
  server-rendered with the rest of the catalogue.
- *Empty:* `featured.length === 0` → the whole `<section>` doesn't render
  (existing `v-if`). 1 item → single card, no dots, no peek (card still 72% so it
  reads as "part of a set", with the brand shadow marking it featured).

### Why recommended
- Matches the user's stated mental model exactly.
- Biggest vertical space win: 3 featured games collapse from ~2 screens to one
  ~190px-tall strip + dots — the customer reaches "All games" almost immediately.
- Reuses the existing card anatomy (photo + scrim + overlaid title) so it stays
  unmistakably part of the Glass Slate language; only the *density* changes.
- Degrades gracefully to 1–2 items and to reduced-motion.

---

## Concept B — Rotating spotlight hero (single banner that cycles)

One compact hero banner that shows a single featured game at a time and gently
cross-fades/advances through the (max 3) picks, with dots + tap-to-jump. Instead
of "make the cards small and line them up", this is "show one pick at a time,
beautifully". Different interaction model: it's a *display* the customer watches,
not a rail they *scrub*.

### Wireframe — mobile (< 640px)

```
┌─────────────────────────────────────────────┐
│ ★ FEATURED                          1 / 3    │  ← header + counter (right)
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ photo (full-bleed)                  ★   │ │  ← single banner, 21/9-ish
│  │                                        │ │     short & wide
│  │░░░scrim░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ │
│  │ Wingspan                               │ │  ← title
│  │ 1–5 players · 40–70m                    │ │  ← one meta line (room for it)
│  └────────────────────────────────────────┘ │
│                  ● ○ ○                        │  ← dots, mt-2.5
└─────────────────────────────────────────────┘
        ↑ auto cross-fade every 5s; tap dots to jump;
          swipe L/R also advances
```

### Spec (deltas from Concept A)

**Single banner**
- Full catalogue width (`px-md` gutter), **`aspect-[21/9]`** — short and
  cinematic so even one banner doesn't eat the screen (~150px tall on a 390px
  phone). Same glass card anatomy, `--radius-xl`, featured brand shadow.
- Because only one is shown at a time, there's room for slightly more info than
  Concept A: title (`text-card-title font-semibold`) **plus** one meta line
  (`text-meta`, white/80, players · time) — no tags. The existing 19px meta
  icons are optional here; a plain text meta line keeps it calm.

**Rotation**
- Cross-fade between picks every **5s** (`opacity` transition,
  `--duration-base`-ish but longer ~400ms for a soft dissolve). Stack the 3
  `<picture>`s absolutely; toggle the active one's opacity. Preload all 3 (only 3,
  cheap).
- Swipe left/right also advances (touch handlers) and **resets** the timer.
- Same pause rules as A: pause on interaction, on hidden tab, off-screen.
- **`prefers-reduced-motion: reduce` → no auto-rotate and no cross-fade**; show
  pick #1 statically, and dots become a manual stepper (instant swap). Hard
  requirement.

**Counter + dots**
- Optional "1 / 3" counter right-aligned in the header row (`text-meta`,
  `--color-text-muted`) as a secondary affordance.
- Same dots component as Concept A under the banner.

**"Featured" treatment**
- Same bare star glyph top-left. The single-banner format already screams
  "spotlight", so the star is enough.

**Tokens**
- Reuses everything. *Optional* new token if you want a distinct featured banner
  height token for tuning: `--featured-hero-aspect` — but `aspect-[21/9]` as a
  utility is fine; **no new token strictly required.**

**States**
- *1 item:* it's just a static hero (no rotation, no dots) — arguably the cleanest
  single-featured presentation of any concept.
- *2–3 items:* rotates.
- Loading/empty/focus: same as A. Focus-visible ring on the banner link; when
  focused, stop auto-rotation.

### Trade-offs vs A
- **Pro:** most "premium showcase" feel; one game gets full attention; tallest
  single image so photos look great; even better vertical compactness for the
  multi-item case (one banner vs a rail).
- **Pro:** room for a meta line, so it's more informative per glance.
- **Con:** the customer can't see all 3 picks at once — discovery of picks #2/#3
  depends on waiting for rotation or noticing the dots. A rail (A) shows the set
  at a glance.
- **Con:** auto-rotation is more load-bearing here (it's the primary way to see
  other picks), which makes the reduced-motion fallback (manual stepper) more
  important and slightly less elegant.
- **Con:** cross-fade with 3 stacked images is marginally more work than a CSS
  snap rail.

---

## 3. Concept C (brief alt) — accent-bordered mini-grid (no carousel at all)

For completeness, a non-motion option: render the (max 3) featured games as a
**static 3-up mini-grid** of small square-ish tiles on mobile — no scrolling, no
rotation. Tiles are `aspect-[1/1]`, `grid-cols-3 gap-2`, photo + bottom-overlaid
title (`text-tag`/`text-meta`, `line-clamp-1`), wrapped in a single panel with a
subtle brand-tinted left border or `box-shadow` to mark the whole block as
"picks". All 3 visible at once, zero motion, smallest possible footprint
(~110px tall). Trade-off: tiles are small, titles get cramped, and 1–2 items
look sparse in a 3-col grid. Listed as the "I don't want any carousel" fallback;
**not** the recommendation.

---

## 4. Affected surfaces

- `app/components/catalogue/CatalogueBrowser.vue` — the `<section v-if="featured.length > 0">`
  block (lines ~159–189): add the `block sm:hidden` compact strip for grid view;
  wrap the current featured grid in `hidden sm:block`. List-view featured branch
  unchanged.
- **New component:** `app/components/catalogue/FeaturedStrip.vue` (Concept A) or
  `FeaturedSpotlight.vue` (Concept B) — encapsulates the rail/banner, dots,
  scroll/rotation logic, and the reduced-motion + visibility gating. Takes
  `:games="featured"`. Keeps `CatalogueBrowser.vue` declarative.
- `app/components/catalogue/GameCard.vue` — **not modified**; the compact card is
  a lighter variant living in the new component (shares the photo/scrim/title
  pattern but omits the info panel). If you'd rather not duplicate, add a
  `compact` prop to `GameCard.vue` that hides the meta/tag rows and swaps the
  badge for the bare star — designer's call; a dedicated component is cleaner.
- `app/components/shared/FeaturedBadge.vue` — unchanged; the compact strip uses a
  bare star, not this pill (the pill stays for the desktop grid + detail + staff).

---

## 5. Recommendation

Ship **Concept A (compact horizontal carousel)** with **auto-advance off for
v1**. It matches the user's intent, gives the biggest first-screen reclaim, shows
all 3 picks at a glance, reuses the card anatomy, and has the simplest reduced-
motion story (just disable the optional timer). Keep Concept B (spotlight) in the
back pocket if the café later wants a more theatrical "now featuring" vibe — it's
a drop-in swap of the same new component slot.

---

## 6. Open questions / options

1. **Auto-advance on or off at launch?** Recommend off (above). Easy to flip.
2. **Compact card content:** title-only (recommended for A) vs title + one meta
   line. Title-only is cleaner and shorter; meta adds info but more text over
   photos. Lean title-only for the rail; the detail page has the full meta.
3. **Duplicate vs `compact` prop on `GameCard`** — see Affected surfaces. Slight
   preference for a dedicated `FeaturedStrip.vue` to keep `GameCard` focused.
