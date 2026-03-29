---
date: 2026-03-12
tags: [Claude Code, plan mode, CLAUDE.md, self-improvement, agentes IA, bug fixing, verificação]
source: https://x.com/Suryanshti777/status/2031983605044691454
autor: "Suryansh Tiwari / Boris Cherny"
tipo: zettelkasten
---

# CLAUDE.md Template — Sistema de Auto-Melhoria Contínua para Agentes Claude

## Resumo

O criador do Claude Code, Boris Cherny, revelou o sistema interno que Anthropic usa para treinar agentes a melhorarem automaticamente: um único arquivo CLAUDE.md no raiz do projeto contém convenções, regras, erros passados, e o agent Claude lê esse arquivo a cada sessão. Como um manual que se reescreve a cada correção, o sistema captura permanentemente cada bug como uma regra — gerando melhoria sem toque no código.

## Explicação

O CLAUDE.md é um arquivo de configuração vivo que documenta:

**1. Plan Mode (Modo Plano) — Default**
- Ativa plan mode para qualquer tarefa não trivial (3+ passos ou decisões arquiteturais)
- Se algo der errado, STOP e re-planeje imediatamente — não continue empurrando
- Use plan mode para etapas de verificação, não apenas construção
- Escreva specs detalhadas upfront para reduzir ambiguidade

**2. Subagent Strategy (Estratégia de Subagentes)**
- Use subagentes frequentemente para manter a janela de contexto principal limpa
- Delegue pesquisa, exploração e análise paralela para subagentes
- Para problemas complexos, lance mais compute via subagentes
- Atribua uma tarefa por subagente para execução focada

**3. Self-Improvement Loop (Loop de Auto-Melhoria)**
- Após qualquer correção do usuário, atualize tasks/lessons.md com o padrão
- Escreva regras para si mesmo para prevenir repetição do mesmo erro
- Itere brutalmente sobre essas lições até a taxa de erro cair
- Revise lições no início de cada sessão

**4. Verification (Verificação) — Antes de Concluído**
- Nunca marque uma tarefa como completa sem provar que funciona
- Diff comportamento entre main e suas mudanças quando relevante
- Pergunte a si mesmo: "Um senior engineer aprovaria isto?"
- Execute testes, verifique logs, demonstre correção

**5. Demand Elegance (Exigir Elegância) — Balanceado**
- Para mudanças não triviais, pergunte: "Existe uma solução mais elegante?"
- Se um fix parece hacky, pergunte: "Sabendo tudo que sei agora, implemente a solução elegante"
- Pule para fixes simples — não sobre-engenharia
- Questione seu próprio trabalho antes de apresentar

**6. Autonomous Bug Fixing (Bug Fixing Autônomo)**
- Quando dado um bug report: apenas conserte
- Use logs, erros, e testes falhos para diagnosticar
- Requer zero context switching do usuário
- Conserte testes CI falhando automaticamente

**Task Management (Gerenciamento de Tarefas)**
1. Plan First — Escreva o plano em tasks/todo.md com itens verificáveis
2. Verify Plan — Confirme o plano antes de implementação
3. Track Progress — Marque itens completos conforme progride
4. Explain Changes — Forneça um resumo de alto nível a cada passo
5. Document Results — Adicione uma seção de review ao tasks/todo.md
6. Capture Lessons — Atualize tasks/lessons.md após correções

**Core Principles (Princípios Centrais)**
- Simplicity First: Faça cada mudança tão simples quanto possível e minimize impacto de código
- No Laziness: Encontre raízes causais. Evite fixes temporários. Mantenha padrões de engenharia senior-level

## Exemplos

Exemplo de estrutura CLAUDE.md:
```
# CLAUDE.md - Configuração do Agente

## Convenções do Projeto
- Use funcionalidades X, Y ao invés de Z
- Sempre valide entrada antes de processar
- Logs devem incluir timestamp e contexto

## Erros Passados & Regras
- Erro: Não verificava se arquivo existia antes de ler
  Regra: SEMPRE use try-catch ao acessar filesystem

## Plan Mode Obrigatório
- 3+ passos = ativa plan mode
- Pare e replaneie se falhar

## Tasks/Lessons
- Evitar hardcoding de IDs
- Refatorar antes de escalar
```

Exemplo de uso: Boris Cherny usa isso internamente na Anthropic todos os dias, capturando automaticamente cada bug como uma regra permanente.

## Relacionado

[[Claude Code - Melhores Práticas]]
[[plan-mode-claude-code-previne-execucao-prematura]]
[[Claude Code Subconscious Letta Memory Layer]]

## Perguntas de Revisão

1. Como o CLAUDE.md funciona como um "manual vivo" que se melhora a cada correção?
2. Qual é a diferença entre usar plan mode apenas para construção versus para verificação também?
3. Como a estratégia de subagentes mantém a janela de contexto principal limpa enquanto resolve problemas complexos?
