# Staff feature/un-feature toggle with 3-slot cap

**Status:** concept
**Milestone fit:** QOL addition extending **M4** (featured management, max-3
enforced in UI + data layer). M4 already added the toggle on the edit form; this
brings the same capability inline to the staff games list and adds a
replace-picker for the cap. Visual language: the flat clean admin treatment
(no glass).

> **Data requirement to flag for the implementing engineer (do NOT implement
> here):** the replace-picker and the list hints below need two fields the UI
> can read per game: **`featuredAt`** (timestamp the game became featured) and
> **`featuredBy`** (the staff user who featured it, display name or username).
> These don't exist yet — surfacing them is a data-layer change (column +
> populate on the feature action + include in the `/api/staff/games` payload).
> The design degrades gracefully if either is missing (see §4).

---

## 1. Goal

From the staff games list you can *see* which games are featured but can't
feature/un-feature without opening each game's edit form. Make featuring a
**one-tap inline action** from the list, enforce the **hard cap of 3** with a
clear **replace-picker** when a 4th is attempted, and surface **when** and **by
whom** each pick was featured so a staffer doesn't accidentally bump a colleague's
fresh pick.

---

## 2. The core ambiguity to resolve: two pills today

The list currently shows **two** featured signals on a featured row:
1. a `FeaturedBadge` ("★ Featured" pill) under the game name, and
2. a **Status** column pill that reads "Featured" (vs "Live" / "Deleted").

That's redundant and makes "which thing do I click?" unclear. **Decision:
consolidate the featured state into the Status column and make the Status pill
the toggle.** Specifically:

- **Remove** the `FeaturedBadge` from under the name in the staff list
  (`app/pages/staff/index.vue`, line ~81). The name column goes back to just
  thumb + name. (The public catalogue + detail keep the badge — this change is
  staff-list only.)
- **Repurpose the Status column** into a single **state control** that is the
  source of truth and the toggle. A row is in exactly one of: **Deleted**
  (non-interactive pill, as today), **Featured** (active toggle), or **Live**
  (inactive toggle → click to feature).

This gives one unambiguous control per row, in a column that already exists, and
keeps the name column clean.

---

## 3. The inline toggle — design

Rename the column header from **"Status"** to **"Featured"** (it now expresses
exactly one axis: featured or not; deleted rows are an edge case shown as a muted
pill). The control is a **pill-shaped button** sized as a comfortable tap target.

### Wireframe — table row (desktop)

```
 GAME                     PLAYERS  PLAY TIME   FEATURED        ACTIONS
 ┌──┐
 │▦ │ Wingspan             1–5      40–70 min  [★ Featured ]   [Edit] [Delete]
 └──┘                                          └ click=remove
 ┌──┐
 │▦ │ Azul                 2–4      30–45 min  [☆ Feature  ]   [Edit] [Delete]
 └──┘                                          └ click=feature (or replace-picker)
 ┌──┐
 │▦ │ Old Game (deleted)   2–4      30 min     ·Deleted·       [Restore]
 └──┘                                          └ non-interactive
```

### Visual spec

**Featured pill (active / on)** — click to **un-feature**
- Base: the existing `pill-featured` look as the resting state —
  `background: rgb(21 128 61 / 0.12)`, `color: var(--color-brand)`,
  `border-radius: var(--radius-full)`, filled star glyph + "Featured".
- It's now a `<button>`, so add `border: 1px solid rgb(21 128 61 / 0.28)` to read
  as pressable, `padding: 4px 10px` (≥ the 28px pill height; the whole row is
  44px tall so the target is fine), `font-size: var(--font-size-tag)` (11px),
  `font-weight: 600`, `cursor: pointer`.
- **Hover:** shift toward "remove" affordance — `background: var(--color-error-soft)`,
  `color: var(--color-error)`, `border-color: var(--color-error)`, and the label
  swaps to **"Remove"** with the star becoming an `×`/outline. This makes the
  destructive direction explicit on hover (un-featuring is the click result).
  `motion-safe:transition-colors duration-fast`.
- **Focus-visible:** `outline: 2px solid var(--color-brand); outline-offset: 2px`.

**Feature pill (inactive / off)** — click to **feature**
- Resting: neutral, clearly "empty slot" —
  `background: var(--color-surface)`, `border: 1px solid var(--color-border-strong)`,
  `color: var(--color-text-secondary)`, outline star (☆) + "Feature".
- **Hover (slots available):** brand-tint preview —
  `background: rgb(21 128 61 / 0.08)`, `border-color: var(--color-brand)`,
  `color: var(--color-brand)`. Reads as "this will become featured".
- **Hover (3 slots full):** do **not** disable the button (it still works — it
  opens the replace-picker). Instead show the same brand-tint hover, and surface
  the cap via a `title`/tooltip "3 of 3 featured — choose one to replace". The
  click opens the replace modal rather than featuring directly. Optionally append
  a tiny "(3/3)" hint — see "full affordance" below.

**Disabled / "full" affordance**
- Featuring is **never hard-disabled** by the cap — the requirement is to *offer
  a replace*, so the off pill stays interactive and routes to the modal when
  full. The only genuinely disabled state is **in-flight** (below).
- To make "you're at the cap" legible *before* clicking, show a small counter in
  the page header area: **"Featured · N of 3"** next to the existing
  `N live · M deleted` count line (`text-meta`, `--color-text-muted`; the "N of
  3" turns `--color-brand` when N = 3). This is the ambient cap signal; the modal
  is the just-in-time one.

**Loading / in-flight state (per row)**
- On click, the pill enters a pending state: replace the glyph with a small
  spinner, dim to `opacity: 0.6`, `cursor: not-allowed`, `pointer-events: none`
  on that pill only (other rows stay live). Keep the pill width stable (reserve
  via `min-width`) so the row doesn't reflow.
- On success: optimistic flip to the new state with a brief `--duration-base`
  color transition. On error: revert to prior state + a toast/inline message
  (reuse whatever error pattern the staff pages use; if none, a small inline
  `text-error` line under the table is fine). Respect `prefers-reduced-motion`
  (no scale/transition, just the state swap).

**Deleted rows**
- Status cell stays a **non-interactive** `pill-deleted` ("Deleted",
  `--color-error-soft` / `--color-error`). A deleted game can't be featured; no
  toggle. (Matches today's behavior; featured + deleted is already excluded.)

### Responsive (the list is staff-primary on larger screens, but support mobile)
- **Desktop / tablet (`sm:` and up):** as the table above. Players/Play time
  columns visible (already `hidden sm:table-cell`).
- **Mobile (< 640px):** Players/Play-time columns are already hidden. The
  **Featured** column stays visible (it's the new primary action) — keep it to
  the right of the name, Actions wrap below or shrink to icon buttons. The pill
  is ≥44px tappable. If horizontal space is tight, the pill may show **icon-only**
  (★) on `< sm` with the text label returning at `sm:` — but keep an
  `aria-label`/`title` so it's never icon-only without an accessible name.

---

## 4. Surfacing "featured on" + "featured by" on the list

So staff have context before they even open the modal:

- **On a featured row**, under the game name (where the `FeaturedBadge` used to
  sit), show a single muted meta line:
  **`Featured 3 days ago · by Sam`** (`text-meta` / `--color-font-size-meta`,
  `--color-text-muted`). Use relative time ("just now", "2h ago", "3 days ago",
  then a date past ~7 days). This replaces the redundant badge with *useful*
  context and reinforces the Featured state without a second pill.
- **Graceful degradation:** if `featuredAt`/`featuredBy` aren't available yet
  (pre data-layer change), omit the line entirely — the row just shows
  thumb + name, and the Featured toggle still works. The feature is additive.
- Non-featured rows show nothing extra (no meta line).

---

## 5. The "replace a featured game" modal

Triggered when the user clicks **Feature** on a 4th game while 3 are already
featured. A small centered modal (not a full page) over a scrim.

### Wireframe

```
        ╔══════════════════════════════════════════════╗
        ║  Featured slots are full (3 of 3)        [×]  ║
        ║                                               ║
        ║  Choose a featured game to replace with       ║
        ║  “Azul”:                                       ║
        ║                                               ║
        ║  ┌─────────────────────────────────────────┐ ║
        ║  ( ) ┌──┐  Wingspan                          │ ║
        ║      │▦ │  Featured 3 days ago · by Sam      │ ║
        ║      └──┘                                     │ ║
        ║  ├─────────────────────────────────────────┤ ║
        ║  ( ) ┌──┐  Catan                             │ ║
        ║      │▦ │  Featured 2 weeks ago · by Alex    │ ║
        ║      └──┘                                     │ ║
        ║  ├─────────────────────────────────────────┤ ║
        ║  ( ) ┌──┐  Ticket to Ride      ◌ recent      │ ║  ← recent hint
        ║      │▦ │  Featured 4 hours ago · by you     │ ║
        ║      └──┘                                     │ ║
        ║  └─────────────────────────────────────────┘ ║
        ║                                               ║
        ║              [ Cancel ]   [ Replace ]         ║  ← Replace disabled
        ╚═══════════════════════════════════════════════╝     until a radio is picked
```

### Spec

**Container / overlay**
- Scrim: `background: rgb(8 18 14 / 0.45)` (a darkened slate; reuse the scrim
  ink color family, no blur — staff is flat, and blur over the staff page would
  fight the "no glass in admin" rule). `position: fixed; inset: 0`.
- Dialog: `background: var(--color-surface)`, `border-radius: var(--radius-lg)`,
  `box-shadow: var(--shadow-lg)`, `max-width: 420px`, `width: calc(100% - 32px)`,
  centered, `padding: var(--spacing-lg)`. On mobile it may dock as a bottom sheet
  (`border-radius` top corners only, slide up) — optional; centered is fine.
- **A11y:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby` → the title.
  Trap focus within; `Esc` closes (= Cancel); restore focus to the originating
  Feature pill on close. First focus lands on the close button or the first radio.

**Header**
- Title: **"Featured slots are full (3 of 3)"** — `text-card-title`,
  `font-semibold`, `--color-text-primary`.
- Close `×` button top-right (`btn-ghost` variant).
- Subhead: **"Choose a featured game to replace with "{incomingName}":"** —
  `text-ui`, `--color-text-secondary`. The incoming game name is **bold**
  (`--color-text-primary`) so it's clear what's coming in.

**The 3 choices (radio list)**
- A bordered list (`border: 1px solid var(--color-border)`,
  `border-radius: var(--radius-md)`, rows divided by `border-b`), one row per
  currently-featured game. Each row is a **label wrapping a radio** so the whole
  row is the hit target (≥44px tall, `padding: var(--spacing-sm) var(--spacing-md)`).
- Row contents: radio (left) · 32–40px thumb (`--radius-sm`, same fallback
  gradient+initial) · text block:
  - Game name — `text-ui`, `font-medium`, `--color-text-primary`.
  - Meta line — **`Featured {relative time} · by {featuredBy}`** — `text-meta`,
    `--color-text-muted`. Show "by you" when `featuredBy` is the current user.
- **Selected row:** `background: rgb(21 128 61 / 0.08)`,
  `border-left: 2px solid var(--color-brand)` (or the radio simply checked in
  brand). Radio accent = `--color-brand`.
- **Hover row:** `background: var(--color-surface-elevated)`.
- Sort order: **most-recently-featured last** (or visually de-emphasized) so the
  natural top-down pick lands on the *oldest* pick — the safe one to bump.

**"Recently featured" hint (avoid accidental bumps)**
- Any pick featured within a threshold (suggest **< 24h**, or the single most
  recent if all are old) gets a subtle **"◌ recent"** chip on its row:
  `background: rgb(21 128 61 / 0.10)`, `color: var(--color-brand)`,
  `font-size: var(--font-size-tag)`, `--radius-full`, a small clock/dot glyph.
  Don't disable it — just flag it so the user pauses before replacing a fresh
  pick. Pair the chip with the relative-time text (don't rely on the chip alone).
- Optional stronger guard: if the user selects a "recent" row and clicks Replace,
  show an inline confirm line ("This was featured 4 hours ago by you — replace
  anyway?") before committing. Recommend the lightweight chip first; add the
  confirm only if accidental bumps actually happen.

**Footer actions**
- Right-aligned: **Cancel** (`btn-secondary`) + **Replace** (`btn-primary`).
- **Replace is disabled until a radio is selected** (`btn` disabled state,
  `opacity: 0.6`). Its label can read "Replace" or, richer, **"Replace {oldName}"**
  once a selection is made (nice-to-have).
- On confirm: the action un-features the chosen game and features the incoming
  one (a single swap on the server, ideally atomic — flag to engineer). Show the
  Replace button in `pending` state (the shared `Button` already supports
  `pending` + `pendingLabel="Replacing…"`). On success, close + the list reflects
  both changes; on error, keep the modal open with an inline error.

**States**
- *Open with cap full:* as drawn.
- *Edge — fewer than 3 featured (shouldn't open):* the modal only appears at the
  cap; below the cap, Feature acts immediately with no modal.
- *Loading the 3 picks:* they're already in the list payload, so the modal opens
  instantly with data — no spinner needed.
- *Reduced motion:* no slide/scale entrance; a plain fade or instant show.

---

## 6. Data this implies (flag to engineer — do NOT implement)

- **`featuredAt: timestamp`** — set when a game is featured (and updated on
  re-feature). Drives "Featured {relative time}" and the "recent" hint and the
  modal sort.
- **`featuredBy: <user ref>`** — the staff user who featured it; surface a display
  name/username. Drives "by {name}".
- Include both in the `/api/staff/games` list payload so the list + modal can
  render without extra round-trips.
- **Atomic swap** for the replace action (un-feature A + feature B) so the cap is
  never transiently violated and a failure doesn't leave 2 or 4 featured.
- Cap enforcement stays at the data layer (M4 already does this); the modal is UI
  affordance, not the enforcement.
- All of these are **optional for the toggle MVP** — the inline feature/un-feature
  works without `featuredAt`/`featuredBy`; those two only enrich the context lines
  and the modal. The replace-picker itself needs only the names/thumbs of the
  current 3 (already available) to function, with the date/by lines degrading to
  absent if the fields aren't there yet.

---

## 7. Affected surfaces

- `app/pages/staff/index.vue` — remove the under-name `FeaturedBadge` (line ~81);
  rename the **Status** column to **Featured**; replace the static status pill
  (lines ~95–99) with the toggle button (featured/feature/deleted states);
  add the per-row "Featured … · by …" meta line; add the "Featured · N of 3"
  count in the header line (~7); wire the click → feature/un-feature, and →
  modal when at cap; add the per-row pending state.
- **New component:** `app/components/staff/FeaturedReplaceModal.vue` — the
  replace-picker dialog (props: incoming game, the 3 current featured games with
  `featuredAt`/`featuredBy`; emits chosen id / cancel). Owns focus-trap + a11y.
- `app/components/shared/Button.vue` — **reused** for Cancel/Replace (`secondary`,
  `primary`, `pending`/`pendingLabel` already exist). Ghost variant for the
  modal close `×`. No changes needed.
- `app/components/shared/FeaturedBadge.vue` — **unchanged**; still used by the
  public catalogue/detail. Only its *staff-list* usage is removed.
- (No change to the public catalogue from this task.)

---

## 8. Open questions / options

1. **Toggle home — Status column (recommended) vs the name-area badge.** I
   recommend the Status column become the toggle and the name badge be removed,
   for one unambiguous control. Alternative: keep the badge as the toggle and
   drop the Status pill — but the Status column is the more conventional place for
   an actionable state, and it leaves room for the relative-time line under the
   name. Going with Status-as-toggle.
2. **Hover semantics on the featured pill** — swap label to "Remove" + red tint
   (recommended, makes the destructive click explicit) vs keep "Featured" and
   only show a subtle "×". Recommend the explicit Remove swap.
3. **"Recent" guard strength** — chip only (recommended) vs chip + inline confirm
   on selecting a recent pick. Start with the chip; escalate if needed.
4. **Direct un-feature confirm?** Un-featuring from the list is one click + easily
   reversible (just re-feature). Recommend **no** confirm dialog for un-feature
   (unlike Delete) to keep it fast; the hover "Remove" label is enough warning.
