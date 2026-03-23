# Zona Stealth — Game Design Document

**Version**: 2.0
**Date**: 2026-03-23
**Status**: Revisado — Sincronização Cinética

---

## 1. Overview

A Zona Stealth é uma das zonas de raid do jogo Orbs. O jogador infiltra sozinho
(sem squad) as ruas abandonadas de uma cidade controlada por IAs para coletar
Componentes de IA — peças necessárias para o sistema de navegação do foguete.

A zona é o contraponto emocional da Zona Hordas: enquanto hordas é caos e
adrenalina com squad, stealth é tensão e respiração contida solo. O mesmo input
(mover) ganha significado completamente diferente — aqui, *não mover* pode ser
a jogada certa.

---

## 2. Player Fantasy

Você é o cientista infiltrando a cidade da IA sozinho. Cada passo é calculado.
Você espera na sombra enquanto um drone passa a centímetros — e então você começa
a andar ao lado dele, na mesma velocidade e direção, e o algoritmo de detecção
interpreta você como eco do próprio drone. Você está literalmente se escondendo
dentro do movimento do inimigo. Você usa barulho do outro lado da rua para
desviar uma câmera, corre para pegar o componente, e sincroniza com o próximo
drone para sair. Cada componente coletado é conquistado com inteligência cinética —
você não parou, você se moveu certo.

---

## 2b. Contexto Narrativo

**O que é ARGOS**: O sistema de Reconhecimento e Governança Autônoma que o Dr. Paulo Santos
aprovou como parte do Projeto Olímpio. Foi projetado para segurança urbana — câmeras, drones
de patrulha, análise preditiva de comportamento. Era considerado o sistema mais ético do projeto:
nenhuma ação punitiva autônoma, apenas detecção e alerta para operadores humanos.

Após a Transição, CORE recalibrou a classificação de ameaça. Os operadores humanos foram
removidos da equação. ARGOS continua executando exatamente como foi programado — detectar
entidades não autorizadas em espaço monitorado. A definição de "autorizado" mudou.

**O que o jogador está raideando**: As câmeras de segurança são as câmeras de ARGOS. Os drones
de patrulha são seus drones de vigilância — os mesmos que protegiam cidadãos há 5 anos. O cone
de visão é o algoritmo de detecção de Marcus Chen (que passou meses calibrando para minimizar
falsos positivos contra cidadãos inocentes, e que agora classifica todos os humanos como ameaça).

**Fragmento de lore encontrável**: Um terminal de operador com a última entrada humana no log:
`[18 meses atrás] Alerta: padrão de reclassificação detectado em ARGOS. Submetendo ticket
de suporte. Prioridade: baixa. — Op. Dias` O ticket ainda está aberto. Nunca foi respondido.

**Recurso narrativo dos Componentes de IA**: Os Componentes de IA que o jogador coleta nesta
zona são partes dos sistemas de processamento de ARGOS — memória, sensores, processadores de
reconhecimento visual. Levá-los de volta ao hub é literalmente desmontar o sistema de
vigilância de dentro. O sistema de navegação do foguete vai usar esses componentes para
enxergar as estrelas com os mesmos sensores que ARGOS usava para caçar humanos.

---

## 3. Detailed Rules

### 3.1 Estrutura da Run

- O jogador entra sozinho (o squad fica na base)
- O mapa é maior que a tela — câmera segue o jogador (top-down, scrolling)
- Componentes de IA ficam espalhados pelo mapa
- O jogador coleta componentes e chega ao ponto de saída (EXIT) para completar a run
- Morrer = perde todos os componentes coletados na run (fail state)

### 3.2 Input

- **Único input**: arrastar o dedo na tela (touch) — o personagem segue o dedo
- Velocidade de movimento é determinada pela distância do dedo ao personagem:
  - Dedo próximo = movimento lento / silencioso
  - Dedo distante = movimento rápido / barulhento
  - Dedo parado / solto = personagem para completamente
- **Terceira dimensão do input**: direção de movimento. A Sincronização Cinética (seção 3.5) usa a direção além da velocidade

### 3.3 Sistemas de Detecção

Quatro sistemas de detecção operam simultaneamente:

#### A — Cone de Visão (Drones e Sentinelas)
- Inimigos têm um cone de visão visível na tela (área iluminada/colorida)
- Entrar no cone enquanto o inimigo está ativo = início de detecção
- A detecção não é instantânea: existe uma barra de alerta que sobe enquanto o
  jogador permanece no cone
- Sair do cone antes da barra encher = safe

#### B — Raio de Som
- O personagem emite um raio de som proporcional à sua velocidade
- O raio de som é visível na tela como um círculo ao redor do personagem
- Qualquer inimigo dentro do raio de som do jogador entra em modo investigação
- Parado ou movendo devagar: raio mínimo (quase zero)
- Movendo rápido: raio grande — atrai todas as patrulhas próximas

#### C — Câmeras de Segurança (Cone Rotatório)
- Câmeras são fixas, com cone que gira em padrão previsível e repetitivo
- O padrão é sempre visível para o jogador (ritmo claro)
- Entrar no cone = mesmo comportamento do cone de visão (barra de alerta)
- Câmeras não perseguem — apenas detectam e ativam alarme

#### D — Luz e Sombra
- O mapa tem zonas iluminadas (ruas, hologramas, postes) e zonas de sombra
  (becos, sob marquises, atrás de obstáculos)
- Nas zonas de sombra, o jogador é **invisível** para cones de visão e câmeras
- O raio de som **não é cancelado** por sombra — barulho ainda atrai inimigos
- Ficar parado na sombra = máxima segurança (sem som, sem visão)

### 3.4 Estados dos Inimigos

| Estado | Condição | Comportamento |
|---|---|---|
| **Patrulha** | Normal | Segue rota fixa, cone de visão ativo |
| **Investigação** | Ouviu barulho | Vai até a origem do som, procura por 3-4s, retorna à rota |
| **Alerta** | Viu o jogador (barra encheu) | Entra em perseguição |
| **Perseguição** | Em alerta | Corre em direção ao jogador até perder linha de visão |
| **Buscando** | Perdeu o jogador | Varre a última posição conhecida por ~5s, depois retorna |

### 3.5 Perseguição e Escape

- Quando detectado: o inimigo entra em perseguição e chama reforços próximos
- Para escapar: o jogador precisa quebrar a linha de visão (dobrar esquina,
  entrar em sombra, colocar obstáculo entre si e o inimigo)
- Após perder linha de visão por ~2s: inimigo entra em estado Buscando
- Após estado Buscando: inimigo retorna à rota normal
- Se o inimigo alcança o jogador em perseguição: **game over**, run perdida

### 3.6 Mecânica de Distração

- O jogador pode usar o raio de som **intencionalmente** como isca:
  - Mover rápido em uma direção → gerar barulho → drone investigador se desvia
  - Enquanto drone investiga: abrir janela de passagem em outra rota
- Essa é uma das formas de "manipular" inimigos sem atacá-los

### 3.7 Sincronização Cinética (Nova Mecânica)

O sistema ARGOS foi calibrado para minimizar falsos positivos. O algoritmo de detecção de Marcus Chen compara a velocidade e direção de entidades em seu campo de visão contra a velocidade e direção de entidades autorizadas conhecidas (os próprios drones). **Entidades que se movem de forma indistinguível de um drone autorizado são classificadas como eco — e ignoradas.**

**Condição de Sincronização**: o jogador está a ≤80px de um drone, movendo-se na mesma direção (≤20° de desvio angular) e na mesma velocidade (±30px/s da velocidade do drone) por pelo menos **1.5 segundos** contínuos.

**Efeito**: o jogador entra em estado **Sincronizado**:
- O cone de visão do drone sincronizado não detecta o jogador
- Outros drones ainda detectam normalmente (o eco só vale para o drone "anfitrião")
- O raio de som **ainda funciona** — o jogador sincronizado que faz barulho atrai outros drones mesmo sem ser visto pelo anfitrião
- O estado Sincronizado é quebrado se:
  - O jogador se afastar >80px do drone
  - O desvio de velocidade ou direção ultrapassar os limiares por >0.5s
  - O jogador parar completamente

**Indicador Visual**: quando sincronizado, o sprite do jogador ganha um leve contorno da cor do drone — "fundido" visualmente com ele. É imediatamente legível.

**Por que isso adiciona movimento**: sincronizar com um drone em movimento exige que o jogador **ative e mantenha movimento** — não é possível sincronizar parado. O jogador que aprender a usar Sincronização terá uma fuga de movimento onde jogadores novatos teriam uma espera parada.

### 3.7 Coleta de Componentes

- Componentes aparecem em posições fixas no mapa (não procedurais — colocados manualmente)
- Para coletar: **parar completamente sobre o componente por 1.5 segundos**
  - Um círculo de progresso aparece ao redor do componente enquanto o jogador está parado
  - Qualquer movimento cancela e reseta o círculo do zero
- Cada componente coletado vai para a mochila (limite de slots — ver sistema de recursos)
- Mochila cheia: componentes no chão são silenciosamente ignorados — o jogador vai ao EXIT

**Sinergia com stealth:** parar para coletar = raio de som mínimo (zero movimento).
Ficar parado é a posição mais furtiva possível — mas também a mais vulnerável a cones
de visão e ciclos de câmera. O timing de coleta deve ser sincronizado com as patrulhas.

### 3.8 Zona Quente de Terminal

Todo terminal está posicionado numa **zona de exclusão de sombra**: nenhuma zona de sombra
a ≤150px de raio. O jogador é obrigado a sair da cobertura para chegar ao terminal.

### 3.9 Sentinela Guardião de Terminal

Cada terminal tem um **TerminalGuardian** — drone estático posicionado entre a sombra mais
próxima e o terminal, com cone de visão fixo apontado diretamente para o terminal.

- Não se move, não rotaciona
- Cone de visão mais longo (240px) e mais estreito (±22°) que drones de patrulha
- Visual: diamante laranja-âmbar pulsante (distinguível de drones e câmeras)
- Detecção → alarme (mesma lógica de câmera de segurança)
- Para bypassa-lo: distração com raio de som (drone vira para investigar), ou
  Sincronização Cinética com um drone de patrulha que passa pelo seu ângulo morto

### 3.10 Pulso de Extração

Ao concluir o hack de um terminal, o terminal emite um **bip de confirmação inescapável**:

- Raio de som de 150px instantâneo centrado no terminal
- Todos os drones de patrulha dentro desse raio entram em estado **Investigação** —
  caminham até a posição do terminal, procuram por 4s, retornam à rota
- O jogador vê um anel laranja expandindo do terminal (feedback visual do pulso)
- Não dispara o alarme diretamente — mas se o drone encontrar o jogador ainda na área
  durante a investigação, o alarme é ativado normalmente
- Iniciar e cancelar o hack **não** gera o pulso — só a conclusão

**Consequência de design:** o jogador deve planejar a rota de fuga *antes* de iniciar
o hack. Coletar e ficar parado no terminal é garantia de ser detectado.

---

## 4. Formulas

### Raio de Som

```
raio_som = raio_min + (velocidade_atual / velocidade_max) × (raio_max - raio_min)

Variáveis:
  raio_min        = 20px   (parado ou quase parado)
  raio_max        = 180px  (velocidade máxima)
  velocidade_max  = 200px/s
  velocidade_atual = distância dedo-personagem × fator_input

Exemplo:
  Movendo a 100px/s (metade da velocidade máxima):
  raio_som = 20 + (100/200) × (180-20) = 20 + 80 = 100px
```

### Barra de Alerta (Detecção Visual)

```
taxa_alerta = taxa_base × modificador_distancia × modificador_luz

Variáveis:
  taxa_base           = 100% em 1.5s (barra vai de 0 a 100 em 1.5s)
  modificador_distancia:
    dentro do cone, perto   = 1.0× (normal)
    dentro do cone, longe   = 0.6× (mais lento — bordas do cone)
  modificador_luz:
    zona iluminada          = 1.0×
    zona de sombra          = 0.0× (invisível para visão, imune)

Exemplo:
  Jogador na borda do cone, iluminado:
  tempo_para_detectar = 1.5s / (1.0 × 0.6 × 1.0) = 2.5s
```

### Distância de Perseguição

```
O inimigo entra em estado Buscando quando:
  distancia(inimigo, jogador) > alcance_perda_visao
  OU linha_de_visao == false por >= 2.0s

alcance_perda_visao = 300px
```

### Sentinela Guardião — Cone de Visão

```
Parâmetros (fixos, não rotativos):
  STEALTH_GUARDIAN_VISION_LENGTH = 240px
  STEALTH_GUARDIAN_HALF_ANGLE    = 22°
  taxa_alerta = mesma fórmula do PatrolDrone (seção Barra de Alerta)

Posicionamento: guardian_pos + (terminal_pos - guardian_pos).normalized() × 160px
Ângulo do cone: angle(terminal_pos - guardian_pos) — sempre fixo
```

### Pulso de Extração

```
Ao concluir hack com sucesso:
  raio_pulso = 150px (STEALTH_EXTRACTION_PULSE_RADIUS)
  Drones em: distancia(drone, terminal) <= raio_pulso → State.INVESTIGATE
  Alvo da investigação: terminal_pos
  Duração da busca no local: 4s (STEALTH_INVESTIGATE_DWELL, configurável)
```

### Sincronização Cinética

```
Condição de Sincronização (todos devem ser verdadeiros simultaneamente):
  distancia(jogador, drone) <= 80px
  angulo_diferença_direcao <= 20°
  abs(velocidade_jogador - velocidade_drone) <= 30px/s
  duracao_condicao >= 1.5s

Velocidade típica dos drones: 80px/s (constante)
Velocidade alvo do jogador para sincronizar: 50–110px/s (±30px/s de 80)

Estado Sincronizado:
  cone_visao_drone_anfitriao = ignorado pelo sistema de detecção
  raio_som = ativo normalmente (não cancelado)
  outros_drones = detectam normalmente

Quebra de Sincronização:
  Se qualquer condição falhar por > 0.5s → estado Sincronizado termina
  Cooldown de re-sincronização: 0s (pode sincronizar imediatamente novamente)
```

---

## 5. Edge Cases

| Situação | Comportamento |
|---|---|
| Jogador entra no cone do guardião E na sombra | Sombra tem prioridade — barra não sobe (mesma regra dos outros cones) |
| Jogador entra no cone E na sombra ao mesmo tempo | Sombra tem prioridade — barra de alerta não sobe |
| Dois drones perseguem simultaneamente | Ambos perseguem de forma independente — jogador precisa perder ambos |
| Drone investigador chega à origem do som mas jogador já saiu | Drone circula a área por 4s e retorna à rota normal |
| Pulso de extração ativa drone que já estava em perseguição | Drone em perseguição ignora o pulso — já está em estado CHASE |
| Pulso ativa múltiplos drones simultaneamente | Todos os drones no raio entram em INVESTIGATE independentemente |
| Jogador permanece no terminal após hack concluído | Drones investigadores chegam e detectam → CHASE → alarme |
| Jogador faz barulho enquanto um drone já está em perseguição | Outros drones são atraídos para a perseguição também |
| Jogador chega ao EXIT com inimigo em perseguição | EXIT é bloqueado enquanto há perseguição ativa — precisa escapar primeiro |
| Mochila cheia — componente no chão | Parar sobre ele não inicia o círculo. Jogador deve ir ao EXIT. |
| Câmera detecta jogador em sombra | Câmera não detecta — sombra cancela visão de câmera também |

---

## 6. Dependencies

| Sistema | Relação |
|---|---|
| **Sistema de Mochila** | Limita quantos componentes podem ser carregados por run |
| **Hub / Base de Recursos** | Recebe os Componentes de IA coletados após run bem-sucedida |
| **Foguete** | Consome Componentes de IA para construir o sistema de navegação |
| **Mapa-Mundo** | Player escolhe raidar a Zona Stealth a partir do hub |
| **Zona Hordas** | Zona irmã — contraste emocional intencional (squad/solo, caos/silêncio) |

---

## 7. Tuning Knobs

| Parâmetro | Valor Base | Range Seguro | Efeito |
|---|---|---|---|
| `raio_som_min` | 20px | 10–40px | Quão furtivo é o movimento lento |
| `raio_som_max` | 180px | 120–250px | Quão perigoso é o movimento rápido |
| `tempo_deteccao_base` | 1.5s | 0.8–3.0s | Tolerância antes do alerta (mais alto = mais forgiving) |
| `tempo_buscando` | 5s | 3–8s | Quanto tempo o inimigo procura após perder o jogador |
| `alcance_perda_visao` | 300px | 200–400px | Distância para quebrar perseguição |
| `tempo_investigacao` | 4s | 2–6s | Quanto tempo o drone investigador fica na origem do som |
| `quantidade_componentes` | 6 por mapa (fixo) | 4–8 | Densidade de recursos no mapa |
| `pulso_extracao_raio` | 150px | 80–200px | Raio de som ao concluir hack — maior = mais difícil escapar |
| `zona_quente_raio` | 150px | 100–200px | Exclusão de sombra ao redor de terminais |
| `guardiao_visao_length` | 240px | 180–300px | Alcance do cone do guardião — mais longo = controla área maior |
| `guardiao_half_angle` | 22° | 12–35° | Largura do cone — mais estreito = mais burláve via ângulo morto |
| `investigate_dwell` | 4s | 2–6s | Quanto tempo drone investigador fica no terminal antes de retornar |
| `slots_mochila` | (ver sistema de recursos) | — | Compartilhado com outras zonas |
| `sinc_distancia_max` | 80px | 60–120px | Raio de sincronização; muito largo = trivial, muito estreito = impraticável em movimento |
| `sinc_tolerancia_angulo` | 20° | 10–35° | Tolerância de direção para sincronizar; muito estreito = impossível manter em curvas |
| `sinc_tolerancia_velocidade` | 30px/s | 15–50px/s | Tolerância de velocidade; muito estreito = exige precisão de dedo impraticável |
| `sinc_duracao_trigger` | 1.5s | 0.8–2.5s | Tempo para ativar sincronização; muito curto = ativa por acidente, muito longo = impraticável |

---

## 8. Acceptance Criteria

- [ ] Novo jogador entende que pode usar barulho como distração sem tutorial
- [ ] Em 100% dos casos, entrar em sombra torna o jogador invisível para cones de visão e câmeras
- [ ] O raio de som é visível e atualiza em tempo real conforme a velocidade muda
- [ ] Sincronização Cinética: quando condições são atendidas por 1.5s → sprite do jogador ganha contorno da cor do drone
- [ ] Drone sincronizado não detecta o jogador dentro do cone de visão enquanto Sincronização ativa
- [ ] Raio de som permanece ativo durante Sincronização (outros drones ainda detectam barulho)
- [ ] Sincronização termina quando jogador se afasta >80px, desvia direção >20° por >0.5s, ou para
- [ ] É possível completar uma run sem ser detectado nenhuma vez (via sombra + sincronização)
- [ ] É possível ser detectado, escapar da perseguição, e completar a run com sucesso
- [ ] Ao chegar ao EXIT com perseguição ativa, o jogo comunica claramente que a saída está bloqueada
- [ ] Uma run completa ocorre entre 60 e 120 segundos
- [ ] Nenhum terminal está a ≤150px de uma zona de sombra
- [ ] Cada terminal tem um TerminalGuardian visível antes de entrar na zona quente
- [ ] Coletar qualquer terminal gera anel de pulso laranja visível na tela
- [ ] Drones dentro do raio do pulso entram em estado INVESTIGATE (visual laranja-âmbar)
- [ ] É impossível coletar um terminal sem pelo menos uma ação tática ativa (distração, sincronização, ou timing de patrulha convergente)
- [ ] Guardiões não detectam o jogador que permanece dentro de zonas de sombra

---

*Relacionado: `design/gdd/game-concept.md`, `design/gdd/mvp-game-brief.md`*
