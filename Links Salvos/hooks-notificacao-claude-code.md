---
date: 2026-03-28
tags: [claude-code, configuração, hooks, notificações, automação]
source: https://www.linkedin.com/posts/vilson-ranijak-932041211_essa-semana-pedi-pro-claude-code-executar-share-7442211445062320128-wKJw
autor: "@vilson-ranijak"
tipo: zettelkasten
---

# Hooks de Notificação no Claude Code Avisam Quando Ação é Necessária

## Resumo

Configure hooks no arquivo ~/.claude/settings.json para ser notificado automaticamente quando Claude Code conclui tarefas, pede permissão, ou quer sua atenção. Com múltiplas sessões paralelas, diferentes sons criam feedback auditivo distinto para cada tipo de evento, eliminando necessidade de monitorar a tela constantemente. É como ter "alarmes inteligentes" — você não vê tela, mas quando algo importante acontece, você ouve e sabe exatamente o que é só pelo som.

## Explicação

**Analogia:** Dois Claudes rodando em paralelo é como ter dois colega em mesas diferentes — sem notificação, você verifica cada um a cada 5 minutos (waste). Com hooks diferentes, é como cada um vir te chamar por você (Hero = "terminei!", Ping = "preciso de sim/não", Glass = "ajuda agora!"). Você já sabe o que fazer quando ouve o som.

### Hook de Notificação quando Claude Code Conclui Tarefa

Dispara notificação sonora e visual quando Claude termina uma tarefa. Som recomendado é Hero — som de vitória e celebração que indica sucesso. Permite trabalhar em outros contextos enquanto claudeCode trabalha em background, recebendo alerta imediato quando pronto.

### Hook de Notificação quando Claude Code Pede Permissão

Notifica quando Claude Code está esperando sua permissão para executar uma ação. Som recomendado é Ping — som simples e direto que diferencia permissão. Essencial em workflows onde múltiplas sessões rodam em paralelo: você identifica qual sessão precisa aprovação apenas ouvindo o som.

### Hook de Notificação quando Claude Code Quer Sua Atenção

Alerta quando Claude parou e está aguardando input ou feedback. Som recomendado é Glass — som de alerta claro e distinto. Casos de uso incluem: Claude encontrou ambiguidade e quer clarificação, múltiplas opções onde quer sua preferência, ou parou em ponto de decisão.

### Trio de Sons para Diferentes Situações

- **Hero**: conclusão de tarefa (sucesso)
- **Glass**: atenção necessária (alerta, aguardando input)
- **Ping**: permissão solicitada (ação)

**Profundidade:** Por que som é melhor que tela? Porque você já está olhando pra tela o tempo todo (email, browser, IDE). Adicionar mais alerts visuais é "noise em noise". Som corta através — você ouve mesmo que não esteja olhando, e diferentes frequências são processadas automaticamente pelo cérebro (Hero, Ping, Glass ativam circuitos diferentes).

Cada som cria padrão auditivo distinto, permitindo resposta imediata sem olhar para tela.

## Exemplos

### Configuração Hook de Conclusão (macOS)

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "osascript -e 'display notification \"Tarefa concluída!\" with title \"Claude Code\"' && afplay /System/Library/Sounds/Hero.aiff"
          }
        ]
      }
    ]
  }
}
```

### Configuração Hook de Permissão (macOS)

```json
{
  "hooks": {
    "PermissionRequest": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "osascript -e 'display notification \"Esperando sua permissão!\" with title \"Claude Code\"' && afplay /System/Library/Sounds/Ping.aiff"
          }
        ]
      }
    ]
  }
}
```

### Configuração Hook de Atenção (macOS)

```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "osascript -e 'display notification \"Preciso da sua atenção!\" with title \"Claude Code\"' && afplay /System/Library/Sounds/Glass.aiff"
          }
        ]
      }
    ]
  }
}
```

### Configuração Completa com Todos os Três Hooks

Arquivo ~/.claude/settings.json:

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "osascript -e 'display notification \"Tarefa concluída!\" with title \"Claude Code\"' && afplay /System/Library/Sounds/Hero.aiff"
          }
        ]
      }
    ],
    "PermissionRequest": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "osascript -e 'display notification \"Esperando sua permissão!\" with title \"Claude Code\"' && afplay /System/Library/Sounds/Ping.aiff"
          }
        ]
      }
    ],
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "osascript -e 'display notification \"Preciso da sua atenção!\" with title \"Claude Code\"' && afplay /System/Library/Sounds/Glass.aiff"
          }
        ]
      }
    ]
  }
}
```

## Relacionado

- [[Claude Code - Melhores Práticas]]
- [[Otimizar Preferencias Claude Chief of Staff]]
- [[btw-conversas-paralelas-enquanto-claude-trabalha]]

## Perguntas de Revisão

1. Qual é a importância de diferentes sons de notificação para múltiplas sessões Claude em paralelo?
2. Como os três tipos de hooks (conclusão, permissão, atenção) suportam produtividade?
3. Por que notificações sonoras são melhores que visuais quando você está trabalhando em outros contextos?
