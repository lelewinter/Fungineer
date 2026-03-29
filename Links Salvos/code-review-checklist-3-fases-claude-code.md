---
date: 2026-03-12
tags: [code review, Claude Code, checklist, qualidade, bugs, segurança, performance, 3 fases]
source: https://x.com/adriano_viana/status/2032074818783256668
autor: "Adriano Viana"
tipo: zettelkasten
---

# Code Review Checklist com 3 Fases — Encontre 11 Bugs Críticos Antes da Produção

## Resumo

Adriano Viana criou uma metodologia de code review estruturada com Claude Code que não depende de testes automatizados, mas sim de análise sistemática em 3 fases. Antes, bugs passavam para produção regularmente; depois, reduziram drasticamente — como um filtro humano-IA que questiona intenção, lógica e segurança simultaneamente.

## Explicação

**O Problema com Code Review Tradicional:**
- "Parece ok, aprova aí" — reviews superficiais
- Bugs frequentes em produção
- Retrabalho: 2-3h por semana

**A Solução: Metodologia de 3 Fases para Code Review**

Cada fase tem um prompt específico no Claude Code:

**FASE 1: Estrutura — "O código faz o que deveria?"**
```
Revise este código em 3 PADEs:
1. Estrutura: O código faz exatamente o que deveria?
2. Nomes de variáveis são claros e descritivos?
3. Existe duplicação desnecessária?

Cite cada problema encontrado com linha e sugestão de correção.
```

Verifica:
- Se o código resolve o problema declarado
- Se nomes são legíveis
- Se há repetição desnecessária

**FASE 2: Lógica e Casos Extremos — "Os casos extremos estão cobertos?"**
```
FASE 2 – LÓGICA:
1. Que margens com input vazio ou null?
2. Existe tratamento de erros adequado?
3. Existe tratamento de erro adequado?
4. Como funciona se os valores tiverem formatos diferentes?
5. Valores estão sendo desnormalizados correlacionados?

Para cada caso extremo não tratado: mostre o cenário e o impacto.
```

Verifica:
- Entradas vazias, nulas ou mal formadas
- Tratamento de erros
- Valores correlacionados ou dependentes
- Casos de uso não óbvios

**FASE 3: Segurança — "Existe alguma vulnerabilidade?"**
```
FASE 3 – SEGURANÇA:
1. Existe risco de SQL injection?
2. Input do usuário está sendo sanitizado?
3. Existe tratamento de erros adequado?
4. Senha estão protegidas em logs?
5. Permissões estão sendo verificadas antes de operações?

Para cada vulnerabilidade: classifique como CRÍTICA, ALTA ou MÉDIA.
```

Verifica:
- SQL injection
- XSS
- Sanitização de entrada
- Exposição de dados sensíveis (senhas em logs)
- Verificação de permissões
- CSRF, escalação de privilégio

**Resultados Mensuráveis:**
- ANTES: Bugs passam para produção, retrabalho frequente
- DEPOIS: Bugs em produção caíram drasticamente, retrabalho quase zero

## Exemplos

Exemplos concretos de prompts para Claude Code:

**Estrutura (Fase 1):**
```
Revise este código em 3 PADEs:
1. Estrutura: O código faz exatamente o que deveria?
2. Nomes de variáveis são claros e descritivos?
3. Existe duplicação desnecessária?

[CÓDIGO AQUI]

Cite cada problema encontrado com linha e sugestão de correção.
```

**Lógica (Fase 2):**
```
FASE 2 – LÓGICA:
1. Que margens com input vazio ou null?
2. Existe tratamento de erros adequado?
3. Como funciona se os valores tiverem formatos diferentes?

[CÓDIGO AQUI]

Para cada caso extremo: mostre o cenário e o impacto.
```

**Segurança (Fase 3):**
```
FASE 3 – SEGURANÇA:
1. Existe risco de SQL injection?
2. Input do usuário está sendo sanitizado?
3. Permissões estão sendo verificadas?

[CÓDIGO AQUI]

Para cada vulnerabilidade: classifique como CRÍTICA, ALTA ou MÉDIA.
```

## Relacionado

[[Claude Code - Melhores Práticas]]
[[plan-mode-claude-code-previne-execucao-prematura]]
[[CLAUDE-md-template-plan-mode-self-improvement]]

## Perguntas de Revisão

1. Por que separar code review em 3 fases distintas ao invés de uma análise integrada?
2. Qual fase detecta a maioria dos 11 bugs críticos que Adriano encontrou?
3. Como você estruturaria o prompt de "Segurança" para uma aplicação de e-commerce com processamento de pagamentos?
