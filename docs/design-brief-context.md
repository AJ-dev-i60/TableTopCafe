# TableTopCafe — Design Brief Context Report

## 1. Token System

All tokens are defined in `app/assets/css/tokens.css` inside a Tailwind v4 `@theme` block. They are consumed in templates using Tailwind's arbitrary-value syntax: `bg-[--color-surface]`, `shadow-[--shadow-sm]`, etc.

### Colors
| Token | Current value | Notes |
|---|---|---|
| `--color-surface` | `#ffffff` | Page background |
| `--color-surface-elevated` | `#f8f7f4` | Cards, inputs, secondary backgrounds |
| `--color-border` | `#e4e4e4` | All borders |
| `--color-text-primary` | `#1a1a1a` | Body text, headings |
| `--color-text-secondary` | `#6b6b6b` | Labels, meta text |
| `--color-text-muted` | `#9a9a9a` | Placeholders, disabled states |
| `--color-brand` | `#2563eb` | Primary interactive color (buttons, links, active states, badges) |
| `--color-brand-hover` | `#1d4ed8` | Hover state for brand elements |
| `--color-error` | `#dc2626` | Error messages, destructive actions |
| `--color-success` | `#16a34a` | Defined but not currently used anywhere in the UI |

### Spacing
| Token | Value |
|---|---|
| `--spacing-xs` | `4px` |
| `--spacing-sm` | `8px` |
| `--spacing-md` | `16px` |
| `--spacing-lg` | `24px` |
| `--spacing-xl` | `32px` |
| `--spacing-2xl` | `48px` |
| `--spacing-3xl` | `64px` |

**Note:** These spacing tokens are entirely unused in the codebase. All spacing in components uses Tailwind's built-in numeric scale directly (`p-3`, `gap-4`, `mb-6`, etc.). The tokens exist but have no consumers.

### Typography
| Token | Value |
|---|---|
| `--font-family-sans` | `'Inter', system-ui, -apple-system, sans-serif` |
| `--font-family-mono` | `'JetBrains Mono', 'Fira Code', monospace` |
| `--font-size-xs` | `12px` |
| `--font-size-sm` | `14px` |
| `--font-size-base` | `16px` |
| `--font-size-lg` | `18px` |
| `--font-size-xl` | `20px` |
| `--font-size-2xl` | `24px` |
| `--font-size-3xl` | `30px` |
| `--font-size-4xl` | `36px` |

**Note:** Like spacing, the font-size tokens are unused. All type sizing uses Tailwind's `text-sm`, `text-xs`, `text-2xl`, etc. The font-family tokens appear to be wired up via Tailwind's `@theme` but Inter is never explicitly loaded (no `<link>` in the layout), so it falls through to `system-ui` in production.

### Border radius
| Token | Value |
|---|---|
| `--radius-sm` | `4px` |
| `--radius-md` | `8px` |
| `--radius-lg` | `12px` |
| `--radius-xl` | `16px` |
| `--radius-full` | `9999px` |

These are the most consistently used tokens. Almost all rounded corners reference them via `rounded-[--radius-md]` etc.

### Shadows
| Token | Value |
|---|---|
| `--shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` |
| `--shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)` |
| `--shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` |

`--shadow-lg` is defined but not used anywhere.

### Breakpoints
| Token | Value | Usage |
|---|---|---|
| `--breakpoint-sm` | `640px` | Grid goes 2→3 col; list-view tags appear |
| `--breakpoint-md` | `768px` | Detail page image `sizes` attribute |
| `--breakpoint-lg` | `1024px` | Filter sidebar becomes visible; mobile filter drawer hides |
| `--breakpoint-xl` | `1280px` | `max-w-7xl` container cap |

### Token gaps — hardcoded values in the codebase

These values appear in templates without a token and represent styling decisions that the design brief should close:

- **`bg-white`** used in 6+ places (GameCard body, inputs, login card, TagTypeahead dropdown, staff form, staff layout header) instead of `bg-[--color-surface]`. The current values happen to be the same (`#fff`) but they will diverge if the surface token changes.
- **`text-white`** on all brand buttons and badges — no token for on-brand text color.
- **`duration-150` / `duration-100`** — transition durations not tokenized.
- **`top-[57px]`** in `index.vue` — hardcoded pixel offset for the sticky search bar, derived from the measured height of the default layout header. If header padding or font size changes, this breaks.
- **`top-[115px]`** in `index.vue` — hardcoded sticky sidebar top offset (header + search bar combined height).
- **`w-52`** (208px) — hardcoded width of the desktop filter sidebar.
- **`aspect-[3/2]`** in `GameCard.vue` — the photo crop ratio for grid cards.
- **`max-h-96`** (384px) — maximum height of the hero image on the detail page.
- **`aspect-video`** (16:9) — fallback placeholder aspect ratio on the detail page.
- **`max-h-48`** (192px) — max height of the tag typeahead dropdown.
- **`z-10` / `z-20`** — z-index values not tokenized (search bar is z-10, headers are z-20).

---

## 2. Component Inventory

### Catalogue surface (`app/components/catalogue/`)

**`GameCard.vue`** — Renders a vertical card for grid view: a `3:2` aspect-ratio photo area at top (with `<picture>` srcset for WebP/JPEG), then a body with game name (2-line clamp), a meta row (player count + play time with inline SVG icons), and up to 3 tag pills with an overflow count. Has a featured badge (brand-colored pill, top-left of photo).

*Hardcoded styling to tokenize:* `bg-white` on the article body; `rounded-lg` (uses Tailwind built-in, not `--radius-lg` token).

**`GameListItem.vue`** — Renders a horizontal row for list view: a fixed 48×48px square thumbnail (thumb size only, JPEG, no srcset), then a column with name + featured badge + player/time meta, tag pills hidden below `sm`, and a trailing chevron icon.

*Hardcoded styling to tokenize:* `bg-white` on hover resets.

**`CatalogueFilters.vue`** — A stateless filter panel rendered as an `<aside>` with three filter sections: Players (single-select pill buttons), Play time (single-select pill buttons), and Tags (multi-select pill buttons). Active state uses brand color fill. Shared between the desktop sidebar and the mobile drawer — the page handles positioning in both contexts.

*No significant hardcoded styling.*

### Staff surface (`app/components/staff/`)

**`GameForm.vue`** — A form that handles both create and edit modes. Fields: name, description, min/max players, min/max play time, featured toggle + optional featured note, tag input (via TagTypeahead), and photo upload (via PhotoUpload). On create, saves the game first then uploads photos in a second step. Submit and cancel actions at the bottom.

*Hardcoded styling to tokenize:* `bg-white` on all inputs and the form container; `focus:ring-2` ring width not tokenized.

**`TagTypeahead.vue`** — A controlled combobox: selected tags render as removable pill chips above an input; typing filters available tags and shows a dropdown; if the typed string doesn't match any existing tag, a "Create…" option appears. Handles keyboard navigation (Enter selects first, Escape closes).

*No significant hardcoded styling.*

**`PhotoUpload.vue`** — A drag-and-drop / click-to-browse file input area. Shows existing photos as 80×80px thumbnail squares above the drop zone. Queues new files client-side, shows local preview thumbnails, and exposes an `upload()` method called by GameForm after the game record is saved.

*No significant hardcoded styling.*

### Layouts

**`default.vue`** — Public layout: sticky header with wordmark + optional header-actions slot (currently unused); `<main>` slot with no padding applied (pages handle their own padding); footer with the "library not real-time availability" notice.

**`staff.vue`** — Staff layout: sticky header with wordmark, "Staff" badge, nav links (Games, View catalogue, Sign out); `<main>` scoped to `max-w-7xl` with `px-4 py-6`. Background is `--color-surface-elevated` rather than `--color-surface`.

---

## 3. Page / Route Inventory

### Public routes (default layout)

**`/` — Catalogue** (`app/pages/index.vue`)
Server-renders the full game list and tag list. Contains: sticky search + view-toggle toolbar (stacks below the layout header, `top-[57px]`); a mobile filter drawer (slides in below the toolbar on mobile); a desktop two-column layout with a `w-52` sticky sidebar for filters and a flex-1 content area. Content area renders featured games (up to 3, surfaced first) and all remaining games in either grid (`GameCard`) or list (`GameListItem`) layout. The grid is 2-col mobile, 3-col `sm+`.

**`/games/[id]` — Game detail** (`app/pages/games/[id].vue`)
Server-rendered. Contains: back link; hero photo (first photo, `card`+`detail` srcset, capped at `max-h-96`); name + featured badge + optional featured note; quick-facts row (players, play time); tag pills; description text; secondary photo grid (remaining photos at `thumb` size, 3-col). Uses `max-w-3xl mx-auto px-4 py-8` — no layout wrapper of its own.

### Staff routes (staff layout, all require auth middleware)

**`/staff/login` — Staff login** (`app/pages/staff/login.vue`)
No layout (`layout: false`), SSR explicitly disabled. A centered card with username + password fields and an `aria-live` error region.

**`/staff` — Games dashboard** (`app/pages/staff/index.vue`)
Lists all games including soft-deleted (shown at 50% opacity with a "(deleted)" label). Each row has Edit and Delete actions. "Add game" button links to `/staff/games/new`.

**`/staff/games/new` — Add game** (`app/pages/staff/games/new.vue`)
Breadcrumb + `StaffGameForm` inside a white bordered card. On save, navigates back to `/staff`.

**`/staff/games/[id]/edit` — Edit game** (`app/pages/staff/games/[id]/edit.vue`)
Same layout as new, with game data pre-loaded into `StaffGameForm` via `initial` prop. Fetches game and tags in parallel.

---

## 4. Image Pipeline

Defined in `server/services/photos.ts`. Every uploaded image is processed by Sharp into 6 files (3 sizes × 2 formats):

| Size name | Width | Height | Formats | Quality |
|---|---|---|---|---|
| `thumb` | 200px | proportional | WebP (q82), JPEG (q85 progressive) | — |
| `card` | 600px | proportional | WebP (q82), JPEG (q85 progressive) | — |
| `detail` | 1200px | proportional | WebP (q82), JPEG (q85 progressive) | — |

`withoutEnlargement: true` — images smaller than the target width are not upscaled.

Files are stored at `./photos/{sha256-hash-32chars}/{size}.{ext}` and served via `/api/photos/[hash]/[file]`.

**Where each size is used:**

| Size | Used where |
|---|---|
| `thumb` (200px) | List view thumbnail (displayed 48×48px); PhotoUpload existing-photo grid (80×80px); detail page secondary photo grid (3-col aspect-square) |
| `card` (600px) | GameCard srcset candidate (displayed at ~33vw on desktop); detail page hero srcset candidate |
| `detail` (1200px) | Detail page hero image (primary `src`, capped at `max-h-96` / 384px) |

There is no concept of a "primary" or "cover" photo in the data model — the first photo by insertion order is used as the hero everywhere. The seed script generates flat-color placeholder images at 1200×800px.

---

## 5. Technical Constraints Relevant to Design Decisions

**No virtualization.** The catalogue renders all games as real DOM nodes in a single list. At 400 games this is roughly 400 `<article>` elements for grid view, each containing a `<picture>` with lazy-loaded images. There is no windowing or pagination. Card height does not need to be uniform. If a design decision adds significant per-card DOM weight (e.g. animated elements, multiple layers), scroll performance on low-end Android should be tested. Adding server-side pagination would require API and composable changes.

**All filtering is client-side.** The full game list is fetched as one JSON payload on page load. Filters (search, player count, play time, tags) run against the in-memory array via `useFilters.ts`. This means any "instant" filter feel is free, but the initial payload grows linearly with catalogue size. At ~400 games the payload is probably under 100 KB JSON; worth noting if the design proposes search-as-you-type against a server endpoint instead.

**Sticky offset fragility.** The catalogue page uses `top-[57px]` for the search bar and `top-[115px]` for the sidebar. Both are manually measured pixel values derived from the current header height. A design change that alters header padding, font size, or adds a banner will break the sticky positioning. If the design calls for a different header height, these values must be updated in code.

**Grid column count is fixed.** The grid is always `grid-cols-2 sm:grid-cols-3`. There is no 4-column tier on xl. A design that wants 4 columns at large viewport would require a template change.

**Card photo aspect ratio is fixed at 3:2.** `aspect-[3/2]` is hardcoded in `GameCard`. Photos at different source aspect ratios are cropped to fill this box via `object-cover`. The detail page hero uses `object-cover` with a `max-h-96` cap rather than a fixed aspect ratio.

**Login page is SSR-disabled.** `definePageMeta({ ssr: false })` is set on the login page to work around a Vue hydration mismatch with `v-show` on error messages. This means the login page is a client-only render — there will be a brief blank flash before the form appears on first load.

**Inter is not loaded.** The `--font-family-sans` token names Inter, but no font is loaded in the layout. The browser falls through to `system-ui`. If the design specifies Inter (or any web font), a `<link>` to Google Fonts or a self-hosted font file needs to be added to `app/layouts/default.vue`.

**Photo storage is local filesystem.** Photos are written to a Docker volume mounted at `./photos`. There is no CDN or object storage. Image serving goes through the Nuxt server route `/api/photos/[hash]/[file]`, which reads from disk on every request. No cache headers are set on that route currently. A design that relies on high image throughput (e.g. large hero images auto-playing a slideshow) would land on the Nuxt server, not a CDN.

**Session cookie, no JWT.** Auth is cookie-based with `httpOnly` cookies. There are no tokens in localStorage or the URL. This has no direct design implications but means "share this game" links are fully public and don't carry session state.

---

## 6. Other Things a Design Brief Should Know

**The staff surface is intentionally minimal.** The staff interface (`/staff/*`) is a functional admin UI, not a customer-facing surface. The design brief should explicitly state whether it covers the staff surface or only the public catalogue. Currently the two surfaces share the same token file but use different layouts. A wholesale visual treatment of the staff pages is a separable scope item.

**The "Featured" badge appears in three places with identical markup but no shared component.** `GameCard`, `GameListItem`, and the detail page each inline their own featured badge. If the design changes the badge appearance, three places must be updated.

**`--color-success` is defined but has no UI consumer.** No component currently renders a success state. If the design calls for success toasts, save confirmations, or status indicators, the token is ready but the component pattern does not exist yet.

**Tag count is unbounded at the data layer.** A game can have any number of tags. `GameCard` shows at most 3 (with "+N" overflow). `GameListItem` shows at most 2 on desktop, none on mobile. The detail page shows all. If the design introduces a different truncation or a tag cloud, the `slice()` calls in the components need updating.

**There is no shared button or input component.** Every form field and button is styled inline. The same Tailwind class string for a text input appears 8+ times across `GameForm` and `login.vue`. The design brief should flag whether it expects a component extraction as part of the design pass or just an updated token set.

**The default layout has a `header-actions` slot that is never used.** It was likely stubbed for a future "sign in" or account link in the public header. If the design calls for something in the public header beyond the wordmark, this slot is already there.
