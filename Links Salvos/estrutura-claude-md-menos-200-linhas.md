---
date: 2026-03-28
tags: [claude-code, claude.md, configuracao, prompt-engineering, setup]
source: https://x.com/techNmak/status/2037788648691884207
autor: "@techNmak"
tipo: zettelkasten
---

# CLAUDE.md Deve Ter Menos de 200 Linhas para Claude Seguir Corretamente

## Resumo

Quando arquivo CLAUDE.md (instruções de contexto) excede 200 linhas, Claude tende a ignorar partes ou seguir instruções de forma incompleta. Manter arquivo compacto garante que todas instruções sejam lidas e seguidas corretamente. É como dar uma lista de tarefas — 5 tarefas sua mãe lê todas, 50 tarefas ela lê apenas as primeiras 5.

## Explicação

Quando CLAUDE.md ultrapassa 200 linhas: atenção do modelo se dilui com instruções longas, instruções competem por atenção de contexto, instruções ambíguas aparecem em documentos longos, consolidação força clareza.

**Analogia:** Mente humana tem limite de "span de atenção para instruções". Você consegue seguir 5 regras — "seja breve, cite fontes, pense em contrargumentos, revise antes de enviar, use português PT-BR". Você consegue lembrar disso. 50 regras? Vai lembrar dos primeiros 5 e esquecer do resto. Claude é semelhante — tem orçamento de atenção, 200 linhas é aproximadamente quanto ele consegue processar completamente.

Como reduzir para 200 linhas: remova redundância (várias regras dizendo a mesma coisa), agrupe por tema (combine regras relacionadas), use abstração ("Siga padrões estabelecidos" em vez de detalhar todos), priorize (mantenha apenas as mais críticas).

**Profundidade:** Por que menos é mais em configuração? Porque cada linha que você adiciona custa atenção. Você pensa "estou adicionando instrução útil" mas na verdade está diluindo outras instruções. Efeito: mais regras = menos conformidade geral. Contra-intuitivo, mas matemático.

## Exemplos

Implementação envolve aplicar princípio de "subtração" da simplificação de setup: questione cada linha, "Essa regra já está no modelo padrão?", "Isso realmente muda comportamento?".

## Relacionado

- [[Simplificar Setup Claude Deletar Regras Extras]]
- [[Otimizar Preferencias Claude Chief of Staff]]
