# Design concepts

Design proposals produced by the `design-worker` agent. Each concept is saved
here (markdown spec, plus optional standalone HTML mockups / reference images)
so design work syncs across machines via the `dev` branch and can be implemented
in a later session.

This is for *new* concept work. The foundational mockups in the parent `design/`
folder (`glass.html`, `detail.html`, `staff.html`, `mockups.html`) are the
reference visual language — don't overwrite them.

## Index

_(one line per concept — slug → summary → status: `concept` | `ready-to-build` | `implemented`)_

- `mobile-featured-presentation` — compact mobile featured section: horizontal carousel (rec.) vs rotating spotlight, replacing the full-width featured cards below `sm:` — added 2026-05-31 — `implemented` (Concept A carousel, auto-advance off; `app/components/catalogue/FeaturedStrip.vue`)
- `staff-featured-toggle` — inline feature/un-feature toggle in the staff games list + 3-slot-cap replace-picker modal (needs `featuredAt`/`featuredBy` data) — added 2026-05-31 — `concept`
