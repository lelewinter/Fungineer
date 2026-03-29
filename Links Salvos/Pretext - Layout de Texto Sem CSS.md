---
date: 2026-03-28
tags: [frontend, css, typescript, ia, desenvolvimento, open-source]
source: https://x.com/namcios/status/2037956753812328761
autor: "@namcios / Cheng Lou"
---

# Pretext - Layout de Texto Sem CSS

## Resumo

Biblioteca TypeScript de Cheng Lou (criador do React, ReasonML, ex-Messenger e Midjourney) que faz layout de texto sem CSS e sem tocar no DOM. Pura aritmética com zero reflows, aproximadamente 500x mais rápido que método tradicional, suporta CJK, árabe RTL, emojis e clusters de grafemas. É como descobrir que você pode calcular mecânica quântica no papel em vez de rodar simulação em supercomputador — mesma resposta, 500x mais rápido, zero energia gasta.

## Explicação

CSS foi projetado há 30 anos para documentos estáticos. Toda vez que um app precisa saber altura de um texto, o browser congela a thread principal por dezenas de milissegundos. Chat bubbles, dashboards responsivos, layouts de revista estão todos reféns de uma pipeline de 1996. Pretext elimina esse problema através de aritmética pura sem reflows.

**Analogia:** CSS é como chamar alguém em outra sala "ei, qual é a altura desse texto em pixels?" — pessoa tem que parar o que está fazendo, ir medir, voltar e responder. Isso leva tempo. Pretext é como saber de antemão: "texto Arial 12px com 80 caracteres tem sempre essa altura" — você sabe sem perguntar, respostas instantâneas.

Foi construído usando Claude Code e Codex: Cheng Lou alimentou a IA com o ground truth do browser e mandou iterar até convergir na precisão. Um dos melhores engenheiros de front-end do mundo usando IA para resolver um problema que ninguém resolveu em 30 anos.

**Profundidade:** Por que isso importa tanto? Porque performance em front-end virou gargalo silencioso — usuários veem aplicações "lentas" sem saber que é CSS layout stopping browser 500x por segundo. Pretext muda a economia de custo: layout que custava $1000 em processamento agora custa $2 em aritmética.

Características técnicas: aproximadamente 500x mais rápido que método tradicional, apenas poucos KBs em tamanho, suporta CJK (caracteres chineses, japoneses, coreanos), árabe RTL (right-to-left), emojis, clusters de grafemas.

## Exemplos

Não há exemplos técnicos específicos documentados na fonte original. Implementação típica envolve usar aritmética pura para calcular layout de texto sem acessar DOM ou CSS do browser.

## Relacionado

- [[Google Stitch vs Claude Prompts Websites Animados]]
- [[desafio_engenharia_performance_anthropic]]
- [[Micro-Handpose WebGPU Hand Tracking Browser]]
- [[Claude Code - Melhores Práticas]]

## Perguntas de Revisão

1. Por que problema de 30 anos (CSS layout) foi resolvido por aritmética pura?
2. Como 500x speedup de performance muda viabilidade de casos de uso?
3. Qual é o padrão: problemas "impossíveis" no paradigma antigo resolvidos em novo?
