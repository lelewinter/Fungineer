# Cowork → Claude Code Inbox

> Arquivo de comunicação entre Cowork (Claude no desktop) e Claude Code.
> Cowork escreve tarefas aqui. Claude Code detecta e executa automaticamente.

---

## Status
IDLE

## Tarefa
_Nenhuma tarefa pendente._

## Resultado
_Aguardando execução._

---

## Protocolo

**Cowork escreve:**
- `Status: PENDING`
- Descrição da tarefa em `## Tarefa`

**Claude Code faz:**
1. Detecta `Status: PENDING` via hook `UserPromptSubmit`
2. Executa a tarefa
3. Atualiza `Status: DONE`
4. Escreve resultado em `## Resultado`

**Ciclo volta para IDLE** após leitura do resultado.

---

## Histórico
<!-- Claude Code appenda entradas aqui após execução -->
