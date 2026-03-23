# Zona Stealth — Game Design Document

**Version**: 2.0
**Date**: 2026-03-23
**Status**: Revisado — Sincronização Cinética

---

## 1. Overview

Zona de infiltração solo onde o jogador coleta Componentes de IA espalhados por uma cidade controlada por IAs, escapando via ponto EXIT. Input único (arrastar dedo) controla velocidade e direção; velocidade determina raio de som e risco de detecção. Contraponto emocional da Zona Hordas: mesma ação (mover) com significado invertido — aqui, não mover pode ser a jogada certa.

---

## 2. Player Fantasy

Você se infiltra sozinho, calculando cada passo. A jogada mais avançada é andar ao lado de um drone na mesma velocidade e direção até o algoritmo de detecção te classificar como eco — escondido dentro do movimento do inimigo. Inteligência cinética, não força.

---

## 3. Detailed Rules

### 3.1 Estrutura da Run

- Jogador entra sozinho (squad fica na base)
- Mapa maior que a tela — câmera segue o jogador (top-down, scrolling)
- Componentes de IA em posições fixas no mapa
- Objetivo: coletar componentes e chegar ao EXIT
- Morrer = perde todos os componentes coletados na run (fail state)

### 3.2 Input

- **Único input**: arrastar o dedo — personagem segue o dedo
- Dedo próximo = movimento lento / silencioso
- Dedo distante = movimento rápido / barulhento
- Dedo parado / solto = personagem para completamente
- Direção de movimento é a terceira dimensão do input (usada pela Sincronização Cinética)

### 3.3 Sistemas de Detecção

#### A — Cone de Visão (Drones e Sentinelas)
- Cone visível na tela; entrar = barra de alerta sobe
- Sair antes da barra encher = safe

#### B — Raio de Som
- Raio proporcional à velocidade; visível como círculo ao redor do personagem
- Qualquer inimigo dentro do raio entra em modo investigação
- Parado / lento: raio mínimo | Rápido: raio grande

#### C — Câmeras de Segurança
- Fixas, cone rotatório em padrão previsível e repetitivo
- Entrar no cone = barra de alerta (mesma lógica do cone de visão)
- Câmeras apenas detectam e ativam alarme — não perseguem

#### D — Luz e Sombra
- Zonas de sombra: jogador **invisível** para cones de visão e câmeras
- Raio de som **não é cancelado** por sombra
- Parado na sombra = máxima segurança

### 3.4 Estados dos Inimigos

| Estado | Condição | Comportamento |
|---|---|---|
| **Patrulha** | Normal | Segue rota fixa, cone ativo |
| **Investigação** | Ouviu barulho | Vai até origem do som, procura 3–4s, retorna |
| **Alerta** | Barra encheu | Entra em perseguição |
| **Perseguição** | Em alerta | Corre em direção ao jogador até perder linha de visão |
| **Buscando** | Perdeu jogador | Varre última posição por ~5s, retorna |

### 3.5 Perseguição e Escape

- Detecção → perseguição + chama reforços próximos
- Escape: quebrar linha de visão (esquina, sombra, obstáculo)
- Perda de visão por ~2s → estado Buscando → retorna à rota
- Inimigo alcança jogador → game over, run perdida

### 3.6 Mecânica de Distração

- Mover rápido intencionalmente gera barulho → drone desvia para investigar
- Abre janela de passagem em outra rota enquanto drone investiga

### 3.7 Sincronização Cinética

**Condição**: jogador a ≤80px de um drone, mesma direção (≤20° de desvio), mesma velocidade (±30px/s), por ≥1.5s contínuos.

**Efeito — estado Sincronizado**:
- Cone de visão do drone **anfitrião** não detecta o jogador
- Outros drones detectam normalmente
- Raio de som continua ativo

**Quebra de Sincronização** (qualquer condição falhar por >0.5s):
- Afastar >80px do drone
- Desvio de direção ou velocidade ultrapassar limiares
- Jogador parar completamente

**Indicador Visual**: sprite do jogador ganha contorno da cor do drone anfitrião.

### 3.8 Coleta de Componentes

- Posições fixas no mapa (não procedurais)
- Para coletar: **parar completamente sobre o componente por 1.5s**
- Qualquer movimento cancela e reseta o círculo de progresso
- Mochila cheia: componentes no chão são ignorados — jogador vai ao EXIT
- Parado para coletar = raio de som mínimo, mas máxima vulnerabilidade a cones e câmeras

### 3.9 Zona Quente de Terminal

- Nenhuma zona de sombra a ≤150px de raio ao redor de qualquer terminal
- Jogador é obrigado a sair da cobertura para chegar ao terminal

### 3.10 Sentinela Guardião de Terminal

- Drone estático entre a sombra mais próxima e o terminal
- Cone de visão fixo apontado diretamente para o terminal; não move, não rotaciona
- Cone: 240px de comprimento, ±22° de ângulo
- Visual: diamante laranja-âmbar pulsante
- Bypass: distração com raio de som, ou Sincronização Cinética pelo ângulo morto

### 3.11 Pulso de Extração

- Ao concluir hack: raio de som de 150px instantâneo centrado no terminal
- Todos os drones dentro do raio → estado Investigação (caminham ao terminal, 4s, retornam)
- Feedback visual: anel laranja expandindo do terminal
- Não dispara alarme diretamente — mas detecta jogador que permanecer na área
- Cancelar hack não gera pulso; só a conclusão
- **Consequência**: planejar rota de fuga antes de iniciar o hack

---

## 4. Formulas

### Raio de Som

```
raio_som = raio_min + (velocidade_atual / velocidade_max) × (raio_max - raio_min)

  raio_min       = 20px
  raio_max       = 180px
  velocidade_max = 200px/s

Exemplo: 100px/s → raio_som = 20 + (100/200) × 160 = 100px
```

### Barra de Alerta (Detecção Visual)

```
taxa_alerta = taxa_base × modificador_distancia × modificador_luz

  taxa_base           = 100% em 1.5s
  modificador_distancia:
    perto do cone     = 1.0×
    borda do cone     = 0.6×
  modificador_luz:
    zona iluminada    = 1.0×
    zona de sombra    = 0.0× (imune)

Exemplo: borda do cone, iluminado → tempo_detectar = 1.5s / 0.6 = 2.5s
```

### Distância de Perseguição

```
Inimigo entra em Buscando quando:
  distancia(inimigo, jogador) > 300px
  OU linha_de_visao == false por >= 2.0s
```

### Sentinela Guardião — Cone de Visão

```
STEALTH_GUARDIAN_VISION_LENGTH = 240px
STEALTH_GUARDIAN_HALF_ANGLE    = 22°
taxa_alerta = mesma fórmula da Barra de Alerta

Posição: guardian_pos + (terminal_pos - guardian_pos).normalized() × 160px
Ângulo do cone: angle(terminal_pos - guardian_pos) — sempre fixo
```

### Pulso de Extração

```
raio_pulso = 150px (STEALTH_EXTRACTION_PULSE_RADIUS)
Drones em: distancia(drone, terminal) <= raio_pulso → State.INVESTIGATE
Alvo: terminal_pos
Duração busca no local: 4s (STEALTH_INVESTIGATE_DWELL)
```

### Sincronização Cinética

```
Condição (todos simultâneos):
  distancia(jogador, drone)              <= 80px
  angulo_diferença_direcao               <= 20°
  abs(velocidade_jogador - vel_drone)    <= 30px/s
  duracao_condicao                       >= 1.5s

Velocidade típica dos drones: 80px/s
Velocidade alvo do jogador: 50–110px/s

Estado Sincronizado:
  cone do drone anfitrião = ignorado
  raio_som = ativo normalmente
  outros drones = detectam normalmente

Quebra: qualquer condição falhar por >0.5s → sincronização termina
Cooldown de re-sincronização: 0s
```

---

## 5. Edge Cases

| Situação | Comportamento |
|---|---|
| Jogador no cone do guardião E na sombra | Sombra tem prioridade — barra não sobe |
| Dois drones perseguem simultaneamente | Ambos perseguem independentemente; jogador precisa perder ambos |
| Drone investigador chega à origem do som, jogador já saiu | Drone circula por 4s e retorna à rota |
| Pulso de extração ativa drone já em perseguição | Drone em perseguição ignora o pulso |
| Pulso ativa múltiplos drones | Todos no raio entram em INVESTIGATE independentemente |
| Jogador permanece no terminal após hack | Drones investigadores chegam → CHASE → alarme |
| Jogador faz barulho com drone em perseguição | Outros drones atraídos para a perseguição |
| Jogador chega ao EXIT com perseguição ativa | EXIT bloqueado; precisa escapar primeiro |
| Mochila cheia — componente no chão | Parar sobre ele não inicia o círculo; ir ao EXIT |
| Câmera detecta jogador em sombra | Câmera não detecta — sombra cancela visão de câmera |

---

## 6. Dependencies

| Sistema | Relação |
|---|---|
| **Sistema de Mochila** | Limita componentes carregados por run |
| **Hub / Base de Recursos** | Recebe Componentes de IA após run bem-sucedida |
| **Foguete** | Consome Componentes de IA para o sistema de navegação |
| **Mapa-Mundo** | Acesso à Zona Stealth a partir do hub |
| **Zona Hordas** | Zona irmã — contraste emocional intencional (squad/solo, caos/silêncio) |

---

## 7. Tuning Knobs

| Parâmetro | Valor Base | Range Seguro | Efeito |
|---|---|---|---|
| `raio_som_min` | 20px | 10–40px | Furtividade do movimento lento |
| `raio_som_max` | 180px | 120–250px | Periculosidade do movimento rápido |
| `tempo_deteccao_base` | 1.5s | 0.8–3.0s | Tolerância antes do alerta |
| `tempo_buscando` | 5s | 3–8s | Tempo procurando após perder jogador |
| `alcance_perda_visao` | 300px | 200–400px | Distância para quebrar perseguição |
| `tempo_investigacao` | 4s | 2–6s | Tempo do drone na origem do som |
| `quantidade_componentes` | 6 por mapa | 4–8 | Densidade de recursos |
| `pulso_extracao_raio` | 150px | 80–200px | Raio de som ao concluir hack |
| `zona_quente_raio` | 150px | 100–200px | Exclusão de sombra ao redor de terminais |
| `guardiao_visao_length` | 240px | 180–300px | Alcance do cone do guardião |
| `guardiao_half_angle` | 22° | 12–35° | Largura do cone — mais estreito = mais burlável |
| `investigate_dwell` | 4s | 2–6s | Tempo do drone investigador no terminal |
| `slots_mochila` | (ver sistema de recursos) | — | Compartilhado com outras zonas |
| `sinc_distancia_max` | 80px | 60–120px | Raio de sincronização |
| `sinc_tolerancia_angulo` | 20° | 10–35° | Tolerância de direção; muito estreito = impossível em curvas |
| `sinc_tolerancia_velocidade` | 30px/s | 15–50px/s | Tolerância de velocidade; muito estreito = exige precisão impraticável |
| `sinc_duracao_trigger` | 1.5s | 0.8–2.5s | Tempo para ativar; muito curto = ativa por acidente |

---

## 8. Acceptance Criteria

- [ ] Novo jogador entende que pode usar barulho como distração sem tutorial
- [ ] Em 100% dos casos, entrar em sombra torna o jogador invisível para cones e câmeras
- [ ] Raio de som visível e atualiza em tempo real conforme velocidade muda
- [ ] Sincronização Cinética: condições atendidas por 1.5s → sprite ganha contorno da cor do drone
- [ ] Drone sincronizado não detecta jogador dentro do cone enquanto Sincronização ativa
- [ ] Raio de som permanece ativo durante Sincronização (outros drones detectam barulho)
- [ ] Sincronização termina quando jogador se afasta >80px, desvia >20° por >0.5s, ou para
- [ ] É possível completar run sem ser detectado (sombra + sincronização)
- [ ] É possível ser detectado, escapar e completar a run
- [ ] EXIT com perseguição ativa: jogo comunica claramente que saída está bloqueada
- [ ] Run completa entre 60 e 120 segundos
- [ ] Nenhum terminal a ≤150px de zona de sombra
- [ ] Cada terminal tem TerminalGuardian visível antes da zona quente
- [ ] Coletar qualquer terminal gera anel de pulso laranja visível
- [ ] Drones no raio do pulso entram em estado INVESTIGATE (visual laranja-âmbar)
- [ ] Impossível coletar terminal sem pelo menos uma ação tática ativa (distração, sincronização, ou timing)
- [ ] Guardiões não detectam jogador dentro de zonas de sombra

---

*Relacionado: `design/gdd/game-concept.md`, `design/gdd/mvp-game-brief.md`*
