# Claude Code Instructions

Before doing any work in this repo:

1. **Pull latest changes first**: `git pull origin dev` — this project is worked on
   across multiple machines. Always sync before reading files or writing code to avoid
   duplicating work that was already done elsewhere.

2. Then read in order:
   - `requirements.md` — what we're building
   - `ARCHITECTURE.md` — system shape and technology choices
   - `CONVENTIONS.md` — code organization rules (mandatory, not suggestions)
   - `docs/roadmap.md` — current milestone and what "done" looks like
   - `docs/progress.md` — current state and what's next

When proposing changes, reference which milestone they belong to. If a
change doesn't fit cleanly in the current milestone, flag it rather than
silently expanding scope.

The `CONVENTIONS.md` rule of "no `any`, ever" is strict. If a type is
genuinely unknown, use `unknown` and narrow with Zod.

Commit messages: imperative mood, concise subject line, body explaining
the why if it isn't obvious from the diff.