# Claude Code Instructions

Before doing any work in this repo, read in order:
1. `requirements.md` — what we're building
2. `ARCHITECTURE.md` — system shape and technology choices
3. `CONVENTIONS.md` — code organization rules (mandatory, not suggestions)
4. `docs/roadmap.md` — current milestone and what "done" looks like

When proposing changes, reference which milestone they belong to. If a
change doesn't fit cleanly in the current milestone, flag it rather than
silently expanding scope.

The `CONVENTIONS.md` rule of "no `any`, ever" is strict. If a type is
genuinely unknown, use `unknown` and narrow with Zod.

Commit messages: imperative mood, concise subject line, body explaining
the why if it isn't obvious from the diff.