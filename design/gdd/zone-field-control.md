---
tags: [fungineer, game-design, gdd]
date: 2026-03-23
tipo: game-design-doc
---

# Controle de Campo — Game Design Document

**Version**: 2.0
**Date**: 2026-03-23
**Status**: Revisado — Burst de Chegada (Captura Cinética)

---

## 1. Overview

Zona de dominação territorial em tempo real com 5–7 zonas de captura. O jogador posiciona o squad dentro das zonas para capturá-las e gerar **Sinais de Controle** passivamente; chegar em velocidade ativa taxa de captura 3× (burst). A tensão central é cobertura ampla (mais zonas, cada uma mais fraca) vs foco (menos zonas, mais seguras).

---

## 2. Player Fantasy

Cada zona capturada é uma antena que precisa de energia cinética — a energia vem do movimento. Um squad parado é uma antena morta; um squad que circula é uma rede viva.

**Estética MDA primária**: Challenge (gestão de presença cinética, circulação ótima).
**Estética secundária**: Fantasy (comandante territorial que é o próprio sinal).

---

## 3. Detailed Rules

### 3.1 Estrutura da Run

- Squad de até 4 personagens
- Mapa: 5–7 zonas de captura visíveis desde o início
- Timer fixo: 90s; run encerra automaticamente
- Sinais acumulados transferidos ao hub ao fim
- **Sem EXIT voluntário** — encerramento apenas por timer ou fail state
- Todos mortos = fail state; Sinais da run perdidos

### 3.2 Interpretação do Movimento

- Mover é energizar a rede
- **Chegada em velocidade alta (≥160 px/s)**: ativa burst de captura (3× por 4s)
- **Chegada devagar ou parado**: ativa apenas taxa base (1×)
- **Parado >8s**: decaimento cinético (0.5×)
- Circulação ótima: burst por chegada compensa tempo de deslocamento — supera acampamento em todas as estratégias
- Com 4 personagens (formação 2×2, ~240×240px): 1 movimento pode burstar 2 zonas pequenas adjacentes simultaneamente

### 3.3 Zonas de Captura

#### Estados da Zona

| Estado | Cor | Condição | Efeito |
|--------|-----|----------|--------|
| **Neutra** | Cinza | Nenhum personagem dentro | Não gera recursos |
| **Capturando** | Azul pulsante | ≥1 personagem do jogador, sem inimigos | Barra de captura sobe |
| **Capturada** | Azul sólido | Barra = 100% | Gera Sinais passivamente |
| **Contestada** | Roxo | Jogador E inimigos dentro | Barra congela; combate automático |
| **Perdida** | Vermelho pulsante | Apenas inimigos | Barra desce para 0; retorna a Neutra |

#### Tamanhos de Zona

| Tamanho | Raio | Tempo Base para Capturar | Geração | Quantidade |
|---------|------|--------------------------|---------|------------|
| Pequena | 80px | 5s | 0.5 Sinais/s | 3–4 |
| Média | 120px | 10s | 1.0 Sinais/s | 1–2 |
| Central | 180px | 20s | 2.5 Sinais/s | 1 (sempre no centro) |

#### Taxa de Captura Cinética

| Estado Cinético | Taxa | Condição |
|-----------------|------|----------|
| **Burst** | 3× taxa base, por 4s | Chegada com velocidade ≥160 px/s |
| **Normal** | 1× taxa base | Squad presente após burst (4–8s) |
| **Decadente** | 0.5× taxa base | Squad parado >8s sem mover |
| **Congelada** | 0× | Estado Contestada |
| **Descendo** | 0.5× taxa base (negativa) | Apenas inimigos dentro |

- Barra de captura visível na zona (arco ao redor do anel)
- Burst ativo: anel pulsando rapidamente, cor vibrante
- Decadente: anel pulsando devagar, cor apagada
- Múltiplos personagens na zona não multiplicam a taxa — apenas confirmam presença

### 3.4 Coleta de Recursos — Sinais de Controle

- Geração passiva e contínua em zonas Capturadas
- **Sem coleta manual**: Sinais acumulam em medidor de run (visível na UI)
- **Sistema de mochila não se aplica**: Sinais são recurso de fluxo, não item
- Ao fim dos 90s: total acumulado transferido ao hub
- Sinal mínimo garantido (1 zona pequena × 90s): 0.5 × 90 = **45 Sinais** (piso de calibração)

### 3.5 Inimigos

#### Recapturadores (tipo exclusivo desta zona)

- Comportamento: identificam a zona Capturada com maior geração em alcance e se movem para ela
- HP: 70 | Ao entrar: estado muda para Contestada; combate automático inicia
- Spawn em pontos fixos nos cantos (visíveis ao jogador — ameaça previsível)

| Tempo de Run | Frequência de Spawn | Qtd por Wave |
|---|---|---|
| 0–30s | 1 a cada 15s | 1–2 |
| 30–60s | 1 a cada 10s | 2–3 |
| 60–90s | 1 a cada 8s | 2–4 |

#### Inimigos de Pressão (Hordas reciclados)

- Runners e Bruisers: perseguem o squad diretamente (não contestam zonas)
- Forçam o jogador a se mover quando preferiria ficar parado
- Waves leves: 2–4 por wave, a cada 20s

#### Fail State

- Todos mortos = fail state; Sinais acumulados perdidos
- Mortes individuais reduzem cobertura do squad → aceleração de perda de zonas

---

## 4. Formulas

### Taxa de Captura com Sistema Cinético

```
taxa_base_zona_pequena  = 20%/s  (captura em 5s base; 1.67s com burst)
taxa_base_zona_media    = 10%/s  (captura em 10s base; 3.3s com burst)
taxa_base_zona_central  = 5%/s   (captura em 20s base; 6.7s com burst)

Burst: taxa × 3.0 por 4s após chegada em velocidade ≥160px/s
```

### Comparação de Estratégias

```
Estratégia A — Acampar Central (campar):
  Captura em 20s (burst), fica 70s → decaimento domina
  Total estimado: ~100 Sinais

Estratégia B — Circular entre 4 zonas pequenas:
  Ciclo por zona ~9s (burst 4s + deslocamento 5s); ~2.5 rodadas em 90s
  Burst: 4 × 2.5 × (3 × 0.5 × 4s) = 60 Sinais
  Normal: 4 × 2.5 × (0.5 × 5s) = 25 Sinais
  Total estimado: ~85 Sinais

Estratégia C — Central + circulação ativa nas médias (ótima):
  Reburst na central a cada ~15s; burst nas médias a cada visita
  Total estimado: ~200 Sinais

Circulação contínua vence acampamento em todas as estratégias.
```

### Tempo de Captura com Burst

```
zona_pequena  base: 5s  | burst: 1.7s
zona_media    base: 10s | burst: 3.3s
zona_central  base: 20s | burst: 6.7s  (60% em 4s de burst + 4s base)

Squad chegando sempre em velocidade captura zonas 3× mais rápido.
Múltiplos personagens na zona NÃO aceleram a taxa (presença, não multiplicador).
```

### Taxa de Descida de Zona (Recapturador sem oposição)

```
taxa_descida = 0.5 × taxa_subida_base

Zona pequena: perde em 10s (2× o tempo de captura base)
→ Jogador tem ~7.7s de margem após detectar ameaça (dado DPS squad ~30, elimina em ~2.3s)
```

---

## 5. Edge Cases

| Situação | Comportamento |
|----------|---------------|
| Squad na Central, Recapturador entra em zona Pequena | Zona Pequena vai para Perdida (não Contestada — sem presença do jogador) |
| Dois Recapturadores na mesma zona | Permanece Contestada; squad leva mais dano; barra não desce mais rápido |
| Squad dividido entre duas zonas | Cada zona contabiliza personagens dentro independentemente; combate local a cada zona |
| Personagem morre em zona Capturada | Se era o único, zona perde presença; outros personagens podem manter se estiverem dentro |
| Todos morrem na zona Central | Fail state; todos os Sinais acumulados perdidos |
| Zona Pequena e Central sobrepostas | Não permitido pelo gerador; distância mínima = raio_maior + 50px |
| Timer = 0 com Recapturador em combate | Timer tem prioridade; run encerra com Sinais acumulados; combate interrompido |
| Squad de 1 personagem capturando a Central | Válido — 20s de captura, personagem é o único defensor; arriscado |
| Contestada: squad eliminado da zona | Estado muda para Perdida; barra começa a descer normalmente |
| Recapturador vai para zona Neutra | Recapturador patrulha — alvo só ativa para zonas no estado Capturada |

---

## 6. Dependencies

| Sistema | Relação | Direção |
|---------|---------|---------|
| **Sistema de Squad (Zona Hordas)** | Squad, formação, combate automático, HP e stats herdados integralmente | Zona depende |
| **Sistema de Recursos** | Sinais de Controle registrados como recurso de fluxo (não item de mochila) | Zona fornece; Sistema deve suportar tipo "fluxo" |
| **Foguete (Hub)** | Sinais alimentam comunicações e telemetria do foguete | Foguete consome |
| **Hub / Mapa-Mundo** | Acesso controlado pelo hub | Hub controla acesso |
| **Sistema de Inimigos (Zona Hordas)** | Runners e Bruisers reutilizados; Recapturador é tipo novo específico | Zona herda + define novo tipo |
| **Gerador de Mapas** | Posições e tamanhos das zonas gerados proceduralmente; pontos de spawn dos Recapturadores fixos por layout | Zona define parâmetros |
| **Sistema de Timer** | Timer de 90s com encerramento automático; sem EXIT voluntário — comportamento único desta zona | Zona define comportamento específico |
| **Zona Hordas** | Zona irmã de squad; Controle de Campo é a Hordas com foco territorial | Dependência técnica + relação temática |

---

## 7. Tuning Knobs

| Parâmetro | Valor Base | Range Seguro | Categoria | Efeito |
|-----------|------------|--------------|-----------|--------|
| `timer_run` | 90s | 60–120s | Gate | <60s favorece quem captura cedo; >120s perde urgência |
| `n_zonas_captura` | 6 | 5–7 | Curve | Complexidade territorial |
| `n_zonas_pequenas` | 3–4 | 2–5 | Curve | Mais = mais válido espalhar o squad |
| `n_zonas_centrais` | 1 | 1 | Gate | Sempre 1 — é o landmark estratégico |
| `taxa_geracao_zona_central` | 2.5 Sinais/s | 1.5–4.0 | Curve | Valor da zona central |
| `tempo_captura_zona_pequena` | 5s | 3–8s | Feel | Tempo base sem burst |
| `tempo_captura_zona_central` | 20s | 15–30s | Gate | Burst reduz para ~6.7s |
| `taxa_descida_zona` | 0.5× taxa_subida | 0.3–0.8× | Feel | Velocidade de perda de zona |
| `burst_multiplicador` | 3.0× | 2.0–4.0× | Curve | Alto = trivializa captura; baixo = sem incentivo de movimento |
| `burst_duracao` | 4s | 2–6s | Feel | Longa = incentiva acampamento no burst |
| `burst_velocidade_minima` | 160 px/s | 120–180 px/s | Feel | Alto = difícil ativar em zonas próximas |
| `decadencia_trigger` | 8s | 5–12s | Gate | Baixo = punitivo para quem defende |
| `decadencia_fator` | 0.5× | 0.3–0.7× | Feel | Perceptível mas não dramático |
| `hp_recapturador` | 70 | 50–120 | Curve | Tempo para eliminar em combate |
| `frequencia_spawn_recapturador_early` | 15s | 10–25s | Gate | Pressão na primeira fase |
| `frequencia_spawn_recapturador_late` | 8s | 5–12s | Gate | Escalada de dificuldade |
| `freq_wave_inimigos_horda` | 20s | 15–30s | Gate | Pressão de dano secundária |

---

## 8. Acceptance Criteria

**Funcional (pass/fail para QA):**

- [ ] Squad chegando com velocidade ≥160px/s → taxa de captura 3× por 4s (burst ativo)
- [ ] Squad chegando com velocidade <160px/s → taxa de captura 1× (sem burst)
- [ ] Anel da zona pulsa visivelmente durante burst
- [ ] Squad parado >8s → taxa de captura cai para 0.5× (decadência); anel apagado
- [ ] Barra de captura congela quando jogador E Recapturador estão na mesma zona
- [ ] Zona capturada gera taxa correta de Sinais/s (0.5 / 1.0 / 2.5)
- [ ] Recapturador identifica zona Capturada com maior geração e se move para ela
- [ ] Timer de 90s encerra a run; Sinais transferidos ao hub
- [ ] Todos mortos = fail state; Sinais da run descartados
- [ ] Sem EXIT; run encerra apenas por timer ou fail state
- [ ] Sinais contabilizados como fluxo (não slot de mochila)

**Experiencial (validado por playtest):**

- [ ] Novo jogador percebe que "chegar correndo" acelera o anel — sem tutorial
- [ ] Após 2 runs, jogador testa conscientemente chegada em velocidade vs devagar
- [ ] Jogador que circula supera acampador em ≥30% mais Sinais
- [ ] Pulso do anel durante burst comunica "você fez certo" sem texto
- [ ] Decisão "para onde ir agora" ocorre a cada 4