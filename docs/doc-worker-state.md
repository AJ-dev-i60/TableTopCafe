# Doc Worker State

onboarding: complete
last-scan-commit: b9616f5b6c615ae1a49be7225aa3cc44d4ce2f71
last-scan-date: 2026-06-04

## In progress

_(clear)_

## Queue

- [x] **`docs/progress.md` line 7 (M5 status line) stale — fixed 2026-06-04.** Verified `git rev-parse dev main origin/main origin/dev HEAD` all return `183856e` (force-update confirmed). Rewrote the M5 status line so it no longer presents `dev`→`main` as a pending blocker (now states dev/main are byte-identical and prod carries the full M5 UX pass + later fixes). Also struck through stale "Next actions" item #1 (the "owner finishes testing → then merge" line) as done.
- [x] Shared-component token migration done 2026-06-03 — `progress.md` updated (session note + M5/backlog items marked done). (`project-shared-component-token-debt` memory does not exist — nothing to remove.)
- [x] Verified `CONVENTIONS.md` `server/db/client.ts` reference (line 47) matches the actual file — `server/db/client.ts` exists. No drift; item closed 2026-06-03.

## Deferred updates

| Doc file | Section | Change needed | Blocked on issue |
|----------|---------|---------------|-----------------|

## Opened issues

| Issue | Title | Date opened | Status |
|-------|-------|-------------|--------|
| #1 | timeLabel displays fractional hours | 2026-06-04 (by coding agent) | closed 2026-06-04 |
| #2 | Excessive backdrop-filter usage causes GPU compositing lag | 2026-06-04 (by coding agent) | closed 2026-06-04 |
| #3 | FCP 2844ms: 3 render-blocking CSS files | 2026-06-04 (by coding agent) | closed 2026-06-04 |
| #4 | Route-level CSS files eagerly loaded on homepage | 2026-06-04 (by coding agent) | closed 2026-06-04 |

## Session log

- 2026-06-02: initial onboarding — full codebase scan (76 files across 15 layers)
- 2026-06-02: fixed README.md (stale "pre-implementation" status, wrong doc paths)
- 2026-06-02: fixed ARCHITECTURE.md — bgg_games_cache data model description (now reflects retired status), No background job queue non-goal (removed stale BGG cron claim)
- 2026-06-02: fixed CONVENTIONS.md directory layout (removed stale bgg.ts service + tasks/ BGG cron, added wikipedia/ route, detail.vue layout, staff/catalogue.vue + staff/tags/[id].vue pages, server/data/, server/utils/, server/plugins/ entries; corrected docs listed under docs/ → repo root)
- 2026-06-02: fixed docs/roadmap.md M3 superseded note (corrected "players/time dropped" → Wikipedia fills players + play time)
- 2026-06-02: added stale-data notice to docs/design-brief-context.md (pre-M5 token values, superseded by tokens.css + design/HANDOFF.md)
- 2026-06-02: created docs/codebase-map.md (76 files across 15 layers)
- 2026-06-03: shared-component token migration completed (working-tree change, not yet committed) — updated progress.md (new session note, status line, M5 checklist, design-asks, tech-debt backlog) and closed the queue item
- 2026-06-04: verified branch sync (`dev`/`main`/`origin/main`/`origin/dev`/`HEAD` all at `183856e`); fixed stale M5 status line + "Next actions" #1 in progress.md (merge to main no longer a pending blocker — prod carries the full M5 pass).
- 2026-06-04: incremental drift scan `183856e..b9616f5`. Two code commits (1bb98a6 mobile filter drawer fixed positioning; a988c08 four perf/bug fixes). Applied three pending doc-worker notes: added two session entries to progress.md (remote Playwright audit + issues #1–#4 fixed), updated M5 checklist, added backdrop-filter convention rule to CONVENTIONS.md, updated codebase-map.md (nuxt.config.ts inlineStyles, CatalogueBrowser filter-drawer wording, commit header). Closed GitHub issues #1–#4. No new drift found.
- 2026-06-04: incremental drift scan `ae512c5..183856e`. Three doc-only commits (b7763b1 my prior audit, 9c5a875 + 183856e viewport-zoom/QR doc updates — already applied) + one code commit `ca3a7d9` (perf: catalogue payload trim + content-visibility + theme-color green). Verified `ca3a7d9` is fully/accurately captured by the existing 2026-06-03 perf session note; no files added/removed → no codebase-map structural change; `GameListItem`/`GameCard`/games.ts purpose lines still accurate; no `any` introduced (convention-clean). No new drift, no issue opened. Brought last-scan to `183856e`.
- 2026-06-03: drift audit for commit `ae512c5` (token migration). Verified value-preserving migration in code (Button/Input/SearchInput/login.vue + 2 new tokens); reviewed the pre-made progress.md edits for accuracy (accurate — kept). Updated codebase-map.md: tokens.css row now notes `--color-focus-ring`/`--color-error-ring`; header → `ae512c5`/2026-06-03. No files added/removed. Re-verified recent renames vs code: `/api/game-names/search` present, `server/api/bgg/` + `schema/bgg.ts` + `scripts/refresh-game-names.ts` absent, `GET /api/staff/stats` present, `GameSearch.vue` present, `BggSearch.vue` absent — all match docs, no drift. Verified carried-over `CONVENTIONS.md` `server/db/client.ts` reference. No code drift found → no issue opened. Brought last-scan to `ae512c5`.
- 2026-06-02: drift audit for commits a21f938, f73b730, 3e37311, f0dffb1
  - ARCHITECTURE.md: updated system-shape paragraph (removed weekly cron claim); updated data-model section (bgg_games_cache dropped, not "left in place"); updated External integrations note (/api/bgg/search → /api/game-names/search, table-dropped wording)
  - CONVENTIONS.md: directory layout bgg/ → game-names/ under server/api/
  - docs/progress.md: checked off auth-bypass pre-launch item (done f73b730); added 2026-06-02 session entry (auth bypass, BGG dead-code removal, stats endpoint, TagTypeahead fix); annotated M3 checklist items with removal/rename dates; marked bgg_games_cache tech-debt item as done
  - docs/codebase-map.md: BggSearch.vue → GameSearch.vue; /api/bgg/search → /api/game-names/search; removed schema/bgg.ts row; removed scripts/refresh-game-names.ts row; added migration 0005 row; added server/api/staff/stats.get.ts row; removed bold auth-bypass warning from login.post.ts entry
