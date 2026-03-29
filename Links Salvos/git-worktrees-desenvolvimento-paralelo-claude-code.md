---
date: 2026-03-28
tags: [claude-code, git, desenvolvimento, workflow, paralelo]
source: https://x.com/techNmak/status/2037788648691884207
autor: "@techNmak"
tipo: zettelkasten
---

# Git Worktrees Permitem Desenvolvimento Paralelo no Claude Code

## Resumo

Git Worktrees é ferramenta Git nativa que permite trabalhar em múltiplos branches simultaneamente em diferentes diretórios sem fazer checkout repetido. No contexto de Claude Code, permite que múltiplas sessões trabalhem em paralelo em diferentes features ou branches do mesmo projeto. É como ter clones do seu repositório em diferentes mesas — cada Claude trabalha em sua própria versão sem interferir na outra, depois você junta tudo.

## Explicação

Com Git Worktrees você consegue: executar múltiplas sessões do Claude Code em paralelo, cada sessão em um branch diferente, sincronizar mudanças facilmente, evitar conflitos de contexto.

**Analogia:** Sem worktrees: você trabalha em feature A, precisa verificar algo em main, faz `git checkout main` (perde contexto de feature A, Claude "esquece" o que estava fazendo), verifica, volta pra feature A, passa 5 minutos re-contextualizando Claude. Com worktrees: você tem dois diretórios lado a lado. Uma Claude trabalha em feature A na pasta `project-feature-a/`, outra Claude trabalha em main na pasta `project-main/`. Elas não interferem, contexto não é perdido, trabalho real é feito em paralelo.

Em vez de fazer checkout repetido (que perde contexto), você cria worktrees onde cada worktree é um diretório separado apontando para o mesmo repositório, permitindo trabalho paralelo real.

**Profundidade:** Por que isso importa? Porque com worktrees você não está alternando contexto — você está rodando contextos paralelos. Uma pessoa, dois Claudes, dois projetos diferentes simultâneos. Isso não é melhor que sequential — é multiplicador de produtividade. Trabalho que levaria 4 horas sequencial (feature A depois feature B) leva 2 horas paralelo.

## Exemplos

Implementação básica:

```bash
git worktree add ../feature-branch
```

Isso cria um novo diretório que você pode usar com uma sessão de Claude Code diferente enquanto mantém outra sessão trabalhando em outro branch.

## Relacionado

- [[Claude Peers Multiplas Instancias Coordenadas]]
- [[plan-mode-claude-code-previne-execucao-prematura]]
- [[loop-agenda-tarefas-recorrentes-ate-3-dias]]

## Perguntas de Revisão

1. Como git worktrees permitem múltiplas Claudes trabalharem em paralelo sem conflito?
2. Por que worktrees é melhor que checkout repetido?
3. Qual é a infraestrutura Git necessária para desenvolvimento paralelo coordenado?
