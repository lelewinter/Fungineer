---
tags: [fungineer, ia, superpowers, claude-code]
date: 2026-03-28
tipo: spec
---

# Context Optimization — Design Spec
**Date:** 2026-03-23
**Status:** Approved
**Goal:** Reduce token consumption during Claude Code sessions without losing critical orientation context.

---

## Problem

Every session loads significant token overhead before any useful work happens:

1. **CLAUDE.md** includes 5 full docs via `@include` — loaded on every message as system prompt
2. **SessionStart hooks** output 15–25 lines of mixed-value info (health checks, decorators, previews)
3. **detect-gaps.sh** prints header/footer even when there are no gaps
4. **pre-compact.sh** greps all GDD files for WIP markers and dumps up to 100 lines of state
5. **Validation hooks** wrap warnings in decorative headers that add noise without value

Estimated overhead before first user message: ~300–400 tokens of low-signal content per session.

---

## Constraints

- **Must keep:** branch name + last 3 commits at session start (user's orientation anchor)
- **Must keep:** session state recovery alert when `active.md` exists
- **Must keep:** all validation logic (commit, asset, push guards)
- **Must keep:** git-safe guards (`2>/dev/null`, non-git-repo conditional blocks)
- **Can remove:** decorators, greps on large file sets, verbose headers, redundant recovery text

---

## Design

### 1. CLAUDE.md — Lazy Loading Core

Replace all `@include` directives with a **Doc Map** table. Claude reads docs on demand based on task type, not on every message.

The inline Collaboration Protocol rules are condensed to one sentence. The full protocol doc is added as a Doc Map row so it remains accessible.

**New content (~70 tokens vs ~200 tokens):**

```markdown
# Fungineer — Claude Code Config

**Stack:** Godot 4.6 · GDScript · Git trunk-based · Jolt physics

**Workflow:** Question → Options → Decision → Draft → Approval
Sempre pergunte antes de escrever arquivos. Sem commits sem instrução.

## Doc Map — leia sob demanda conforme a tarefa

| Quando...                              | Leia                                              |
|----------------------------------------|---------------------------------------------------|
| Escrever/revisar código                | `.claude/docs/coding-standards.md`                |
| Nomear arquivos, classes, variáveis    | `.claude/docs/technical-preferences.md`           |
| Coordenar agentes / escalar decisão    | `.claude/docs/coordination-rules.md`              |
| Navegar estrutura do projeto           | `.claude/docs/directory-structure.md`             |
| Usar API do Godot 4.4+                 | `docs/engine-reference/godot/VERSION.md`          |
| Gerenciar contexto / compact           | `.claude/docs/context-management.md`              |
| Protocolo de colaboração multi-arquivo | `docs/COLLABORATIVE-DESIGN-PRINCIPLE.md`          |
```

**Removed `@include`s:** directory-structure, VERSION.md, technical-preferences, coordination-rules, coding-standards, context-management.

---

### 2. session-start.sh — Silent Unless Relevant

**Removed:**
- `=== Claude Code Game Studios — Session Context ===` header and `===` footer
- Sprint/milestone output — **removed entirely** (not shown even if found; user can check via git log)
- Bug count `find` across 2 dirs
- Code health `grep -r "TODO"` across entire `src/`
- Session state: verbose 20-line preview replaced with a single alert line

**Kept:**
- Existing git-repo guard: `if [ -n "$BRANCH" ]` block — if git is unavailable or not in a repo, the branch+commits block is skipped silently. This guard must be preserved.
- Branch name
- Last 3 commits (was 5)
- Session state alert: one line with file path (only when file exists)

**New output format:**

Without state file (4 lines):
```
Branch: main
  557289e feat(stealth): terminais muito fáceis
  01d8b71 feat(extraction): redesign Corrida de Extração
  b8d4826 merge: revisões de movimento temático
```

With state file (5 lines):
```
Branch: main
  557289e feat(stealth): terminais muito fáceis
  01d8b71 feat(extraction): redesign Corrida de Extração
  b8d4826 merge: revisões de movimento temático
⚠ Estado anterior: production/session-state/active.md
```

---

### 3. detect-gaps.sh — Zero Noise When Clean

**Changed:**
- Remove `=== Checking for Documentation Gaps ===` header (always printed)
- Remove `===================================` footer
- Remove `💡 To get a comprehensive project analysis...` summary line when gaps exist — condense into each gap line
- Fresh-project early-exit (lines ~37–45): remove the `🚀 NEW PROJECT` multi-line block and `💡` suggestion — replace with a single line: `# new project — run /start`
- Each gap: condense from 3 lines to 1 line (combine warning + suggested action)
- `find src -type f ...` for source file counting: add `-maxdepth 5` to limit traversal depth on large repos

**Result:** Completely silent when no gaps found. One line per gap when gaps exist. One line for fresh-project detection.

---

### 4. pre-compact.sh — Focused State Dump

**Removed:**
- `=== SESSION STATE BEFORE COMPACTION ===` header + timestamp line
- WIP grep across all `design/gdd/*.md` (O(n) file reads, not actionable at compact time)
- Verbose "Recovery Instructions" block (replaced with 1 line)

**Changed:**
- State file dump: cap reduced from 100 lines to 30 lines
- All `git diff`, `git diff --staged`, `git ls-files` calls must preserve `2>/dev/null` redirection (guard against non-git environments)

**Kept:**
- Full git diff/staged/untracked listing
- State file content (capped at 30 lines)
- Single line: `# Read <state-file-path> to recover full context`

---

### 5. Validation Hooks — Remove Decorative Headers

**validate-commit.sh:**
- Remove `=== Commit Validation Warnings ===` / `================================` wrapper
- Each warning prints as a plain line to stderr

**validate-assets.sh:**
- Remove `=== Asset Validation ===` / `========================` wrapper
- Each warning prints as a plain line to stderr

**validate-push.sh:**
- Shorten the 2-line reminder to 1 line: `"Push to '$BRANCH' — confirme testes passando e sem bugs S1/S2."`

**session-stop.sh:** No changes — already completely silent (writes only to log file, no stdout/stderr output).

**log-agent.sh:** No changes — already completely silent.

---

### 6. context-management.md — Align with Lazy Loading

**Add** a **Lazy Loading** section at the top:

> **Lazy Loading:** Docs are not auto-loaded. Consult the Doc Map in CLAUDE.md and read only the doc relevant to your current task. This keeps the context window holding only active working content.

**Remove/update** the stale sentence in "Recovery After Session Crash":
> ~~"The `session-start.sh` hook will detect and preview `active.md` automatically"~~

Replace with: "The `session-start.sh` hook will emit a single alert line pointing to `active.md` if it exists."

**Remove** the verbose "Compaction Instructions" list prose (pre-compact.sh hook now handles this output automatically).

---

## File Changeset

| File | Change |
|------|--------|
| `CLAUDE.md` | Replace 6 `@include`s with Doc Map table (7 rows including Collaboration Protocol) |
| `.claude/hooks/session-start.sh` | Remove health checks, sprint/milestone; trim to branch+3commits+state alert |
| `.claude/hooks/detect-gaps.sh` | Remove header/footer; condense gap lines; fix fresh-project path; add `-maxdepth 5` to find |
| `.claude/hooks/pre-compact.sh` | Remove WIP grep; cap state at 30 lines; remove verbose headers; preserve `2>/dev/null` |
| `.claude/hooks/validate-commit.sh` | Remove decorative header/footer from warning output |
| `.claude/hooks/validate-assets.sh` | Remove decorative header/footer from warning output |
| `.claude/hooks/validate-push.sh` | Shorten push reminder to 1 line |
| `.claude/docs/context-management.md` | Add lazy loading section; update stale session-start reference; remove redundant compaction prose |

**No change needed:** `session-stop.sh` (already silent), `log-agent.sh` (already silent), `settings.json` (hook registrations unchanged).

---

## Acceptance Criteria

- [ ] Session start output ≤ 4 lines when no state file exists
- [ ] Session start output ≤ 5 lines when state file exists
- [ ] detect-gaps produces zero output when no gaps found (including in fresh-project path)
- [ ] detect-gaps produces exactly 1 line per gap when gaps exist
- [ ] pre-compact no longer greps `design/gdd/` directory
- [ ] pre-compact state file dump capped at 30 lines
- [ ] CLAUDE.md contains no `@include` directives
- [ ] CLAUDE.md Doc Map has 7 rows covering all previously-included docs plus Collaboration Protocol
- [ ] validate-commit.sh warning output contains no `===` lines
- [ ] validate-assets.sh warning output contains no `===` lines
- [ ] All validation logic preserved (commit JSON check, ass