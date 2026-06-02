# TableTopCafe

A web-based catalogue for a small board game café. Customers browse the café's library on their phones or in-café tablets via a public URL; staff manage the catalogue — adding games, uploading photos, organizing tags, featuring picks of the moment — through a separate authenticated interface at `/staff`. There are no customer accounts, no real-time availability tracking, and no payments: the catalogue answers "what games does this café have," not "which ones are free right now." Availability tracking is a possible future addition; the schema is shaped to accommodate it without rework.

**Status:** in M5 (Polish). The full catalogue (public + staff + admin) is implemented and running on dev. Awaiting owner sign-off, 400-game data entry sprint, and a low-end Android performance pass before production launch.

## Documentation

Read these in order if you're new to the project:

- [`requirements.md`](./requirements.md) — what the system needs to do, who it's for, and what's explicitly out of scope.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — the shape of the system, technology choices and the reasoning behind them, and architectural non-goals.
- [`CONVENTIONS.md`](./CONVENTIONS.md) — code organization, naming, patterns to prefer. Start here at the beginning of any coding session.
- [`docs/roadmap.md`](./docs/roadmap.md) — phased delivery plan from walking skeleton through the 400-game data entry sprint.
- [`docs/progress.md`](./docs/progress.md) — current state, what's done in each session, and what comes next.
