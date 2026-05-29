# TableTopCafe — Design Handoff & Implementation Spec

**Audience:** the codebase worker implementing the M5 visual design.
**Status:** design-complete for all current surfaces. This document + the mockups in `design/`
are the source of truth. Implement to match them; where this spec and a mockup disagree, this
spec wins (the mockups are HTML approximations, not the Vue components).

> Milestone: this is **M5 (Polish)**. Where it touches screens that don't exist yet (e.g. tag
> management UI, user admin, soft-delete restore view), treat the visual rules here as the style
> those **M4** features inherit — don't build the missing features as part of the visual pass.

---

## 0. The mental model — two layers

1. **Design system (tokens).** Palette, type, radius, shadow. Lives in
   `app/assets/css/tokens.css`. Applies to **every** screen, public and staff. This is what makes
   the product feel like one thing.
2. **Treatments.** How a surface uses the system:
   - **Public catalogue + detail** → **Glass Slate**: full-bleed photos, title overlaid on the
     image, frosted-glass chrome, large meta icons, soft mesh background.
   - **Staff / admin** → **flat clean admin**: white cards, borders, high contrast, no glass, no
     full-bleed photos. Same palette, different job (fast data entry at a counter).

Chosen palette: **Felt & Slate** (slate ink + tabletop green). No dark mode in scope.

Mockups (open in a browser; they were screenshotted under `design/*.png`):
| File | Covers |
|---|---|
| `mockups.html` | The 3 palette directions explored (A Café Warm / B Felt & Slate / C Game Night). Reference only — **B was chosen.** |
| `glass.html` | Public catalogue grid — glass cards, responsive 1→2→3-up |
| `detail.html` | Public game detail page — glass hero + content panels |
| `staff.html` | Staff login, game dashboard, add/edit form |
| `DIRECTIONS.md` | Narrative of the 4 explored directions + per-direction caveats |

---

## 1. Tokens — `app/assets/css/tokens.css`

Replace the **colors**, **typography semantic layer**, and **radius** values with the block below,
and **add** the new glass + admin tokens. Keep the existing spacing scale, breakpoints, layout
chrome heights, motion, and z-index layers as-is. Tailwind v4 consumes these directly
(`bg-[--color-surface]`, `text-card-title`, `rounded-[--radius-xl]`, etc.).

```css
@theme {
  /* ─── Colors ─────────────────────────────────────────────── */
  --color-surface:          #ffffff;
  --color-surface-elevated: #f3f6f4;
  --color-surface-page:     #eef3f0;   /* NEW: public mesh base / admin page bg */
  --color-border:           #e1e8e4;
  --color-border-strong:    #cdd8d2;   /* NEW: input borders, segmented controls */
  --color-text-primary:     #15201c;
  --color-text-secondary:   #586b63;
  --color-text-muted:       #9aa8a1;

  --color-brand:            #15803d;
  --color-brand-hover:      #166534;
  --color-brand-foreground: #ffffff;

  --color-error:            #dc2626;
  --color-error-soft:       #fef2f2;   /* NEW: deleted/danger pill bg */
  --color-success:          #15803d;

  /* Neutral scale — recalibrate the existing warm scale to cool slate-green */
  --color-neutral-50:  #f6f9f7;
  --color-neutral-100: #eef3f0;
  --color-neutral-200: #e1e8e4;
  --color-neutral-300: #cdd8d2;
  --color-neutral-400: #9aa8a1;
  --color-neutral-500: #6f7f78;
  --color-neutral-600: #586b63;
  --color-neutral-700: #3f4f48;
  --color-neutral-800: #29352f;
  --color-neutral-900: #15201c;

  /* ─── Glass surfaces (NEW — public catalogue/detail only) ─── */
  --glass-fill:        rgb(255 255 255 / 0.55);  /* chrome over the mesh */
  --glass-fill-overlay:rgb(255 255 255 / 0.16);  /* info panel over a photo */
  --glass-stroke:      rgb(255 255 255 / 0.45);
  --glass-blur:        18px;                       /* use: backdrop-filter: blur(var(--glass-blur)) saturate(160%) */
  --glass-blur-card:   12px;                       /* lighter blur for the per-card overlay panel */
  --scrim:             linear-gradient(to top, rgb(8 18 14 / 0.82) 0%, rgb(8 18 14 / 0.25) 46%, rgb(8 18 14 / 0) 68%);

  /* ─── Typography (keep primitives; these are the semantic layer) ─ */
  --font-family-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-size-meta:          13px;   /* was xs(12) — bumped to pair with large icons */
  --font-size-tag:           11px;
  --font-size-card-title:    16px;   /* glass card title is a headline over the photo */
  --font-size-section-label: 11px;
  --font-size-ui:            14px;
  --font-size-body:          15px;
  --font-size-detail-title:  30px;   /* hero title on the detail page */

  /* ─── Border radius ──────────────────────────────────────── */
  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   14px;
  --radius-xl:   20px;   /* glass cards + panels */
  --radius-full: 9999px;

  /* ─── Shadows ────────────────────────────────────────────── */
  --shadow-sm: 0 1px 2px rgb(16 32 24 / 0.05);
  --shadow-md: 0 4px 12px -4px rgb(16 32 24 / 0.12);
  --shadow-lg: 0 14px 34px -12px rgb(21 48 36 / 0.45);  /* glass card lift */

  /* spacing, breakpoints, --header-height/--toolbar-height,
     motion, z-index layers: UNCHANGED — keep existing values */
}
```

A no-`any` aside: nothing here touches TS. But note the `--font-size-meta` bump from `xs` means
any component relying on the old 12px should be visually re-checked.

---

## 2. Public catalogue — `glass.html`

### 2a. Layout shell — `app/layouts/default.vue`
- Root wrapper background = the mesh:
  ```
  background:
    radial-gradient(circle at 12% 8%,  #d6ece0 0%, transparent 42%),
    radial-gradient(circle at 88% 16%, #cfe2ef 0%, transparent 40%),
    radial-gradient(circle at 50% 95%, #e7def2 0%, transparent 46%),
    var(--color-surface-page);
  ```
  Put this in `tokens.css` as a `--mesh-bg` var or a small utility class; don't inline the literal
  hex in the component (convention: no arbitrary values).
- Header → **frosted glass**: `bg-[--glass-fill]`, `backdrop-blur` (`backdrop-filter: blur(var(--glass-blur)) saturate(160%)`),
  hairline `border-b border-[--glass-stroke]`. Keep the sticky behaviour + `--header-height`.
  Respect safe-area inset (`padding-top: max(12px, env(safe-area-inset-top))`) for installed PWA.
- Footer "library, not availability" note: render as a frosted panel (`bg-[--glass-fill]`, blur,
  `rounded-[--radius-xl]`) — see mockup. The note must stay visible (requirement).

### 2b. Toolbar + filters — `app/pages/index.vue`, `app/components/catalogue/CatalogueFilters.vue`
- Sticky toolbar: glass like the header. Search input = pill (`rounded-[--radius-full]`),
  `bg-white/50`, `border-[--glass-stroke]`. Search icon **18px** (was ~15). Grid/list toggle
  buttons 38×38, **19px** icons, active = `bg-[--color-brand] text-[--color-brand-foreground]`.
- Filter chips (players/time/tags): glass pills — `bg-white/45 backdrop-blur border-[--glass-stroke]`,
  selected = solid brand. Mobile drawer + desktop sidebar layouts stay as they are structurally.

### 2c. The card — `app/components/catalogue/GameCard.vue`  ← biggest change
Restructure from "photo above body" to **photo-as-background with text overlay**:
- Card = `relative overflow-hidden rounded-[--radius-xl] border border-white/40 shadow-[--shadow-lg]`.
- `<picture>` photo absolutely fills the card (`absolute inset-0 object-cover`). Keep the existing
  `srcset`/`sizes`/`loading="lazy"` WebP+JPEG pipeline.
- Scrim layer above the photo: `absolute inset-0` with `background: var(--scrim)`. **The scrim is
  mandatory** — it's what makes overlaid white text legible regardless of the photo.
- Info panel docked bottom: `absolute left-2 right-2 bottom-2`, `bg-[--glass-fill-overlay]`,
  `backdrop-filter: blur(var(--glass-blur-card)) saturate(140%)`, `border border-white/28`,
  `rounded-[--radius-md]`, white text. Contains: title (`text-card-title font-semibold`, subtle
  text-shadow), meta row (large **19px** icons), up to 3 tag pills.
- **Responsive aspect ratio** (the confirmed 1→2→3-up behaviour). Grid + aspect live together:

  | Breakpoint | Grid (in `index.vue`) | Card aspect |
  |---|---|---|
  | mobile (base) | `grid-cols-1` | `aspect-[16/10]` (banner) |
  | `sm:` (~≥640) | `sm:grid-cols-2` | `sm:aspect-[4/3]` |
  | `lg:` (~≥1024) | `lg:grid-cols-3` | `lg:aspect-[3/4]` (portrait) |

  (Mockup uses container queries to fake device widths in one page; production uses normal viewport
  breakpoints since the grid spans the viewport.)
- **No-photo fallback (REQUIRED — ~400 staff-entered games, some will lack a photo):** when
  `game.photoHash` is null, render a solid brand-tinted block
  (`background: linear-gradient(150deg, var(--color-brand), var(--color-brand-hover))`) with the
  game's **first initial** large and centered at low opacity behind the same scrim+panel. Do NOT
  show the faint camera icon under an overlay — it won't read. (This is the agreed default; change
  only if the café provides real placeholder art.)

### 2d. Featured
- Section unchanged structurally: a "Featured" label (`text-section-label uppercase`) above the
  grid, max 3 games. Featured cards get a stronger lift (`shadow-[--shadow-lg]` already covers it;
  optionally a subtle brand-tinted shadow).
- **Featured badge** — `app/components/shared/FeaturedBadge.vue`: glass pill variant —
  `bg-[rgb(21_128_61/0.6)] text-white border border-white/50 backdrop-blur rounded-[--radius-full]`,
  star glyph + "Featured". ⚠️ This makes the badge background-dependent (translucent), which bends
  the "shared component owns appearance, not placement" convention slightly — keep placement
  (`absolute top-2 left-2`) in the parent as today; note the translucency choice in the PR.

### 2e. List view — `app/components/catalogue/GameListItem.vue`
Glass is a **grid-view idea only.** List view stays the existing dense row layout, just repainted
with the new tokens (slate text, green accents, new radii). **Decision: flat, not glass** — rows
sit in a solid bordered container (`bg-[--color-surface] border border-[--color-border]
rounded-[--radius-lg] overflow-hidden`), individual rows separated by `border-b border-[--color-border]`.
No backdrop-blur anywhere in the list (simpler, better scroll perf). Keep the thumbnail, name, meta,
desktop tags, chevron. The no-photo thumbnail uses the same brand-gradient + initial fallback,
scaled down.

---

## 3. Public game detail — `detail.html` → `app/pages/games/[id].vue`

- **Hero**: full-bleed photo, `aspect-[4/3]`, scrim (`var(--scrim)`), title **overlaid** bottom-left
  (`text-detail-title`, white, text-shadow), large-icon meta row beneath it. Glass "← Catalogue"
  back pill top-left; glass Featured badge top-right (if featured).
- **Content panels** (frosted, `bg-[--glass-fill]`, `rounded-[--radius-xl]`, blur), in order:
  1. **Staff pick note** — only if `featured && featuredNote`. Green-tinted callout
     (`bg-[rgb(21_128_61/0.10)] border-[rgb(21_128_61/0.28)]`), star icon, the note text.
  2. **About this game** — description.
  3. **Tags** — pill row (links to the catalogue filtered by that tag is a nice-to-have, not required).
  4. **More photos** — thumbnail row when >1 photo.
  5. The "library, not availability / ask staff" line.
- **Responsive**: mobile stacks hero → panels. `lg:` puts hero in a left column beside a **sticky**
  content column (`grid-cols-[1.15fr_1fr]`), hero `sticky top-[header+gap]`.
- No-photo fallback hero: same brand-gradient + initial treatment as the card.

---

## 4. Staff / admin — `staff.html` (flat, no glass)

Shared palette, but **no glass, no full-bleed photos, no mesh** — page bg is flat
`bg-[--color-surface-page]`. Optimised for legibility + fast entry.

### 4a. Nav — `app/layouts/staff.vue`
Top bar: white, `border-b`, ~58px. Wordmark + "· Staff", nav links (Games / Tags / Users), active
link = brand underline (`box-shadow: inset 0 -2px 0 var(--color-brand)`). Right side: `who · role`
+ Sign out. (Tags/Users routes are M4 — style the nav slots now, leave dead links until built.)

### 4b. Login — `app/pages/staff/login.vue`
Centered card (`max-w-sm`, white, `rounded-[--radius-lg]`, `shadow-[--shadow-md]`) on the flat page.
Wordmark + "Staff sign in", username + password fields, full-width primary button. Invalid state
uses `--color-error` on the inputs.

### 4c. Dashboard — `app/pages/staff/index.vue`
- Page header: "Games" + count line (`N live · M deleted`), primary **+ Add game** button right.
- Toolbar: search (icon-left), a **Live / Deleted / All** segmented control (right). "Deleted"
  satisfies the **soft-delete restore** requirement — deleted rows show a "Deleted" pill and a
  **Restore** action instead of edit/delete.
- **Table** (not cards): columns Game (thumb + name + Featured pill) · Players · Play time · Status
  · actions (edit / delete, or restore). Header row = `bg-[--color-surface-elevated]`, uppercase
  `text-section-label`. Row hover = elevated. Status pills: Live (neutral), Deleted
  (`bg-[--color-error-soft] text-[--color-error]`), Featured (`bg-[rgb(21_128_61/0.12)] text-[--color-brand]`).

### 4d. Add/Edit form — `app/components/staff/GameForm.vue` (+ `BggSearch`, `TagTypeahead`, `PhotoUpload`)
Two-column on desktop (`grid-cols-[1fr_320px]`), single column stacked below `lg:`:
- **Left "Details" card:** a dashed **BGG lookup** block at top (brand-accented label + `BggSearch`
  type-ahead, placeholder explains selecting pre-fills), then Name, Players min/max (2-up),
  Play-time min/max (2-up), Description (textarea), Tags (`TagTypeahead` — applied tags as
  removable brand chips + an input that creates on Enter).
- **Right column:** a **Featured** card (toggle switch + "N of 3" hint + optional featured-note
  input) and a **Photos** card (`PhotoUpload` drop/click/paste-URL zone + uploaded thumbnails).
- Footer actions right-aligned: secondary **Cancel** + primary **Save game**.

### 4e. Shared `Button` / `Input` — `app/components/shared/`
- **Button** variants to support: `primary` (brand fill), `secondary` (white + `--color-border-strong`),
  `danger` (white + red text/border), `ghost` (icon-only row actions). All `rounded-[--radius-md]`,
  `text-ui font-medium`, 16px icons.
- **Input**: `border-[--color-border-strong]`, focus = brand border + `ring` (`0 0 0 3px rgb(21 128 61 / .15)`),
  invalid = `--color-error` border. Keep the existing v-model + attr-inheritance + invalid prop.

---

## 5. Cross-cutting constraints (do not skip)

- **Performance / `backdrop-filter`.** Frosted blur is GPU-real on the low-end phones
  `ARCHITECTURE.md` calls first-class. Rules: blur the **chrome** (header, toolbar, filter pills,
  footer, detail panels) and the **per-card panel only** (capped at `--glass-blur-card` = 12px). Do
  **not** blur every card's full surface or list rows. The card photo legibility comes from the
  **solid scrim**, not blur. If you see jank on a mid-range Android in the catalogue scroll, drop
  the per-card panel blur to a semi-opaque fill first.
- **Accessibility / contrast.** Overlaid white text must always sit on the scrim — never white text
  directly on an unknown photo. Maintain ≥4.5:1 for body text; the slate/green palette is tuned for
  it but re-check brand-on-white for small text (it passes for `--color-brand` #15803d on white).
- **Focus states.** Keep visible focus rings (`focus-visible:ring-2 ring-[--color-brand]`) on cards,
  buttons, inputs, chips — the catalogue is keyboard- and switch-navigable.
- **Reduced motion.** Honour `prefers-reduced-motion` for hover-lift/shadow transitions.
- **Conventions.** Tokens via utilities (`bg-[--color-…]`, `text-card-title`, `px-md`, `rounded-[--radius-xl]`).
  No arbitrary hex/px in components — if a value isn't in tokens, add a token. Component-scoped CSS
  only when utilities get unreadable, and still via `var(--…)`. One component per file. No `any`.
- **PWA.** Safe-area insets on the header (notch) and any sticky bottom UI.

---

## 6. Suggested build order (each can be its own PR)

1. **Tokens** — paste §1 into `tokens.css`. Whole app shifts to slate/green instantly; verify
   nothing breaks. *(smallest, highest leverage)*
2. **Catalogue glass** — `default.vue` (mesh + glass header/footer), `index.vue` (glass toolbar +
   responsive grid), `GameCard.vue` (overlay + responsive aspect + no-photo fallback),
   `FeaturedBadge` glass variant, `GameListItem` repaint, `CatalogueFilters` glass chips.
3. **Detail page** — `games/[id].vue` glass hero + panels.
4. **Staff repaint** — `staff.vue` nav, `login.vue`, `index.vue` dashboard table (incl. Deleted/
   Restore), `GameForm.vue` + sub-components, shared `Button`/`Input`.
5. (M4) Tag management + user admin screens inherit the §4 admin style as they're built.

---

## 7. Resolved decisions (no open questions — build to these)

- **No-photo fallback art** → **brand-gradient block + game initial** behind the scrim (§2c/§2e/§3).
  No real placeholder imagery to supply; this is the final treatment for photoless games.
- **List-view container** → **flat bordered list, no glass** (see §2e). Locked.
- **Mesh background intensity** → **keep the subtle pastel mesh** exactly as in `glass.html` /
  `glass-overview.png`. It's the intended look; do not flatten it to `--color-surface-page`
  (that var is only the mesh's base layer and the staff page bg).

There are no remaining design decisions blocking implementation.
