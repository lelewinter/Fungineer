# Inimigos — Zona Hordas

**Version**: 1.0
**Date**: 2026-03-22
**Status**: Draft — Referência Visual Aprovada

---

## Direção de Arte — Linguagem Visual dos Inimigos

**Referência primária**: Machinarium (Amanita Design)

Todos os inimigos da Zona Hordas são **robôs de sucata** — máquinas de IA montadas a partir de lixo industrial, peças abandonadas, e hardware reciclado da era pré-apocalipse. Cada inimigo comunica sua função através da forma do corpo antes de qualquer outra coisa. Um robô com pernas longas é claramente rápido; um com torso de barril é claramente tanque.

**Linguagem visual compartilhada**:
- Corpos feitos de **formas geométricas simples empilhadas**: cilindros, esferas, caixas, tubos
- **Olhos grandes e expressivos** como os de Machinarium — comunicam estado de IA (calmo, alertado, em fúria)
- **Parafusos, rebites, e juntas visíveis** em todas as articulações
- Cada tipo tem uma **cor-âncora de metal** que o identifica à distância
- O grau de **ferrugem e desgaste** comunica raridade/força: robôs mais comuns são mais enferrujados, robôs de elite são mais polidos e assustadores
- Fumaça, vapor, e chiados de pressão como linguagem de estado (danificado, sobrecarregado, etc.)

---

## Inimigos Base (Ondas 1–2)

### Runner — "Lata-Veloz"

**Cor-âncora**: Laranja-enferrujado (#C4622D)

**Silhueta**: Corpo minúsculo de lata de conserva com duas pernas compridas e finas de arame dobrado. Cabeça é uma lâmpada velha incandescente — quando está ativo, a lâmpada brilha âmbar. Sem braços. Corre inclinado para frente, quase caindo.

**Expressão**: Olho único (a própria lâmpada). Quando detecta o jogador, a lâmpada acende brilhante e ele emite um chiado de pressão.

**Stats**:
| Atributo | Valor |
|---|---|
| HP | 30 |
| Velocidade | 130 px/s (ajustado — original 200px/s era rápido demais para o volume de inimigos) |
| Dano de contato | 5 |
| Comportamento | Carga direta ao membro mais próximo do squad |

**Presença em jogo**: Alta quantidade (spawna em grupos de 4–8). O principal inimigo de aprendizado — ensina posicionamento cedo porque são muitos e rápidos, mas morrem fácil.

---

### Bruiser — "Barril"

**Cor-âncora**: Cinza-chumbo (#5A5A6E) com detalhes âmbar nos rebites

**Silhueta**: Torso de barril de metal industrial velho, dois braços curtos e grossos como pistons hidráulicos, pernas cilíndricas curtas. Muito largo, muito baixo. Cabeça é pequena demais para o corpo — duas lâmpadas vermelhas como olhos. Anda pesado, sacudindo o chão.

**Expressão**: Olhos vermelhos permanentes. Quando sofre dano, emite vapor branco pelos lados. Quando entra em modo "fúria" (abaixo de 30% HP), os olhos piscam vermelho acelerado e a velocidade aumenta ligeiramente.

**Stats**:
| Atributo | Valor |
|---|---|
| HP | 150 |
| Velocidade | 60 px/s (lento) |
| Dano de contato | 25 |
| Comportamento | Mira no Guardian ou no aliado com mais HP |

**Presença em jogo**: Sempre individual ou em pares. O "obstáculo" da zona — você precisa decidir se kita ou absorve com o Guardian.

---

### Spitter — "Canudo"

**Cor-âncora**: Verde-oxidado (#4A7C59) — o único inimigo que não tem tom de enferrujado, comunicando que é diferente

**Silhueta**: Corpo fino como uma garrafa térmica com três pernas de tripé. O torso tem um cano longo apontado para frente — é o próprio corpo, não uma arma separada. Cabeça é uma mini-esfera com um olho de câmera giratório (lente visível). Se move raramente, prefere ficar parado atirando.

**Expressão**: Olho de câmera gira para rastrear o jogador. Quando está na range ideal, fica completamente parado — as pernas se fixam no chão como um tripé de câmera fotográfica.

**Stats**:
| Atributo | Valor |
|---|---|
| HP | 60 |
| Velocidade | 40 px/s |
| Dano por projétil | 12 |
| Range | 120px |
| Comportamento | Mantém distância ideal; recua se o jogador entra no range |

**Presença em jogo**: Aparece na borda da arena. Força o jogador a sair da posição confortável para eliminá-lo.

---

## Inimigos de Elite (Aparecem pós-wave 2 / nas versões difíceis)

*Inimigos mais polidos, mais caros visualmente, mais difíceis mecanicamente.*

---

### Crawler — "Centopeia"

**Cor-âncora**: Bronze-envelhecido (#8C6B3E) com juntas de cobre brilhante

**Silhueta**: Corpo segmentado em 5–7 módulos cilíndricos conectados por juntas flexíveis de cobre. Rasteja pelo chão. Sem pernas — cada segmento se move de forma independente, criando movimento ondulatório. Cabeça é o primeiro segmento: dois olhos de câmera vermelhos laterais e uma mandíbula mecânica que abre e fecha.

**Expressão**: Quando danificado, segmentos individuais começam a falhar e tremer. Se o jogador matar apenas a cauda, o segmento destruído fica no chão como obstáculo.

**Habilidade especial**: Se o squad ficar parado por mais de 1s, o Crawler **se enfia no chão** e reaparece sob o jogador (telegrafado por uma sombra que aparece na posição de reaparecimento 0,8s antes).

**Stats**:
| Atributo | Valor |
|---|---|
| HP | 90 (por segmento: 18) |
| Velocidade | 130 px/s |
| Dano de mordida | 20 |
| Habilidade | Mergulho subterrâneo telegrafado |

**Design intent**: Força o jogador a se mover continuamente — o Siege Mode se torna arriscado com Crawlers presentes.

---

### Shielder — "Escudo"

**Cor-âncora**: Prata-polido (#A8A8B8) com reflexo metálico — o mais limpo e "novo" entre os inimigos

**Silhueta**: Torso de escudo de sinalização de estrada reenformado como armadura. Braços curtos, postura de proteção (braços sempre cruzados na frente). Um único olho no centro da "testa" do escudo. Pernas robustas mas não rápidas.

**Expressão**: Quando está defendendo, o olho emite luz azul fria. Quando o escudo cai (virado de costas), o olho vira vermelho.

**Habilidade especial**: **Escudo frontal** — recebe 90% menos dano de projéteis pela frente. O escudo só é penetrável por trás ou pelas laterais. Se o squad posicionar bem (dividindo atenção), o Shielder fica vulnerável ao tentar rastrear múltiplos alvos.

**Stats**:
| Atributo | Valor |
|---|---|
| HP | 120 |
| Velocidade | 80 px/s |
| Dano | 18 |
| Redução de dano (frontal) | 90% |

**Design intent**: Cria necessidade de posicionamento angular — o squad precisa se dividir ou flanquear.

---

### Bomber — "Pinguim"

**Cor-âncora**: Preto-fosco (#2A2A2A) com detalhes em laranja-néon (#FF6B35)

**Silhueta**: Corpo bojudo de pinguim (barriga arredondada, sem pescoço). Dois braços pequenos. Pernas curtas que trotam de forma quase cômica. A barriga tem uma janela de vidro onde as "bombas" internas são visíveis (esferas vermelhas pulsando). Olhos são duas câmeras rectangulares que piscam laranja quando ativado.

**Expressão**: Anda devagar e parece inofensivo — o humor visual é intencional. Quando entra em modo de ataque, a barriga começa a piscar acelerado e ele emite um som de tictac. Se o jogador não eliminar a tempo, explode em AoE largo.

**Habilidade especial**: **Auto-detonação** — ao chegar perto do squad OU ao ser morto (com delay de 1s), explode causando dano em 80px de raio. A morte dele é tão perigosa quanto a aproximação.

**Stats**:
| Atributo | Valor |
|---|---|
| HP | 45 (frágil intencionalmente) |
| Velocidade | 90 px/s |
| Dano de explosão | 40 (AoE 80px) |
| Dano de contato | 0 |
| Timer de detonação ao morrer | 1.0s |

**Design intent**: Cria dilema: eliminar causa explosão perigosa; ignorar é ainda pior. A Artificer com seu AoE é ideal — mas o dano de cluster pode detonar o Bomber prematuramente.

---

### Sniper — "Tripé Longo"

**Cor-âncora**: Azul-aço (#3A5A7C) com lente de mira laranja-âmbar brilhante

**Silhueta**: Corpo ultra-fino e alto — como um tripé de câmera com 4 pernas. Cabeça é uma luneta giratória enorme. O cano de ataque é longo e fino, visível como parte do corpo. Fica sempre na borda máxima da arena, nunca se move enquanto está mirando.

**Expressão**: A luneta gira para rastrear o alvo. Quando está prestes a atirar, um raio laser vermelho fino aparece indicando a trajetória por 1,5s antes do disparo.

**Habilidade especial**: **Tiro carregado** — telegrafado por laser. Perfura escudos e personagens em linha reta (dano em cadeia). Causa 45 de dano ao primeiro alvo, 25 ao segundo na mesma linha.

**Stats**:
| Atributo | Valor |
|---|---|
| HP | 50 (frágil) |
| Velocidade | 0 (nunca se move) |
| Dano por tiro | 45 (primeiro alvo), 25 (segundo) |
| Delay de telegraf | 1.5s |
| Cooldown entre tiros | 4.0s |

**Design intent**: Força movimento constante do squad. O Siege Mode se torna diretamente arriscado — ficar parado é ser acertado com certeza.

---

## Boss: Sentinel Core

**Cor-âncora**: Preto-espelhado (#0F0F0F) com detalhes neon verde-IA (#00FF88) — conexão visual direta com a Zona Stealth, sinalizando que os dois mundos compartilham a mesma ameaça

**Silhueta**: Grande — 3× o tamanho do squad inteiro. Corpo de núcleo esférico central flutuante (como um servidor de datacenter arredondado) com 4 braços mecânicos retráteis. A superfície reflete o ambiente. No centro da esfera: um olho único imenso que muda de cor conforme as fases.

**Expressão**: Na Fase 1, o olho é branco-frio e calculista. Na Fase 2, vira vermelho-pulsante — a IA detectou que está sendo ameaçada e entrou em modo de combate.

**Fases**:

#### Fase 1 (100%–60% HP) — Olho branco
- **Dash**: Carrega em linha reta pela arena a cada 8s. Telegrafado por linha de rota vermelha que aparece 0,8s antes.
- **Vulnerável**: Janela de 2s após cada dash (parou, olho pisca).
- **Spawn**: 3 Runners a cada 15s (spawnam das "costelas" do boss)

#### Fase 2 (60%–0% HP) — Olho vermelho
- Dash a cada 5s
- Spawn: 1 Bruiser + Runners a cada 12s
- Adiciona **orbe rastreador lento** disparado entre dashes
- Os braços mecânicos ficam parcialmente visíveis e se movem — puro efeito visual de stress

**Stats**:
| Atributo | Valor |
|---|---|
| HP | 600 |
| Aparece em | 90s de run OU após todas as ondas |

---

## Tabela Resumo — Todos os Inimigos

| Inimigo | Cor | HP | Velocidade | Ameaça Principal | Tier |
|---|---|---|---|---|---|
| Runner (Lata-Veloz) | Laranja-enferrujado | 30 | Média-rápida (130px/s) | Quantidade | Base |
| Bruiser (Barril) | Cinza-chumbo | 150 | Lenta | HP e dano alto | Base |
| Spitter (Canudo) | Verde-oxidado | 60 | Muito lenta | Ranged, força movimento | Base |
| Crawler (Centopeia) | Bronze-envelhecido | 90 | Média | Mergulha, anti-Siege Mode | Elite |
| Shielder (Escudo) | Prata-polido | 120 | Média | Escudo frontal, força flanco | Elite |
| Bomber (Pinguim) | Preto + laranja-néon | 45 | Média | Explosão ao morrer | Elite |
| Sniper (Tripé Longo) | Azul-aço | 50 | Imóvel | Tiro telegrafado, anti-parado | Elite |
| Sentinel Core (Boss) | Preto + verde-IA | 600 | Variável | Dash + spawns + orbe | Boss |

---

## Notas de Design — Sinergia Visual × Mecânica

A cor-âncora não é só estética — ela funciona como **legibilidade de ameaça**:

- **Laranja/enferrujado** = inimigos de quantidade, básicos (Runner)
- **Cinza/prata** = inimigos de resistência, tanques (Bruiser, Shielder)
- **Verde-oxidado** = ameaças de distância (Spitter)
- **Bronze** = inimigos que usam o terreno (Crawler)
- **Preto** = ameaças explosivas ou de alto impacto (Bomber, Boss)
- **Azul-aço** = inimigos de precisão/controle (Sniper)

Jogadores devem aprender a leitura por cor em ~3 runs sem tutoriais.

---

*Relacionado: `design/gdd/mvp-game-brief.md`, `design/art-direction.md`*
