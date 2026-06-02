# Doc Worker State

onboarding: complete
last-scan-commit: f0dffb12e04a55bff0a06cb2487edcfcc3b933fa
last-scan-date: 2026-06-02

## In progress

_(clear)_

## Queue

- [ ] Once `SharedButton`/`SharedInput`/`login.vue` px literals are replaced with tokens (blocked on design sign-off), update the M5 checklist item in `docs/progress.md` and remove the note from `project-shared-component-token-debt` memory
- [ ] Verify `CONVENTIONS.md` `server/db/client.ts` reference still matches the actual file path (carried from previous session — not yet verified)

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
- 2026-06-02: drift audit for commits a21f938, f73b730, 3e37311, f0dffb1
  - ARCHITECTURE.md: updated system-shape paragraph (removed weekly cron claim); updated data-model section (bgg_games_cache dropped, not "left in place"); updated External integrations note (/api/bgg/search → /api/game-names/search, table-dropped wording)
  - CONVENTIONS.md: directory layout bgg/ → game-names/ under server/api/
  - docs/progress.md: checked off auth-bypass pre-launch item (done f73b730); added 2026-06-02 session entry (auth bypass, BGG dead-code removal, stats endpoint, TagTypeahead fix); annotated M3 checklist items with removal/rename dates; marked bgg_games_cache tech-debt item as done
  - docs/codebase-map.md: BggSearch.vue → GameSearch.vue; /api/bgg/search → /api/game-names/search; removed schema/bgg.ts row; removed scripts/refresh-game-names.ts row; added migration 0005 row; added server/api/staff/stats.get.ts row; removed bold auth-bypass warning from login.post.ts entry
