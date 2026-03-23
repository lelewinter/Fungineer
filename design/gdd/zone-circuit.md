# Circuito Quebrado — Game Design Document

**Version**: 2.0
**Date**: 2026-03-23
**Status**: Revisado — Movimento como Corrente Elétrica

---

## 1. Overview

Zona de puzzle espacial em tempo real. O jogador percorre **fios coloridos no chão** em sequência para completar circuitos e abrir portas entre 3 câmaras, culminando na coleta do Núcleo Lógico. Mecânica central: mover sobre o fio correto é conduzir eletricidade — o personagem é a corrente.

O **Núcleo Lógico** é o processador de navegação autônoma do foguete.

---

## 2. Player Fantasy

Você é o elétron ausente num sistema de segurança de IA — o único vetor que os designers nunca consideraram. A satisfação é o clique preciso do engenheiro que encontrou onde o fio estava desconectado.

**Estética MDA primária**: Challenge (maestria de leitura espacial e execução de rota contínua).
**Estética secundária**: Discovery (entender o diagrama do circuito antes de percorrê-lo).

---

## 3. Detailed Rules

### 3.1 Estrutura da Run

- Jogador entra sozinho (squad fica na base)
- Mapa: **3 câmaras em sequência** (linear, layout procedural)
- Cada câmara tem circuito próprio e porta de saída
- Câmara 3 completa → **Núcleo Lógico** aparece no centro geométrico
- Após coletar, jogador deve chegar ao EXIT
- Morrer = perde todos os recursos da run
- Duração alvo: 60–120s por run

### 3.2 Interpretação do Movimento

- **Input**: arrastar o dedo = mover o personagem
- **Ativação de segmento**: mover sobre fio da cor correta por **1.0s contínuo** = segmento conduzido
- Parar sobre o fio = sem progresso, sem reset
- Sair do fio antes de 1.0s = progresso do segmento resetado
- Pisar em fio da cor **errada** = reset parcial (ver seção 4)

### 3.3 Mecânica Central — Fios e Circuitos

#### Fios de Pressão
- 3–5 fios por câmara, código-coloridos (3 cores: vermelho, amarelo, azul)
- Largura visual de 80px; cada fio tem múltiplos segmentos conectados por nós
- Fios se cruzam — cruzamentos exigem atenção

#### Sequência do Circuito
- Diagrama da câmara visível na UI durante toda a run (ícones coloridos em fileira, próximo piscando)
- Fio conduzido corretamente → acende permanentemente
- Indicador de sequência avança no diagrama

#### Condução Contínua
- Progresso visível como onda de luz percorrendo o fio na direção do movimento
- Sair do fio antes de completar → onda recua ao início do segmento (reset de segmento, não de câmara)
- Todos segmentos de um fio na sequência correta → fio conduzido

#### Reset Parcial — Fio Errado
- Pisar fio errado em movimento = reset parcial (N fios atrás)
- N por índice do erro:
  - Fio 1 ou 2 → volta ao passo 0
  - Fio 3 ou 4 → volta 2 fios atrás
  - Fio 5+ → volta 3 fios atrás
- Fios conduzidos corretamente retornam ao estado apagado
- Sequência-alvo permanece visível

#### Abertura de Porta
- Todos os fios conduzidos na sequência → porta abre com faísca elétrica pelo diagrama
- Câmara completa não reseta — porta permanece aberta para sempre na run

#### Variação de Câmaras

| Câmara | Fios / Segmentos | Patrulhas | Layout |
|--------|-----------------|-----------|--------|
| 1 | 2 fios, 3 seg. | 0 | Aberta, tutorial do sistema |
| 2 | 3 fios, 3–4 seg. | 1 | Corredor com cruzamentos |
| 3 | 4 fios, 4–5 seg. | 2 | Grade com cruzamentos múltiplos |

### 3.4 Cruzamentos de Fios

- Sistema verifica a cor predominante: fio cuja direção coincide com o vetor de movimento do personagem
- Cruzamento percorrido em < 0.3s na direção correta: sem penalidade
- Parar sobre cruzamento por > 0.3s: saiu do fio ativo → progresso do segmento reseta
- Cruzamentos sinalizados visualmente (ponto de brilho)

### 3.5 Coleta — Núcleo Lógico

- Aparece **somente após câmara 3 ser completada**, no centro geométrico da câmara 3
- Coleta: parar sobre o Núcleo por **1.5s** (padrão de mochila)
- 1 Núcleo por run; ocupa 1 slot de mochila
- Jogador ainda deve chegar ao EXIT após coletar

### 3.6 Risco e Fail State

#### Sentinelas de Circuito
- Patrulham entre câmaras em rotas fixas
- Caminham sobre fios — se Sentinela passa sobre fio sendo conduzido → condução interrompida (sobrecarga)
- Toque no jogador: -1 HP
- Jogador sem combate — deve desviar por movimento
- HP: 3 (HP zero = fail state, perde tudo)

#### Pressão de Tempo
- Timer visível: **90 segundos**
- Timer zera antes de sair com Núcleo = fail state

#### Pressão Combinada
- Cenário central: percorrer fio correto em movimento contínuo com Sentinela se aproximando pelo mesmo fio
- Escolha: continuar no fio (risco de intercepção) ou sair temporariamente (perde progresso do segmento, preserva HP)

---

## 4. Formulas

### Tempo de Condução por Segmento

```
tempo_conducao = 1.0s (por segmento de fio, fixo)
```

### Cálculo de Reset Parcial

```
fios_retroceder(erro_em_fio_F):
  Se F <= 2: retrocede para fio 0
  Se F == 3 ou F == 4: retrocede F - 2 fios
  Se F >= 5: retrocede 3 fios

Exemplos (câmara 3, 4 fios):
  Erro no fio 1 → volta ao fio 0
  Erro no fio 3 → volta ao fio 1
  Erro no fio 4 → volta ao fio 1
```

### Tempo Esperado por Câmara (sem erros)

```
tempo_camara = Σ (n_segmentos_fio × tempo_conducao + tempo_deslocamento_entre_fios)

  n_segmentos_fio          = 3–5 por fio
  tempo_conducao           = 1.0s por segmento
  tempo_deslocamento_fios  = ~1.5s (média estimada)

Câmara 1 (2 × 3 seg):  2 × (3 × 1.0 + 1.5) = 9.0s
Câmara 2 (3 × 3.5 seg): 3 × (3.5 × 1.0 + 1.5) = 15.0s
Câmara 3 (4 × 4.5 seg): 4 × (4.5 × 1.0 + 1.5) = 24.0s

Total ideal: ~48s | Timer: 90s | Buffer: ~42s (~2 resets ou ~5 interrupções)
```

### Velocidade dos Sentinelas

```
velocidade_sentinela   = 120 px/s (constante)
velocidade_jogador_max = 200 px/s

Jogador sempre mais rápido. Ameaça = interceptação de rota, não perseguição.
```

---

## 5. Edge Cases

| Situação | Comportamento |
|----------|---------------|
| Jogador em cruzamento com dois fios na sequência possível | Fio cuja direção coincide com o vetor de movimento é o fio ativo |
| Sentinela parado sobre segmento que o jogador precisa percorrer | Bloqueia fisicamente; jogador aguarda ou contorna. Sentinela retoma patrulha em 3s estático |
| Timer zera com condução do último fio em andamento | Timer tem prioridade; fail state imediato. Sem crédito parcial |
| Câmara 3 completa, Núcleo aparece, jogador morre antes de coletar | Fail state: Núcleo desaparece, run perdida sem recursos |
| Jogador tenta entrar na câmara 2 sem completar câmara 1 | Impossível — câmaras separadas por portas que só abrem com câmara anterior completa |
| Sentinela no mesmo fio que o jogador na mesma direção | Frente: bloqueia rota. Atrás: cria urgência para completar segmento antes de ser alcançado |
| Jogador começa a conduzir fio errado por engano | Brilho vermelho imediato; reset parcial dispara ao completar 0.3s sobre o fio errado em movimento |
| Mochila cheia ao tentar coletar o Núcleo | Ativação não inicia; Núcleo permanece no chão. EXIT sem Núcleo = run sem o item de alto valor |
| Dois Sentinelas na câmara 3 no mesmo fio | Rotas independentes; geradas sem colisão entre eles |
| Sequência procedural repete mesma cor 3× seguidas | Permitido — desafio de rastreamento espacial. Fios de mesma cor em posições diferentes requerem identificação correta |

---

## 6. Dependencies

| Sistema | Relação | Direção |
|---------|---------|---------|
| **Sistema de Mochila** | Núcleo Lógico ocupa 1 slot; mochila cheia bloqueia coleta | Zona depende |
| **Sistema de Recursos** | Núcleo Lógico entregue ao hub como recurso de foguete | Zona fornece |
| **Foguete (Hub)** | Núcleos constroem o Processador de Navegação | Foguete consome |
| **Hub / Mapa-Mundo** | Acesso à zona a partir do hub | Hub controla acesso |
| **Sistema de Fios** | Geometria de caminho, cor, segmentos, progresso de condução, interação com Sentinelas — sistema novo específico desta zona | Zona define e cria |
| **Gerador de Mapas** | Câmaras, fios, cruzamentos e rotas de Sentinelas gerados proceduralmente | Zona depende com suporte a geometria de fio |
| **Sistema de HP** | Jogador tem 3 HP nesta zona | Zona configura via sistema compartilhado |
| **Zona Hordas** | Zona irmã de combate; contraponto intelectual | Relação temática |
| **Zona Stealth** | Zona irmã de tensão; modo solo compartilhado | Relação temática; compartilha asset de personagem solo |

---

## 7. Tuning Knobs

| Parâmetro | Valor Base | Range Seguro | Categoria | Efeito |
|-----------|------------|--------------|-----------|--------|
| `tempo_conducao_segmento` | 1.0s | 0.6–1.8s | Feel | Ritmo de percurso |
| `tolerancia_cruzamento` | 0.3s | 0.2–0.5s | Feel | Janela de passagem sem penalidade |
| `largura_fio` | 80px | 60–100px | Feel | Facilidade de manter-se no fio |
| `timer_run` | 90s | 60–120s | Gate | Pressão de fundo |
| `hp_jogador` | 3 | 2–5 | Gate | Tolerância a hits de Sentinela |
| `velocidade_sentinela` | 120 px/s | 80–160 px/s | Feel | Ameaça dos Sentinelas |
| `n_fios_camara_1` | 2 | 1–3 | Curve | Dificuldade da câmara tutorial |
| `n_fios_camara_2` | 3 | 2–4 | Curve | Dificuldade da câmara intermediária |
| `n_fios_camara_3` | 4 | 3–5 | Curve | Dificuldade da câmara final |
| `n_segmentos_por_fio` | 3–5 | 2–6 | Curve | Distância de percurso por fio |
| `n_cores` | 3 | 2–4 | Curve | Complexidade de identificação |
| `sentinelas_camara_3` | 2 | 1–3 | Gate | Pressão de interceptação final |
| `fios_reset_erro_tardio` | 3 | 2–4 | Feel | Punição por fio errado tarde na sequência |

---

## 8. Acceptance Criteria

**Funcional (pass/fail para QA):**

- [ ] Run completa (3 câmaras + Núcleo + EXIT) possível em 45–90s
- [ ] Percorrer segmento da cor correta por 1.0s contínuo marca como conduzido (acende)
- [ ] Sair do fio antes de 1.0s reseta progresso do segmento (sem reset de câmara)
- [ ] Pisar em fio errado por ≥0.3s em movimento dispara reset parcial correto (conforme tabela seção 4)
- [ ] Completar todos os fios na sequência abre a porta em 100% dos casos
- [ ] Sentinela que toca o jogador remove exatamente 1 HP
- [ ] Sentinela que passa sobre fio ativo interrompe a condução (segmento reseta)
- [ ] Cruzamento percorrido em < 0.3s na direção correta não reseta progresso
- [ ] 0 HP → fail state, retorno ao hub sem recursos
- [ ] Timer zerando antes de sair com Núcleo = fail state
- [ ] Núcleo não aparece antes de câmara 3 ser completada
- [ ] Sequência-alvo sempre visível na UI durante a run

**Experiencial (validado por playtest):**

- [ ] Novo jogador entende o sistema de fios sem tutorial, apenas pela câmara 1
- [ ] Personagem em movimento sobre fio iluminado comunica "conduzindo eletricidade"
- [ ] Erro (fio errado) é imediatamente compreendido pelo jogador
- [ ] Sentinela durante percurso cria tensão percebida, não frustração injusta
- [ ] Run sem erros e sem hits sente como "domínio do circuito"
- [ ] Coleta do Núcleo após 3 câmaras sente como recompensa merecida

---

*Relacionado: `design/gdd/game-concept.md`, `design/gdd/resource-system.md`, `design/gdd/zone-stealth.md`*
