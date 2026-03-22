# Zona Stealth — Game Design Document

**Version**: 1.0
**Date**: 2026-03-21
**Status**: Draft — Brainstorm Approved

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
Você espera na sombra enquanto um drone passa a centímetros. Você faz barulho
do outro lado da rua para desviar uma patrulha, corre para pegar o componente,
e desaparece antes que o drone volte. Cada componente coletado é uma pequena
vitória contra a máquina perfeita — conquistada com inteligência, não força.

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
- Essa é a única forma de "manipular" inimigos sem atacá-los

### 3.7 Coleta de Componentes

- Componentes aparecem espalhados pelo mapa em posições procedurais
- Para coletar: **parar completamente sobre o componente por 1.5 segundos**
  - Um círculo de progresso aparece ao redor do componente enquanto o jogador está parado
  - Qualquer movimento cancela e reseta o círculo do zero
- Cada componente coletado vai para a mochila (limite de slots — ver sistema de recursos)
- Mochila cheia: componentes no chão são silenciosamente ignorados — o jogador vai ao EXIT

**Sinergia com stealth:** parar para coletar = raio de som mínimo (zero movimento).
Ficar parado é a posição mais furtiva possível — mas também a mais vulnerável a cones
de visão e ciclos de câmera. O timing de coleta deve ser sincronizado com as patrulhas.

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

---

## 5. Edge Cases

| Situação | Comportamento |
|---|---|
| Jogador entra no cone E na sombra ao mesmo tempo | Sombra tem prioridade — barra de alerta não sobe |
| Dois drones perseguem simultaneamente | Ambos perseguem de forma independente — jogador precisa perder ambos |
| Drone investigador chega à origem do som mas jogador já saiu | Drone circula a área por 4s e retorna à rota normal |
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
| `quantidade_componentes` | 6–8 por mapa | 4–12 | Densidade de recursos no mapa |
| `slots_mochila` | (ver sistema de recursos) | — | Compartilhado com outras zonas |

---

## 8. Acceptance Criteria

- [ ] Novo jogador entende que pode usar barulho como distração sem tutorial
- [ ] Em 100% dos casos, entrar em sombra torna o jogador invisível para cones de visão e câmeras
- [ ] O raio de som é visível e atualiza em tempo real conforme a velocidade muda
- [ ] É possível completar uma run sem ser detectado nenhuma vez
- [ ] É possível ser detectado, escapar da perseguição, e completar a run com sucesso
- [ ] O jogador consegue distinguir visualmente: zona iluminada vs sombra, cone ativo vs câmera varrendo
- [ ] Ao chegar ao EXIT com perseguição ativa, o jogo comunica claramente que a saída está bloqueada
- [ ] Uma run completa (entrar, coletar, sair) ocorre entre 60 e 120 segundos

---

*Relacionado: `design/gdd/game-concept.md`, `design/gdd/mvp-game-brief.md`*
