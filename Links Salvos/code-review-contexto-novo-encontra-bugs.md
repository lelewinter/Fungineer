---
date: 2026-03-28
tags: [claude-code, code-review, qualidade, debugging, contexto]
source: https://x.com/techNmak/status/2037788648691884207
autor: "@techNmak"
tipo: zettelkasten
---

# Code Review com Janelas de Contexto Novas Encontra Bugs

## Resumo

Code review feito por segunda instância do Claude com contexto fresco encontra bugs que agente original perdeu. Quando você pede a nova sessão de Claude para revisar código, essa sessão não carrega vieses ou suposições da sessão original, resultando em encontro de problemas que foram missed. É como pedir para dois desenvolvedores revisarem o mesmo código — o segundo sempre encontra bugs que o primeiro perdeu, porque não tem as "cegueiras" do criador.

## Explicação

Nova instância não tem as mesmas "cegueiras" que criador original, contexto fresco permite análise com outros olhos, diferentes padrões de busca por bugs, verificação independente. Essa estratégia encontra 10-30% mais bugs em média.

**Analogia:** Quando você escreve, seus olhos "corrigem automaticamente" para o que você quis dizer, não para o que realmente escreveu. Alguém lendo pela primeira vez vê exatamente o que está escrito. Mesmo com Claude: a sessão original que criou o código "assume que funciona" (sua hipótese virou parte do contexto). Nova sessão não tem essa hipótese — lê o código com ceticismo, testando cada assumptions.

**Profundidade:** Por que 10-30% mais bugs? Porque a segunda sessão faz perguntas que a primeira não faz: "por que essa variável existe?", "e se esse valor for null?", "esse loop sempre termina?". A primeira sessão sabe respostas porque as decidiu durante criação. A segunda não sabe, então verifica. Isso é poderoso: não é que o código fica melhor, é que você descobre problemas ANTES que usuário encontre em produção.

## Exemplos

Implementação prática: após completar código ou feature, crie uma nova sessão do Claude Code, forneça apenas o código e requisitos, peça revisão detalhada, compare com sessão original.

## Relacionado

- [[plan-mode-claude-code-previne-execucao-prematura]]
- [[git-worktrees-desenvolvimento-paralelo-claude-code]]

## Perguntas de Revisão

1. Por que nova sessão de Claude encontra bugs que original perdeu?
2. Como "cegueiras" do criador original limitam qualidade de revisão?
3. Qual é a melhoria percentual típica em taxa de bug detection com segunda instância?
