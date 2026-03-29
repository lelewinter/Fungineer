---
tags: [fungineer, ia, superpowers, claude-code]
date: 2026-03-28
tipo: spec
---

# Context Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduzir consumo de tokens por sessão eliminando @includes do CLAUDE.md, enxugando hooks de startup e removendo decoradores de hooks de validação.

**Architecture:** Lazy loading — CLAUDE.md vira um core de ~70 tokens com Doc Map; hooks ficam silenciosos por padrão e só emitem output quando há algo relevante; validation hooks perdem headers decorativos.

**Spec:** `docs/superpowers/specs/2026-03-23-context-optimization-design.md`

**Tech Stack:** Bash, Markdown

---

## File Map

| File | Action |
|------|--------|
| `CLAUDE.md` | Modify — replace @includes with Doc Map |
| `.claude/hooks/session-start.sh` | Modify — trim to branch+3commits+state alert |
| `.claude/hooks/detect-gaps.sh` | Modify — remove header/footer, condense gaps, fix fresh-project path, add -maxdepth 5 |
| `.claude/hooks/pre-compact.sh` | Modify — remove WIP grep, cap state at 30 lines, remove headers |
| `.claude/hooks/validate-commit.sh` | Modify — remove decorative header/footer |
| `.claude/hooks/validate-assets.sh` | Modify — remove decorative header/footer |
| `.claude/hooks/validate-push.sh` | Modify — shorten push reminder to 1 line |
| `.claude/docs/context-management.md` | Modify — add lazy loading section, fix stale reference |

---

### Task 1: CLAUDE.md — Replace @includes with Doc Map

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Replace file content**

New content:

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

- [ ] **Step 2: Verify no @include remains**

Run: `grep "^@" CLAUDE.md`
Expected: no output (zero line-starting @ directives)

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "chore(context): substitui @includes por Doc Map no CLAUDE.md"
```

---

### Task 2: session-start.sh — Trim startup output

**Files:**
- Modify: `.claude/hooks/session-start.sh`

- [ ] **Step 1: Replace file content**

```bash
#!/bin/bash
# Claude Code SessionStart hook: Load project context at session start

set +e

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
if [ -n "$BRANCH" ]; then
    echo "Branch: $BRANCH"
    git log --oneline -3 2>/dev/null | while read -r line; do
        echo "  $line"
    done
fi

STATE_FILE="production/session-state/active.md"
if [ -f "$STATE_FILE" ]; then
    echo "⚠ Estado anterior: $STATE_FILE"
fi

exit 0
```

- [ ] **Step 2: Verify output line count (when no state file exists)**

Run: `bash .claude/hooks/session-start.sh | wc -l`
Expected: ≤ 4 (branch line + up to 3 commit lines). If `production/session-state/active.md` exists, expected is ≤ 5.

- [ ] **Step 3: Commit**

```bash
git add .claude/hooks/session-start.sh
git commit -m "chore(context): session-start enxuto — branch + 3 commits + state alert"
```

---

### Task 3: detect-gaps.sh — Silent when clean

**Files:**
- Modify: `.claude/hooks/detect-gaps.sh`

- [ ] **Step 1: Replace file content**

```bash
#!/bin/bash
# Hook: detect-gaps.sh
# Event: SessionStart
# Purpose: Detect missing documentation when code/prototypes exist
# Cross-platform: Windows Git Bash compatible

set +e

# --- Check 0: Fresh project detection ---
FRESH_PROJECT=true

if [ -f ".claude/docs/technical-preferences.md" ]; then
  ENGINE_LINE=$(grep -E "^\- \*\*Engine\*\*:" .claude/docs/technical-preferences.md 2>/dev/null)
  if [ -n "$ENGINE_LINE" ] && ! echo "$ENGINE_LINE" | grep -q "TO BE CONFIGURED" 2>/dev/null; then
    FRESH_PROJECT=false
  fi
fi

if [ -f "design/gdd/game-concept.md" ]; then
  FRESH_PROJECT=false
fi

if [ -d "src" ]; then
  SRC_CHECK=$(find src -maxdepth 5 -type f \( -name "*.gd" -o -name "*.cs" -o -name "*.cpp" -o -name "*.c" -o -name "*.h" -o -name "*.hpp" -o -name "*.rs" -o -name "*.py" -o -name "*.js" -o -name "*.ts" \) 2>/dev/null | head -1)
  if [ -n "$SRC_CHECK" ]; then
    FRESH_PROJECT=false
  fi
fi

if [ "$FRESH_PROJECT" = true ]; then
  echo "# new project — run /start"
  exit 0
fi

# --- Check 1: Substantial codebase but sparse design docs ---
if [ -d "src" ]; then
  SRC_FILES=$(find src -maxdepth 5 -type f \( -name "*.gd" -o -name "*.cs" -o -name "*.cpp" -o -name "*.c" -o -name "*.h" -o -name "*.hpp" -o -name "*.rs" -o -name "*.py" -o -name "*.js" -o -name "*.ts" \) 2>/dev/null | wc -l)
else
  SRC_FILES=0
fi

if [ -d "design/gdd" ]; then
  DESIGN_FILES=$(find design/gdd -type f -name "*.md" 2>/dev/null | wc -l)
else
  DESIGN_FILES=0
fi

SRC_FILES=$(echo "$SRC_FILES" | tr -d ' ')
DESIGN_FILES=$(echo "$DESIGN_FILES" | tr -d ' ')

if [ "$SRC_FILES" -gt 50 ] && [ "$DESIGN_FILES" -lt 5 ]; then
  echo "⚠ GAP: $SRC_FILES src files, $DESIGN_FILES design docs — run /reverse-document design src/[system]"
fi

# --- Check 2: Prototypes without documentation ---
if [ -d "prototypes" ]; then
  PROTOTYPE_DIRS=$(find prototypes -mindepth 1 -maxdepth 1 -type d 2>/dev/null)

  if [ -n "$PROTOTYPE_DIRS" ]; then
    while IFS= read -r proto_dir; do
      proto_dir=$(echo "$proto_dir" | sed 's|\\|/|g')
      if [ ! -f "${proto_dir}/README.md" ] && [ ! -f "${proto_dir}/CONCEPT.md" ]; then
        proto_name=$(basename "$proto_dir")
        echo "⚠ GAP: prototypes/$proto_name/ sem doc — run /reverse-document concept prototypes/$proto_name"
      fi
    done <<< "$PROTOTYPE_DIRS"
  fi
fi

# --- Check 3: Core systems without architecture docs ---
if [ -d "src/core" ] || [ -d "src/engine" ]; then
  if [ ! -d "docs/architecture" ]; then
    echo "⚠ GAP: src/core ou src/engine existe mas sem docs/architecture/ — run /architecture-decision"
  else
    ADR_COUNT=$(find docs/architecture -type f -name "*.md" 2>/dev/null | wc -l)
    ADR_COUNT=$(echo "$ADR_COUNT" | tr -d ' ')
    if [ "$ADR_COUNT" -lt 3 ]; then
      echo "⚠ GAP: apenas $ADR_COUNT ADR(s) documentados — run /reverse-document architecture src/core/[system]"
    fi
  fi
fi

# --- Check 4: Gameplay systems without design docs ---
if [ -d "src/gameplay" ]; then
  GAMEPLAY_SYSTEMS=$(find src/gameplay -mindepth 1 -maxdepth 1 -type d 2>/dev/null)

  if [ -n "$GAMEPLAY_SYSTEMS" ]; then
    while IFS= read -r system_dir; do
      system_dir=$(echo "$system_dir" | sed 's|\\|/|g')
      system_name=$(basename "$system_dir")
      file_count=$(find "$system_dir" -type f 2>/dev/null | wc -l)
      file_count=$(echo "$file_count" | tr -d ' ')

      if [ "$file_count" -ge 5 ]; then
        design_doc_1="design/gdd/${system_name}-system.md"
        design_doc_2="design/gdd/${system_name}.md"
        if [ ! -f "$design_doc_1" ] && [ ! -f "$design_doc_2" ]; then
          echo "⚠ GAP: src/gameplay/$system_name/ ($file_count files) sem design doc — run /reverse-document design src/gameplay/$system_name"
        fi
      fi
    done <<< "$GAMEPLAY_SYSTEMS"
  fi
fi

# --- Check 5: Production planning ---
if [ "$SRC_FILES" -gt 100 ]; then
  if [ ! -d "production/sprints" ] && [ ! -d "production/milestones" ]; then
    echo "⚠ GAP: $SRC_FILES src files sem production planning — run /sprint-plan"
  fi
fi

exit 0
```

- [ ] **Step 2: Verify silent on this project**

Run: `bash .claude/hooks/detect-gaps.sh`
Expected: zero output (this project has game-concept.md configured and no current gaps). If gaps legitimately exist, one line per gap is correct — that is not a regression.

- [ ] **Step 3: Verify no === lines in output**

Run: `bash .claude/hooks/detect-gaps.sh | grep "==="`
Expected: no output

- [ ] **Step 4: Commit**

```bash
git add .claude/hooks/detect-gaps.sh
git commit -m "chore(context): detect-gaps silencioso por padrão — 1 linha por gap"
```

---

### Task 4: pre-compact.sh — Remove WIP grep, cap state at 30 lines

**Files:**
- Modify: `.claude/hooks/pre-compact.sh`

- [ ] **Step 1: Replace file content**

```bash
#!/bin/bash
# Claude Code PreCompact hook: Dump session state before context compression

set +e

STATE_FILE="production/session-state/active.md"
if [ -f "$STATE_FILE" ]; then
    echo "## Session State ($STATE_FILE)"
    STATE_LINES=$(wc -l < "$STATE_FILE" 2>/dev/null | tr -d ' ')
    if [ "$STATE_LINES" -gt 30 ] 2>/dev/null; then
        head -n 30 "$STATE_FILE"
        echo "... ($STATE_LINES total lines, showing first 30)"
    else
        cat "$STATE_FILE"
    fi
    echo ""
fi

echo "## Git Changes"
CHANGED=$(git diff --name-only 2>/dev/null)
STAGED=$(git diff --staged --name-only 2>/dev/null)
UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null)

if [ -n "$CHANGED" ]; then
    echo "Unstaged:"
    echo "$CHANGED" | while read -r f; do echo "  - $f"; done
fi
if [ -n "$STAGED" ]; then
    echo "Staged:"
    echo "$STAGED" | while read -r f; do echo "  - $f"; done
fi
if [ -n "$UNTRACKED" ]; then
    echo "Untracked:"
    echo "$UNTRACKED" | while read -r f; do echo "  - $f"; done
fi
if [ -z "$CHANGED" ] && [ -z "$STAGED" ] && [ -z "$UNTRACKED" ]; then
    echo "  (no uncommitted changes)"
fi

SESSION_LOG_DIR="production/session-logs"
mkdir -p "$SESSION_LOG_DIR" 2>/dev/null
echo "Context compaction occurred at $(date)." >> "$SESSION_LOG_DIR/compaction-log.txt" 2>/dev/null

echo ""
echo "# Read $STATE_FILE to recover full context"

exit 0
```

- [ ] **Step 2: Verify no grep on design/gdd/**

Run: `grep "design/gdd" .claude/hooks/pre-compact.sh`
Expected: no output

- [ ] **Step 3: Commit**

```bash
git add .claude/hooks/pre-compact.sh
git commit -m "chore(context): pre-compact remove WIP grep e cap de 30 linhas no state"
```

---

### Task 5: validate-commit.sh — Remove decorative header

**Files:**
- Modify: `.claude/hooks/validate-commit.sh`

- [ ] **Step 1: Replace warning output block**

Find (lines 97–99):
```bash
if [ -n "$WARNINGS" ]; then
    echo -e "=== Commit Validation Warnings ===$WARNINGS\n================================" >&2
fi
```

Replace with:
```bash
if [ -n "$WARNINGS" ]; then
    echo -e "$WARNINGS" >&2
fi
```

- [ ] **Step 2: Verify no === in output path**

Run: `grep "===" .claude/hooks/validate-commit.sh`
Expected: no output

- [ ] **Step 3: Commit**

```bash
git add .claude/hooks/validate-commit.sh
git commit -m "chore(context): validate-commit remove header decorativo"
```

---

### Task 6: validate-assets.sh — Remove decorative header

**Files:**
- Modify: `.claude/hooks/validate-assets.sh`

- [ ] **Step 1: Replace warning output block**

Find (lines 54–56):
```bash
if [ -n "$WARNINGS" ]; then
    echo -e "=== Asset Validation ===$WARNINGS\n========================" >&2
fi
```

Replace with:
```bash
if [ -n "$WARNINGS" ]; then
    echo -e "$WARNINGS" >&2
fi
```

- [ ] **Step 2: Verify no === in output path**

Run: `grep "===" .claude/hooks/validate-assets.sh`
Expected: no output

- [ ] **Step 3: Commit**

```bash
git add .claude/hooks/validate-assets.sh
git commit -m "chore(context): validate-assets remove header decorativo"
```

---

### Task 7: validate-push.sh — Shorten push reminder

**Files:**
- Modify: `.claude/hooks/validate-push.sh`

- [ ] **Step 1: Replace the 2-line reminder block**

Find (lines 40–44):
```bash
if [ -n "$MATCHED_BRANCH" ]; then
    echo "Push to protected branch '$MATCHED_BRANCH' detected." >&2
    echo "Reminder: Ensure build passes, unit tests pass, and no S1/S2 bugs exist." >&2
    # Allow the push but warn -- uncomment below to block instead:
    # echo "BLOCKED: Run tests before pushing to $CURRENT_BRANCH" >&2
    # exit 2
fi
```

Replace with:
```bash
if [ -n "$MATCHED_BRANCH" ]; then
    echo "Push to '$MATCHED_BRANCH' — confirme testes passando e sem bugs S1/S2." >&2
    # Uncomment to block instead of warn:
    # echo "BLOCKED: Run tests before pushing to $CURRENT_BRANCH" >&2
    # exit 2
fi
```

- [ ] **Step 2: Verify single-line reminder**

Run: `grep -c "echo.*Push to" .claude/hooks/validate-push.sh`
Expected: `1`

- [ ] **Step 3: Commit**

```bash
git add .claude/hooks/validate-push.sh
git commit -m "chore(context): validate-push consolida reminder em 1 linha"
```

---

### Task 8: context-management.md — Lazy loading section + fix stale ref + remove Compaction Instructions

**Files:**
- Modify: `.claude/docs/context-management.md`

- [ ] **Step 1: Add Lazy Loading section after opening paragraph**

Locate the text anchor: `Context is the most critical resource in a Claude Code session. Manage it actively.`

Insert a blank line after it, then add:

    ## Lazy Loading

    **Docs are not auto-loaded.** When starting a task, consult the Doc Map in `CLAUDE.md`
    and read only the doc relevant to the current work. This keeps the context window
    holding only active working content — not the full project reference library.

- [ ] **Step 2: Fix stale sentence in "Recovery After Session Crash"**

Find (exact text):
```
1. The `session-start.sh` hook will detect and preview `active.md` automatically
```

Replace with:
```
1. The `session-start.sh` hook will emit a single alert line pointing to `active.md` if it exists
```

- [ ] **Step 3: Remove "Compaction Instructions" section (lines 82–98)**

Remove the entire block from `## Compaction Instructions` through the paragraph ending `the conversation history is secondary.`

That is: remove from the line `## Compaction Instructions` (inclusive) through the blank line after `the conversation history is secondary.` (inclusive).

- [ ] **Step 4: Verify lazy loading section exists**

Run: `grep -c "Lazy Loading" .claude/docs/context-management.md`
Expected: `1`

- [ ] **Step 5: Verify stale "preview" sentence is gone**

Run: `grep "preview" .claude/docs/context-management.md`
Expected: no output

- [ ] **Step 6: Verify Compaction Instructions section is gone**

Run: `grep "Compaction Instructions" .claude/docs/context-management.md`
Expected: no output

- [ ] **Step 7: Commit**

```bash
git add .claude/docs/context-management.md
git commit -m "chore(context): context-management alinhado com lazy loading"
```

---

## Final Verification

- [ ] Run all hooks and confirm total output ≤ 5 lines:

```bash
cd /c/Users/leeew/OneDrive/Documentos/Jogos/Fungineer
bash .claude/hooks/session-start.sh
bash .claude/hooks/detect-gaps.sh
```

- [ ] Confirm CLAUDE.md has zero @includes:

```bash
grep "@" CLAUDE.md
```
Expected: no output

- [ ] Confirm no === decorators remain in any hook:

```bash
grep -r "===" .claude/hooks/
```
Expected: no output
