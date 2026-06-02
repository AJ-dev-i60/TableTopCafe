# Doc Worker State

onboarding: complete
last-scan-commit: 516c38297a0bdbe47acb1ac9dadb1ba96be22b48
last-scan-date: 2026-06-02

## In progress

_(clear)_

## Queue

- [ ] Verify CONVENTIONS.md `server/db/client.ts` reference still matches the actual file path
- [ ] Check whether `docs/progress.md` M3 checklist items (BGG XML service, `bgg-fetch` endpoints, weekly task) should receive a strikethrough or dated note indicating they were removed — currently they appear as completed (`[x]`) which is accurate historically but could mislead a reader scanning what is currently in the codebase
- [ ] Once the auth bypass is removed from `server/api/auth/login.post.ts` (pre-launch item, tracked in `progress.md`), update the codebase-map entry for that file to remove the **bold warning**
- [ ] Once `SharedButton`/`SharedInput`/`login.vue` px literals are replaced with tokens (blocked on design sign-off), update the M5 checklist item in `docs/progress.md` and remove the note from `project-shared-component-token-debt` memory

## Deferred updates

| Doc file | Section | Change needed | Blocked on issue |
|----------|---------|---------------|-----------------|

## Opened issues

| Issue | Title | Date opened | Status |
|-------|-------|-------------|--------|

## Session log

- 2026-06-02: initial onboarding — full codebase scan (76 files across 15 layers)
- 2026-06-02: fixed README.md (stale "pre-implementation" status, wrong doc paths)
- 2026-06-02: fixed ARCHITECTURE.md — bgg_games_cache data model description (now reflects retired status), No background job queue non-goal (removed stale BGG cron claim)
- 2026-06-02: fixed CONVENTIONS.md directory layout (removed stale bgg.ts service + tasks/ BGG cron, added wikipedia/ route, detail.vue layout, staff/catalogue.vue + staff/tags/[id].vue pages, server/data/, server/utils/, server/plugins/ entries; corrected docs listed under docs/ → repo root)
- 2026-06-02: fixed docs/roadmap.md M3 superseded note (corrected "players/time dropped" → Wikipedia fills players + play time)
- 2026-06-02: added stale-data notice to docs/design-brief-context.md (pre-M5 token values, superseded by tokens.css + design/HANDOFF.md)
- 2026-06-02: created docs/codebase-map.md (76 files across 15 layers)
