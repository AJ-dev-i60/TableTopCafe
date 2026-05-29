# TableTopCafe — Design Directions (M5 design pass)

Three candidate visual directions for the public catalogue. Open
[`mockups.html`](./mockups.html) in a browser to compare them live — each phone is the
real catalogue screen (header → search → filters → Featured → grid → list → library note)
rendered from a different token set. Overview render: [`mockups-overview.png`](./mockups-overview.png).

Picking a direction is a **`tokens.css` change only** — the `@theme` block below replaces the
placeholder values. Components don't change because they already reference tokens by name. The
two directions that introduce a *display* font or a *tinted header* need a one-line tweak in two
components (noted per direction).

---

## A · Café Warm — editorial, warm paper, serif headings

Warm cream surfaces, espresso text, a terracotta brand, and a **Fraunces** serif for the
wordmark + game titles. Reads like a café menu / bookshop. The header is a solid espresso bar so
the wordmark anchors the page. Best fit for the "physical café" identity and the editorial card
grid called out in `ARCHITECTURE.md`.

- **Mood:** inviting, tactile, characterful.
- **Trade-off:** the serif adds a font file (~weights 500/600) and the most personality — least "neutral SaaS".
- **Extra change:** wordmark + `.title`/`detail-title` use `--font-family-display`; add `@fontsource/fraunces` and one font-family utility on those elements.

```css
@theme {
  --color-surface:          #fffdf9;
  --color-surface-elevated: #f5efe3;
  --color-border:           #e8ddc9;
  --color-text-primary:     #2b2018;
  --color-text-secondary:   #6f6151;
  --color-text-muted:       #a8977f;

  --color-brand:            #c2410c;
  --color-brand-hover:      #9a3412;
  --color-brand-foreground: #fffdf9;

  --color-error:            #b91c1c;
  --color-success:          #15803d;

  --font-family-sans:    'Inter', system-ui, -apple-system, sans-serif;
  --font-family-display: 'Fraunces', Georgia, 'Times New Roman', serif;  /* wordmark + titles */

  --font-size-card-title:   15px;
  --font-size-detail-title: 28px;
  /* meta/tag/section-label/ui/body keep the current scale */

  --radius-sm: 5px;  --radius-md: 12px;  --radius-lg: 16px;  --radius-xl: 20px;
  --shadow-sm: 0 1px 2px rgb(60 40 20 / 0.06);
  --shadow-md: 0 6px 16px -6px rgb(120 60 20 / 0.22);
}
```
Header bar (espresso): in `default.vue` give `<header>` `bg-[--color-text-primary]` and the
wordmark `text-[--color-brand-foreground]`.

---

## B · Felt & Slate — clean, premium, calm (recommended default)

Cool near-white surfaces, slate-ink text, and a deep **tabletop-green** brand (felt-table green,
on-theme without being literal). All-Inter, tighter, Apple-like. This is the safest, most
timeless pick and the closest to the existing neutral placeholder — lowest-risk to ship, and M4
features inherit it cleanly.

- **Mood:** premium, quiet, content-first.
- **Trade-off:** least distinctive of the three; relies on photography + spacing for character.
- **Extra change:** none — pure token swap.

```css
@theme {
  --color-surface:          #ffffff;
  --color-surface-elevated: #f3f6f4;
  --color-border:           #e1e8e4;
  --color-text-primary:     #15201c;
  --color-text-secondary:   #586b63;
  --color-text-muted:       #9aa8a1;

  --color-brand:            #15803d;
  --color-brand-hover:      #166534;
  --color-brand-foreground: #ffffff;

  --color-error:            #dc2626;
  --color-success:          #15803d;

  --font-family-sans: 'Inter', system-ui, -apple-system, sans-serif;

  --font-size-card-title:   14px;
  --font-size-detail-title: 26px;

  --radius-sm: 6px;  --radius-md: 10px;  --radius-lg: 14px;  --radius-xl: 16px;
  --shadow-sm: 0 1px 2px rgb(16 32 24 / 0.05);
  --shadow-md: 0 4px 12px -4px rgb(16 32 24 / 0.12);
}
```

---

## C · Game Night — bold, playful, energetic

White cards floating on a faintly-tinted page, a vivid **indigo** brand, and a **coral** accent
reserved for Featured (badge + label). Larger radii, more pop. Reads young and fun — leans into
"game night" energy.

- **Mood:** lively, modern, social.
- **Trade-off:** the two-accent system (indigo brand + coral featured) is the most opinionated and
  the easiest to over-apply; keep coral strictly for Featured.
- **Extra change:** page background ≠ card surface — set the page bg on `default.vue`'s root
  wrapper to `--color-surface-page`; Featured badge uses the coral accent.

```css
@theme {
  --color-surface:          #ffffff;   /* cards */
  --color-surface-page:     #f3f3fb;   /* NEW: page background behind cards */
  --color-surface-elevated: #f4f3fb;
  --color-border:           #e6e4f2;
  --color-text-primary:     #1e1b2e;
  --color-text-secondary:   #565273;
  --color-text-muted:       #9591ab;

  --color-brand:            #4f46e5;
  --color-brand-hover:      #4338ca;
  --color-brand-foreground: #ffffff;

  --color-accent:           #f97316;   /* NEW: Featured-only accent */
  --color-accent-foreground:#ffffff;

  --color-error:            #dc2626;
  --color-success:          #16a34a;

  --font-family-sans: 'Inter', system-ui, -apple-system, sans-serif;

  --font-size-card-title:   15px;
  --font-size-detail-title: 28px;

  --radius-sm: 8px;  --radius-md: 16px;  --radius-lg: 20px;  --radius-xl: 24px;
  --shadow-sm: 0 1px 3px rgb(30 27 46 / 0.07);
  --shadow-md: 0 8px 20px -6px rgb(79 70 229 / 0.22);
}
```
`FeaturedBadge.vue`: swap `bg-[--color-brand]` → `bg-[--color-accent]`. `default.vue`: indigo
header (`bg-[--color-brand]`, white wordmark) and page bg `bg-[--color-surface-page]`.

---

## D · Glass Slate — glassmorphism, full-bleed photos, text overlay

A variant built **on top of the Felt & Slate palette** (slate ink + tabletop green) so it reads as
the same product with a richer treatment. Open [`glass.html`](./glass.html); render:
[`glass-overview.png`](./glass-overview.png). Game photos go full-bleed in taller `3/4` cards with
the **title overlaid on the image**; meta sits in a **frosted-glass panel** docked to the bottom;
meta/search/toggle icons are enlarged (~19px). Header, toolbar, filter pills and the library note
are all frosted glass floating over a soft slate/green mesh.

- **Mood:** premium, photo-forward, "app-like".
- **Trade-offs / caveats — read before committing:**
  - **This is not a token-only change.** Colors are still tokens, but the card *layout* changes:
    `GameCard.vue` becomes photo-as-background + scrim + overlay panel instead of photo-above-body.
  - **Photos become load-bearing.** Title legibility depends on every card having a good box photo.
    The current placeholder (a faint icon on `surface-elevated`) won't carry an overlay — needs a
    fallback (solid brand-tint block + title) for the ~photoless games. With ~400 staff-entered
    games, some *will* ship without a photo.
  - **`backdrop-filter` cost.** Frosted blur on many cards is GPU-real on low-end phones — the exact
    devices `ARCHITECTURE.md` calls out as first-class. Mitigate: blur only the chrome (header/
    toolbar/pills), use a *solid* dark scrim (not blur) on cards, and cap the card panel blur radius.
  - **List view** still needs the standard row treatment — glass is a grid-view idea.

```css
/* Palette tokens — identical to Felt & Slate (B). Glass uses these plus the
   glass surface variables below; the rest of the glass look is in components. */
@theme {
  --color-surface:          #ffffff;
  --color-surface-elevated: #f3f6f4;
  --color-border:           #e1e8e4;
  --color-text-primary:     #15201c;
  --color-text-secondary:   #586b63;
  --color-text-muted:       #9aa8a1;
  --color-brand:            #15803d;
  --color-brand-hover:      #166534;
  --color-brand-foreground: #ffffff;

  --font-family-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-size-card-title:   16px;   /* bumped — it's now a headline over the photo */
  --font-size-meta:         13px;   /* bumped — paired with large icons */
  --font-size-detail-title: 26px;

  --radius-sm: 8px;  --radius-md: 14px;  --radius-lg: 20px;  --radius-xl: 24px;

  /* NEW — glass surface system */
  --glass-fill:   rgb(255 255 255 / 0.55);   /* chrome over the page */
  --glass-fill-2: rgb(255 255 255 / 0.16);   /* info panel over a photo */
  --glass-stroke: rgb(255 255 255 / 0.45);
  --glass-blur:   18px;                        /* used as blur(var(--glass-blur)) */

  --shadow-sm: 0 1px 2px rgb(16 32 24 / 0.05);
  --shadow-md: 0 10px 28px -10px rgb(21 48 36 / 0.45);
}
```
**Responsive grid (confirmed direction):** one big banner card per game on mobile, reflowing to
multiple columns as the viewport grows — `glass-responsive.png` (phone 1-up vs. tablet) and
`glass-tablet-3up.png` (tablet landscape 3-up). The card's aspect ratio shifts with the column
count so a full-width single card isn't awkwardly tall:

| Width | Columns | Card aspect |
|---|---|---|
| phone (`< 460px`)        | 1 | `16/10` banner |
| tablet portrait (`≥ 460px`) | 2 | `4/3` |
| tablet landscape / desktop (`≥ 760px`) | 3 | `3/4` portrait |

In the real app this is a Tailwind responsive grid on the catalogue container
(`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) with the card aspect set per breakpoint. The mockup
uses CSS **container queries** so the grid keys off the frame width; the production version can use
normal viewport breakpoints since the grid spans the viewport.

Component work this direction needs (beyond tokens):
1. `GameCard.vue` — restructure to photo-background + gradient scrim + absolutely-positioned glass
   panel (title overlay), with a breakpoint-driven aspect ratio. Add a no-photo fallback block.
2. `default.vue` / `index.vue` — page mesh background; frosted header + sticky toolbar; glass chips.
3. `FeaturedBadge.vue` — glass pill variant (translucent brand fill + white hairline). Note: this
   gives the badge a *background-dependent* look, which bends the "shared components own appearance,
   not placement" convention slightly — worth a line in the PR.

Effort: roughly half a day of component work on top of the palette, vs. ~minutes for a pure A/B/C
token swap.

---

## Recommendation & next step

Lock **B · Felt & Slate** as the default unless you want more café personality, in which case
**A · Café Warm** is the stronger identity play. Whichever you choose:

1. Replace the placeholder values in `app/assets/css/tokens.css` with the chosen block.
2. Apply the per-direction "extra change" notes (A and C only).
3. Then M4 (featured management, tag UI, soft-delete restore, user admin) is built against the
   locked tokens and inherits the look for free — per the roadmap's "lock tokens first" note.

> Spacing tokens are unchanged across all three — the current `xs…3xl` scale is sound. This pass
> is palette + type + radius + shadow. If you want a denser or airier rhythm, that's a separate
> spacing-scale decision and I can mock it on top of the chosen palette.
