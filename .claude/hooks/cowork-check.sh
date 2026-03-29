#!/bin/bash
# Cowork → Claude Code bridge hook (UserPromptSubmit)
#
# Checks production/cowork-inbox.md for pending tasks from Cowork.
# If a PENDING task is found, injects it into the Claude Code prompt context
# so Claude Code handles it automatically — no user relay needed.
#
# Input: JSON via stdin (user prompt info — not used here)
# Output: Plain text injected into Claude Code's context

INBOX="production/cowork-inbox.md"

# Nothing to do if inbox doesn't exist
if [ ! -f "$INBOX" ]; then
    exit 0
fi

# Read status line
STATUS=$(awk '/^## Status/{found=1; next} found{print; exit}' "$INBOX" | tr -d '[:space:]')

if [ "$STATUS" = "PENDING" ]; then
    # Extract task section
    TASK=$(awk '/^## Tarefa/{found=1; next} found && /^## /{exit} found{print}' "$INBOX")

    echo ""
    echo "╔══════════════════════════════════════════════╗"
    echo "║          COWORK TASK — AÇÃO REQUERIDA        ║"
    echo "╚══════════════════════════════════════════════╝"
    echo ""
    echo "Cowork (Claude no desktop) deixou uma tarefa pendente:"
    echo ""
    echo "$TASK"
    echo ""
    echo "────────────────────────────────────────────────"
    echo "Instruções:"
    echo "1. Execute a tarefa acima completamente"
    echo "2. Após concluir, atualize production/cowork-inbox.md:"
    echo "   - Status: DONE"
    echo "   - Resultado: [descreva o que foi feito]"
    echo "   - Appenda ao Histórico com data e resumo"
    echo "────────────────────────────────────────────────"
    echo ""
fi

exit 0
