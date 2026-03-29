---
date: 2026-03-28
tags: [claude-code, automacao, tarefas, agendamento, workflow]
source: https://x.com/techNmak/status/2037788648691884207
autor: "@techNmak"
tipo: zettelkasten
---

# /loop Agenda Tarefas Recorrentes por até 3 Dias

## Resumo

Comando `/loop` no Claude Code permite agendar tarefas recorrentes que rodam automaticamente por período de até 3 dias. Útil para tarefas que precisam ser executadas repetidamente em padrão específico sem intervenção manual. É como um cron job portátil que não requer configuração — descreve o padrão, Claude roda até 3 dias.

## Explicação

Comando é limitado a: máximo de 3 dias de execução contínua, padrões de recorrência predefinidos, requer tarefa bem-estruturada. Depois de 3 dias, tarefa precisa ser rearranjada ou executada manualmente novamente.

**Analogia:** Sem /loop você era "gerenciador manual de tarefas" — "lembrar de fazer, depois fazer, depois lembrar novamente". Com /loop é como contratar assistente que "faz isso pra você 3 dias diretos, depois você recebe relatório".

**Profundidade:** Por que 3 dias é limite? Provavelmente é tradeoff entre utilidade (3 dias já cobre "teste repetido", "monitor por 72h") e segurança (impede tarefas longas de rodar sem human-in-the-loop). Design conservador que faz sentido.

## Exemplos

Casos de uso incluem: roda automaticamente testes periodicamente, monitora e corrige issues em tempo real, executa tarefas de manutenção regular, padrões de repetição controlada.

## Relacionado

- [[plan-mode-claude-code-previne-execucao-prematura]]
- [[git-worktrees-desenvolvimento-paralelo-claude-code]]

## Perguntas de Revisão

1. Por que /loop com limite de 3 dias é mais seguro que /loop ilimitado?
2. Como agendamento de tarefas recorrentes muda do "manual" para "automático"?
3. Qual é o caso de uso: testes repetidos, monitoramento, ou manutenção?
