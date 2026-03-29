---
tags: [game-dev, animação, design, princípios-disney, game-feel]
source: https://www.linkedin.com/feed/update/urn:li:activity:7441800955865759745/
date: 2026-03-28
autor: "Sergei Vasiuk"
---

# Os 12 Princípios de Animação Disney Funcionam em Games, Mas com Lógica Diferente

## Resumo
Em filmes, animação serve um diretor. Em games, ela serve o jogador. Esse deslocamento de centro muda como cada princípio é aplicado.

## Explicação
Os 12 princípios de animação (squash & stretch, anticipation, timing etc.) foram criados para animação linear — onde um diretor controla cada frame. Em games, a câmera roda em tempo real, o personagem reage ao input imprevisível do jogador, e a animação precisa funcionar em qualquer estado.

**Analogia:** Em um filme, a animação é como uma música gravada — o compositor controla tudo. Em um game, é como um músico de jazz improvisando — precisa reagir ao que acontece na hora.

O que muda na prática:
- **Anticipation** ainda existe, mas não pode bloquear o input do jogador por muito tempo
- **Timing** deixa de ser fixo e precisa se adaptar a velocidades de movimento variáveis
- **Follow through** precisa ser interrompível sem quebrar a leitura visual
- **Secondary action** pode conflitar com animações de estado (idle, run, attack) e precisa ser gerenciado por camadas

A animação deixa de ser *apresentação* e passa a ser *interação*. O objetivo não é "parece bom" isolado — é "dá feedback claro ao jogador sobre o estado do jogo".

## Exemplos
- Coyote time em plataformers (Hollow Knight, Celeste): aplica anticipation estendida para tornar o timing de pulo mais tolerante
- Hit reactions em action games: squash & stretch de impacto precisa ser curto o suficiente para não atrasar a cadência de ataques
- Blend trees em Unity/Unreal: a solução técnica para gerenciar os princípios dentro de um sistema de estados

## Relacionado
- [[ferramentas-prototipagem-game-designers-sem-codigo]]
- [[10-youtube-gems-solo-game-devs]]

## Perguntas de Revisão
1. Por que anticipation longa pode ser problemática em games de ação?
2. Como o conceito de "game feel" se conecta com os princípios de animação?
3. O que muda no workflow de um animador quando ele passa de filmes para games?
