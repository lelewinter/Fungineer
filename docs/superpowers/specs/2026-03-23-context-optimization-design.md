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
- **Can remove:** decorators, greps on large file sets, verbose headers, redundant recovery text

---

## Design

### 1. CLAUDE.md — Lazy Loading Core

Replace all `@include` directives with a **Doc Map** table. Claude reads docs on demand based on task type, not on every message.

**New content (~60 tokens vs ~200 tokens):**

```markdown
# Fungineer — Claude Code Config

**Stack:** Godot 4.6 · GDScript · Git trunk-based · Jolt physics

**Workflow:** Question → Options → Decision → Draft → Approval
Sempre pergunte antes de escrever arquivos. Sem commits sem instrução.

## Doc Map — leia sob demanda conforme a tarefa

| Quando...                           | Leia                                       |
|-------------------------------------|--------------------------------------------|
| Escrever/revisar código             | `.claude/docs/coding-standards.md`         |
| Nomear arquivos, classes, variáveis | `.claude/docs/technical-preferences.md`    |
| Coordenar agentes / escalar decisão | `.claude/docs/coordination-rules.md`       |
| Navegar estrutura do projeto        | `.claude/docs/directory-structure.md`      |
| Usar API do Godot 4.4+              | `docs/engine-reference/godot/VERSION.md`   |
| Gerenciar contexto / compact        | `.claude/docs/context-management.md`       |
```

**Removed:** `@.claude/docs/directory-structure.md`, `@docs/engine-reference/godot/VERSION.md`, `@.claude/docs/technical-preferences.md`, `@.claude/docs/coordination-rules.md`, `@.claude/docs/coding-standards.md`, `@.claude/docs/context-management.md`

---

### 2. session-start.sh — Silent Unless Relevant

**Removed:**
- `=== Claude Code Game Studios — Session Context ===` header and `===` footer
- Sprint/milestone file lookup (only surfaced if found — keep the conditional, remove the noise when absent)
- Bug count `find` across 2 dirs
- Code health `grep -r "TODO"` across entire `src/`
- Session state: verbose 20-line preview replaced with a single alert line

**Kept:**
- Branch name
- Last 3 commits (was 5)
- Session state alert: one line pointing to the file path

**New output format (4–6 lines):**
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
- Remove `=== Checking for Documentation Gaps ===` header always printed at start
- Remove `===================================` footer
- Remove `💡 To get a comprehensive project analysis...` summary line (only shown if gaps exist)
- Each gap: condense from 3 lines to 1 line (warning + suggested action on same line)

**Result:** Completely silent when no gaps found. One line per gap when gaps exist.

---

### 4. pre-compact.sh — Focused State Dump

**Removed:**
- `=== SESSION STATE BEFORE COMPACTION ===` header + timestamp line
- WIP grep across all `design/gdd/*.md` (O(n) file reads, rarely actionable at compact time)
- Verbose "Recovery Instructions" block (3 lines → 1 line)

**Changed:**
- State file dump: cap reduced from 100 lines to 30 lines

**Kept:**
- Full git diff/staged/untracked listing (high signal for recovery)
- State file content (capped)
- Single recovery pointer line

---

### 5. Validation Hooks — Remove Decorative Headers

**validate-commit.sh:**
- Remove `=== Commit Validation Warnings ===` / `================================` wrapper
- Each warning prints as a plain line

**validate-assets.sh:**
- Remove `=== Asset Validation ===` / `========================` wrapper
- Each warning prints as a plain line

**validate-push.sh:**
- Shorten reminder from 2 lines to 1: `"Push to '$BRANCH' — confirm tests pass and no S1/S2 bugs."`

**log-agent.sh:** No changes (already silent).

---

### 6. context-management.md — Align with Lazy Loading

Add a **Lazy Loading** section explaining the Doc Map philosophy:

> Docs are not auto-loaded. When starting a task, consult the Doc Map in CLAUDE.md and read only the doc relevant to the current work. This keeps the context window holding only active working content.

Remove the verbose "Compaction Instructions" list (now handled by pre-compact.sh output, not prose guidance).

---

## File Changeset

| File | Change |
|------|--------|
| `CLAUDE.md` | Replace 6 `@include`s with Doc Map table |
| `.claude/hooks/session-start.sh` | Remove health checks, trim to branch+3commits+state alert |
| `.claude/hooks/detect-gaps.sh` | Remove header/footer, condense gap lines |
| `.claude/hooks/pre-compact.sh` | Remove WIP grep, cap state at 30 lines, remove verbose headers |
| `.claude/hooks/validate-commit.sh` | Remove decorative header/footer from warning output |
| `.claude/hooks/validate-assets.sh` | Remove decorative header/footer from warning output |
| `.claude/hooks/validate-push.sh` | Shorten push reminder to 1 line |
| `.claude/docs/context-management.md` | Add lazy loading section, remove redundant compaction prose |

---

## Acceptance Criteria

- [ ] Session start output ≤ 6 lines when no state file exists
- [ ] Session start output ≤ 7 lines when state file exists
- [ ] detect-gaps produces zero output when no gaps found
- [ ] pre-compact no longer greps `design/gdd/` directory
- [ ] CLAUDE.md contains no `@include` directives
- [ ] All validation logic preserved (commit, asset, push guards still fire correctly)
- [ ] Doc Map covers all 6 previously-included documents
