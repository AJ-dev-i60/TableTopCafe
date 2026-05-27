# Requirements — Board Game Café Catalogue

## Purpose

A web-based catalogue for a small board game café (~30 tables, ~400 games) that lets customers browse the available game library on their own phones or on in-café tablets, and lets staff manage the catalogue from a separate interface.

The catalogue answers the question "what games exist in this café," not "what games are free right now." Availability is intentionally out of scope — see Out of Scope below.

## Users

**Customers.** Walk-in patrons of the café. Use the public catalogue on their phone or a tablet. No accounts, no login. Just browse.

**Staff.** Café employees (roughly 6 people). Log in with personal accounts to manage the catalogue: add games, edit games, soft-delete games, upload photos, mark featured games, manage tags.

**Admin.** Currently one person (the café owner). Can do everything staff can do, plus manage staff accounts.

## Functional Requirements

### Customer-facing catalogue (public, no login)

- Available at a public URL (e.g. `gamesplace.com/games`).
- Mobile-friendly. Customers will primarily use phones; tablets at the café are a secondary use case.
- Displays the full list of non-deleted games.
- Each game shows: name, box photo (if uploaded), player count range, play time range, tags, description.
- Search by game name (free text).
- Filter by player count, play time, and tags (multi-select). Filters combine — e.g. "4 players AND under 60 minutes AND Cooperative" should work.
- Up to three featured games appear prominently at the top of the catalogue.
- A small note somewhere visible explains that the catalogue shows the library, not real-time availability — customers should ask staff to grab a game.

### Staff interface (separate URL, login required)

Available at a distinct URL (e.g. `gamesplace.com/staff`). Staff log in with their own account.

**Game management:**

- Add a new game. The add form should ideally pre-fill fields from a known board-game database when the staff member selects a known game; manual entry is the fallback for obscure or homebrew titles.
- Edit any existing game.
- Soft-delete a game (removes it from the public catalogue but retains it in the database).
- View soft-deleted games and restore them.
- Upload one or more box photos per game.

**Featured games:**

- Mark up to three games as featured.
- No auto-expiry. Featured games stay featured until manually changed or unfeatured.
- An optional short note can be attached to a featured game (e.g. "Staff pick this week — great for new players").

**Tag management:**

- While adding or editing a game, staff can apply tags via a type-ahead field. As they type, matching existing tags appear; they can click to apply an existing tag, or press enter to create a new one inline. Newly created tags are immediately available as customer-facing filter options.
- A dedicated tag-management view lets staff rename tags and consolidate duplicates (e.g. merge "2-Player" into "Two-Player" — all games tagged with the source tag are automatically re-tagged with the target tag, and the source tag is removed).
- Staff can also delete tags. Deleting a tag does *not* remove it from games already tagged with it; the tag simply stops being available for new assignments and disappears from the customer filter list. This is to avoid accidental mass-untagging.

### Admin interface

Everything in the staff interface, plus:

- Create new staff accounts.
- Reset any staff account's password manually.
- Delete staff accounts.

No password-recovery flow, no email verification, no 2FA. If a staff member forgets their password, admin resets it manually.

### Data captured per game

- Name (required)
- Box photo(s) (optional)
- Player count: minimum and maximum
- Play time: minimum and maximum (minutes)
- Tags (zero or more, from the shared tag list)
- Description (short free text, 1–3 sentences typical)
- Featured flag (true/false), plus optional featured note
- Soft-delete flag
- Audit fields: created-by (staff account), created-at (timestamp), last-edited-by, last-edited-at, deleted-by, deleted-at

Audit captures *who* and *when*, not *what changed*. Full change history is out of scope for v1.

### Data captured per tag

- Tag name (unique within the system)
- Created-by, created-at (helpful for traceability; not surfaced to customers)

### Data captured per account

- Username
- Password (stored securely — see Constraints)
- Role (staff or admin)
- Created-at

## Non-Functional Requirements

- **Hosting cost:** as cheap as reasonably possible. Avoid monthly SaaS subscriptions where feasible. Self-hosted on commodity hardware or a small VPS is acceptable.
- **Concurrency:** low. Expected peak is maybe 20–30 customers browsing simultaneously on a busy Saturday, plus 1–2 staff using the admin interface. Performance is not a concern at this scale.
- **Uptime:** best-effort. If the system is down for a few hours, the café falls back to its existing process (asking staff). No SLA, no monitoring infrastructure required for v1.
- **Backups:** the game catalogue and uploaded photos should be backed up regularly enough that a hardware failure doesn't lose months of work. Daily backup of the database and photo storage is sufficient.
- **Security:** passwords stored hashed (not plaintext). Staff/admin interface protected by login. No specific compliance requirements (no payment data, no personal customer data stored).

## Constraints

- Initial data entry: ~400 games to be entered by staff over a few quiet afternoons. The add-game workflow needs to be fast enough that this is realistic — type-ahead game lookup matters here.
- Roughly 20–30 of the 400 games have damaged or missing barcodes; manual entry must work cleanly for these.
- The café has one laptop in the back office and decent wifi. No on-premise server infrastructure.

## Out of Scope (for v1)

- Real-time availability tracking (which games are checked out vs. on the shelf). Deferred — would require staff to scan games in and out, which is unacceptable workflow overhead at current staffing.
- Customer accounts of any kind.
- Pre-booking or reservation of games.
- Payments.
- Password-recovery flows (forgot-password emails, security questions, etc.).
- Two-factor authentication.
- Full change history per game (who changed which field to what). Only last-edited-by/at is captured.
- Photo recognition for game identification during data entry. Manual selection from a known-games list is the chosen approach.
- Game ratings, reviews, or customer feedback features.
- Integration with external services (BoardGameGeek API, payment processors, etc.) beyond whatever is needed to source the known-games list.

## Assumptions

- A reliable source for the "known board games" lookup list exists or can be built (e.g. BoardGameGeek data, a static seed file, or similar). Validating this is an early architecture task.
- Customers reaching the catalogue arrive via a QR code at tables or by typing the URL. No discovery mechanism (SEO, marketing site) needs to be built.
- Staff are comfortable enough with technology to use a web-based admin interface after a brief walkthrough.

## Open Questions

- What's the source of the "known board games" list? BoardGameGeek's API has terms-of-use considerations; alternatives include a one-time seeded dataset or a smaller curated list. Resolve during architecture.
- Photo storage: where do uploaded box photos live (filesystem on the host, object storage, etc.)? Resolve during architecture.
- Backup strategy specifics (where backups go, retention period). Resolve during architecture or operations planning.
