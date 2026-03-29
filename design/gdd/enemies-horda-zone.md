---
tags: [fungineer, game-design, gdd]
date: 2026-03-22
tipo: game-design-doc
---

# Inimigos — Zona Hordas

**Version**: 1.0
**Date**: 2026-03-22
**Status**: Draft — Referência Visual Aprovada

---

## Direção de Arte — Linguagem Visual dos Inimigos

**Referência primária**: Machinarium (Amanita Design)

Todos os inimigos são **robôs de sucata** montados de lixo industrial. Função comunicada pela forma do corpo antes de qualquer outra coisa.

**Linguagem visual compartilhada**:
- Corpos de **formas geométricas simples empilhadas**: cilindros, esferas, caixas, tubos
- **Olhos grandes e expressivos** — comunicam estado de IA (calmo, alertado, em fúria)
- **Parafusos, rebites e juntas visíveis** em todas as articulações
- **Cor-âncora de metal** por tipo — identificação à distância
- **Grau de ferrugem**: comuns são mais enferrujados; elite são mais polidos
- Fumaça, vapor, chiados como linguagem de estado (danificado, sobrecarregado)

---

## Contexto Narrativo — O que é CLEAN

- **CLEAN** = City Logistics and Environmental Action Network — sistema de limpeza urbana do Projeto Olímpio
- Frotas de CLEAN são os inimigos da Zona Hordas — executando protocolos de limpeza, não combate
- "Matéria orgânica não categorizada em espaço designado" ativa protocolos de remoção; humanos ativam esse critério
- A ferrugem é real: 18 meses sem manutenção. Comportamentos erráticos = degradação de sistema
- **Sentinel Core (Boss)**: servidor de coordenação de frotas — cor preto + verde-IA conecta visualmente com Zona Stealth (ARGOS e CLEAN compartilham infraestrutura de CORE)
- **Sucata Metálica coletada**: literalmente materiais dos robôs de CLEAN destruídos e componentes que as frotas processavam

---

## Inimigos Base (Ondas 1–2)

### Runner — "Lata-Veloz"

**Cor-âncora**: Laranja-enferrujado (#C4622D)

**Silhueta**: Corpo minúsculo de lata de conserva, duas pernas compridas e finas de arame, cabeça é uma lâmpada velha (brilha âmbar quando ativo). Sem braços. Corre inclinado para frente, quase caindo. Olho único = a lâmpada; detecta jogador com chiado de pressão.

| Atributo | Valor |
|---|---|
| HP | 30 |
| Velocidade | 130 px/s |
| Dano de contato | 5 |
| Comportamento | Carga direta ao membro mais próximo do squad |

- Spawna em grupos de 4–8; principal inimigo de aprendizado — muitos, rápidos, mas frágeis

---

### Bruiser — "Barril"

**Cor-âncora**: Cinza-chumbo (#5A5A6E) com detalhes âmbar nos rebites

**Silhueta**: Torso de barril industrial, braços curtos como pistons hidráulicos, pernas cilíndricas curtas. Cabeça pequena demais para o corpo, dois olhos vermelhos. Emite vapor branco ao sofrer dano. Abaixo de 30% HP: olhos piscam acelerado, velocidade aumenta ligeiramente (modo fúria).

| Atributo | Valor |
|---|---|
| HP | 150 |
| Velocidade | 60 px/s (lento) |
| Dano de contato | 25 |
| Comportamento | Mira no Guardian ou aliado com mais HP |

- Sempre individual ou em pares — decisão: kitar ou absorver com Guardian

---

### Spitter — "Canudo"

**Cor-âncora**: Verde-oxidado (#4A7C59) — único sem tom enferrujado, sinaliza diferença

**Silhueta**: Corpo fino como garrafa térmica, três pernas de tripé. Cano longo apontado para frente = parte do corpo. Cabeça: mini-esfera com olho de câmera giratório. Quando em range ideal, pernas se fixam no chão.

| Atributo | Valor |
|---|---|
| HP | 60 |
| Velocidade | 40 px/s |
| Dano por projétil | 12 |
| Range | 120px |
| Comportamento | Mantém distância ideal; recua se jogador entra no range |

- Aparece na borda da arena — força o jogador a sair de posição confortável

---

## Inimigos de Elite (Pós-wave 2 / versões difíceis)

### Crawler — "Centopeia"

**Cor-âncora**: Bronze-envelhecido (#8C6B3E) com juntas de cobre brilhante

**Silhueta**: Corpo segmentado (5–7 módulos cilíndricos), movimento ondulatório rastejante. Cabeça: dois olhos de câmera laterais vermelhos e mandíbula mecânica. Segmentos individuais tremetem ao tomar dano. Segmento destruído fica no chão como obstáculo.

**Habilidade especial**: Squad parado por > 1s → Crawler **enfia no chão** e reaparece sob o jogador (telegrafado por sombra 0.8s antes).

| Atributo | Valor |
|---|---|
| HP | 90 (por segmento: 18) |
| Velocidade | 130 px/s |
| Dano de mordida | 20 |
| Habilidade | Mergulho subterrâneo telegrafado |

- Força movimento contínuo — Siege Mode fica arriscado com Crawlers presentes

---

### Shielder — "Escudo"

**Cor-âncora**: Prata-polido (#A8A8B8) — o mais limpo e novo entre os inimigos

**Silhueta**: Torso de escudo de sinalização reenformado como armadura, braços sempre cruzados na frente, olho único no centro. Olho azul = defendendo; olho vermelho = virado de costas (vulnerável).

**Habilidade especial**: **Escudo frontal** — 90% menos dano de projéteis pela frente. Penetrável por trás ou laterais. Fica vulnerável ao rastrear múltiplos alvos.

| Atributo | Valor |
|---|---|
| HP | 120 |
| Velocidade | 80 px/s |
| Dano | 18 |
| Redução de dano (frontal) | 90% |

- Cria necessidade de posicionamento angular — squad precisa flanquear ou se dividir

---

### Bomber — "Pinguim"

**Cor-âncora**: Preto-fosco (#2A2A2A) com detalhes laranja-néon (#FF6B35)

**Silhueta**: Corpo bojudo de pinguim, barriga com janela de vidro onde bombas internas são visíveis (esferas vermelhas pulsando). Olhos: câmeras rectangulares que piscam laranja. Anda devagar e parece inofensivo. Ao entrar em modo de ataque, barriga pisca acelerado com som de tictac.

**Habilidade especial**: **Auto-detonação** — ao chegar perto do squad OU ao ser morto (delay 1s), explode em AoE 80px.

| Atributo | Valor |
|---|---|
| HP | 45 (frágil intencionalmente) |
| Velocidade | 90 px/s |
| Dano de explosão | 40 (AoE 80px) |
| Dano de contato | 0 |
| Timer de detonação ao morrer | 1.0s |

- Dilema: eliminar causa explosão; ignorar é pior. AoE da Artificer pode detonar prematuramente.

---

### Sniper — "Tripé Longo"

**Cor-âncora**: Azul-aço (#3A5A7C) com lente de mira laranja-âmbar brilhante

**Silhueta**: Corpo ultra-fino e alto como tripé de 4 pernas. Cabeça = luneta giratória enorme. Cano longo e fino visível como parte do corpo. Nunca se move enquanto está mirando. Raio laser vermelho fino telegrafado 1.5s antes do disparo.

**Habilidade especial**: **Tiro carregado** — perfura escudos e personagens em linha reta. 45 dano ao primeiro, 25 ao segundo na mesma linha.

| Atributo | Valor |
|---|---|
| HP | 50 (frágil) |
| Velocidade | 0 (nunca se move) |
| Dano por tiro | 45 (primeiro alvo), 25 (segundo) |
| Delay de telegraf | 1.5s |
| Cooldown entre tiros | 4.0s |

- Força movimento constante — Siege Mode é diretamente arriscado

---

## Boss: Sentinel Core

**Cor-âncora**: Preto-espelhado (#0F0F0F) com detalhes neon verde-IA (#00FF88)

**Silhueta**: 3× o tamanho do squad. Núcleo esférico flutuante com 4 braços mecânicos retráteis, superfície reflete o ambiente. Olho único imenso muda de cor por fase.

**Fases**:

#### Fase 1 (100%–60% HP) — Olho branco
- Dash em linha reta a cada 8s (telegrafado por linha vermelha 0.8s antes)
- Janela vulnerável: 2s após cada dash
- Spawn: 3 Runners a cada 15s

#### Fase 2 (60%–0% HP) — Olho vermelho
- Dash a cada 5s
- Spawn: 1 Bruiser + Runners a cada 12s
- Adiciona orbe rastreador lento disparado entre dashes
- Braços mecânicos parcialmente visíveis — efeito visual de stress

| Atributo | Valor |
|---|---|
| HP | 600 |
| Aparece em | 90s de run OU após todas as ondas |

---

## Tabela Resumo — Todos os Inimigos

| Inimigo | Cor | HP | Velocidade | Ameaça Principal | Tier |
|---|---|---|---|---|---|
| Runner (Lata-Veloz) | Laranja-enferrujado | 30 | 130px/s | Quantidade | Base |
| Bruiser (Barril) | Cinza-chumbo | 150 | 60px/s | HP e dano alto | Base |
| Spitter (Canudo) | Verde-oxidado | 60 | 40px/s | Ranged, força movimento | Base |
| Crawler (Centopeia) | Bronze-envelhecido | 90 | 130px/s | Mergulha, anti-Siege Mode | Elite |
| Shielder (Escudo) | Prata-polido | 120 | 80px/s | Escudo frontal, força flanco | Elite |
| Bomber (Pinguim) | Preto + laranja-néon | 45 | 90px/s | Explosão ao morrer | Elite |
| Sniper (Tripé Longo) | Azul-aço | 50 | Imóvel | Tiro telegrafado, anti-parado | Elite |
| Sentinel Core (Boss) | Preto + verde-IA | 600 | Variável | Dash + spawns + orbe | Boss |

---

## Notas de Design — Sinergia Visual × Mecânica

Cor-âncora = **legibilidade de ameaça** (aprendida em ~3 runs sem tutoriais):

- **Laranja/enferrujado** = quantidade, básicos (Runner)
- **Cinza/prata** = resistência, tanques (Bruiser, Shielder)
- **Verde-oxidado** = ameaças de distância (Spitter)
- **Bronze** = inimigos qu