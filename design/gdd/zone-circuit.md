# Circuito Quebrado — Game Design Document

**Version**: 2.0
**Date**: 2026-03-23
**Status**: Revisado — Movimento como Corrente Elétrica

---

## 1. Overview

O Circuito Quebrado é uma zona de puzzle espacial em tempo real. O jogador navega sozinho por câmaras interligadas, percorrendo **fios coloridos no chão** na sequência correta para completar o circuito e abrir o caminho até o Núcleo Lógico. O mapa é dividido em múltiplas câmaras separadas por portas trancadas; cada câmara contém um conjunto de fios coloridos que devem ser percorridos em ordem. A mecânica central é que **mover é conduzir eletricidade** — o jogador não resolve o puzzle pensando com a cabeça, mas com o corpo, percorrendo os fios na sequência exata como uma corrente que completa o circuito.

O recurso coletado, **Núcleo Lógico**, é usado no foguete como o processador central do sistema de navegação autônoma — a "mente" do foguete que calculará a trajetória de escape orbital.

---

## 2. Player Fantasy

Você está hackeando um sistema de segurança de IA usando o único método que os designers nunca consideraram: caminhar. Cada câmara é um circuito quebrado que a IA não consegue mais executar sozinha — os elétrons pararam de fluir. Você é o elétron ausente. Quando a última porta se abre e o Núcleo aparece no centro da câmara, há uma satisfação limpa — não a euforia do combate, mas o clique elétrico de ter conduzido a corrente pelo caminho certo. É o prazer do engenheiro que encontrou onde o fio estava desconectado.

**Estética MDA primária**: Challenge (maestria de leitura espacial e execução de rota contínua).
**Estética secundária**: Discovery (entender o diagrama do circuito antes de percorrê-lo).

---

## 3. Detailed Rules

### 3.1 Estrutura da Run

- O jogador entra sozinho (squad fica na base)
- O mapa é dividido em **3 câmaras em sequência** (linear, com variações de layout procedural)
- Cada câmara tem seu próprio circuito e sua própria porta de saída
- A porta final (câmara 3) libera o **Núcleo Lógico** ao centro
- Após coletar o Núcleo, o jogador deve chegar ao ponto de saída (EXIT) para completar a run
- Morrer = perde todos os recursos da run (fail state padrão)
- Duração alvo: 60–120 segundos por run

### 3.2 Interpretação do Movimento (como arrastar funciona aqui)

- **Input**: arrastar o dedo = mover o personagem (padrão do jogo)
- **Significado aqui**: mover sobre um fio da cor correta = conduzir eletricidade. O personagem é a corrente. Ficar sobre o fio e em movimento é o que alimenta o circuito
- **Ativação de segmento**: o personagem deve **mover-se sobre o fio da cor correta por 1.0 segundo contínuo** sem sair do fio para que aquele segmento seja "conduzido"
- Parar completamente sobre o fio = pausa na condução (sem reset, mas sem progresso)
- Sair do fio antes de completar 1.0s = segmento não conduzido, progresso do segmento resetado
- Mover sobre o fio da cor **errada** = reset parcial (perde N segmentos, como definido nas formulas)

**Contraste intencional com outras zonas:**
- Zona Hordas: parar é perigoso (inimigos se aproximam)
- Zona Stealth: parar é seguro (elimina ruído)
- Circuito Quebrado: mover no fio certo é a única forma de progredir — mas sair do fio, e mais ainda pisar no fio errado, tem custo

### 3.3 Mecânica Central — Sistema de Fios e Circuitos

#### Fios de Pressão

- Cada câmara tem **3 a 5 fios no chão** com caminhos visíveis e distintos
- Os fios são **código-coloridos**: 3 cores disponíveis (vermelho, amarelo, azul)
- Cada fio tem uma **largura visual** clara (80px de largura — fácil de percorrer com o personagem)
- Um fio pode ter vários **segmentos** (trechos retos ou curvos conectados por nós)
- Os fios se cruzam — o jogador deve navegar as intersecções com atenção

#### Sequência do Circuito

- Cada câmara mostra um **diagrama do circuito** na parede: a ordem em que os fios devem ser percorridos (ex: Azul → Vermelho → Azul → Amarelo)
- O diagrama é visível na UI durante toda a câmara (ícones coloridos em fileira, o próximo piscando)
- Um fio conduzido corretamente **acende** completamente (brilho constante ao longo de todo o comprimento)
- Um indicador de sequência avança no diagrama

#### Condução Contínua

- O segmento atual acumula progresso enquanto o personagem se move sobre ele
- A barra de progresso do segmento é visível como uma onda de luz percorrendo o fio na direção do movimento
- Se o personagem sai do fio antes de completar, a onda recua ao início do segmento (reset de segmento, não de câmara)
- Completar todos os segmentos de um fio na sequência correta = fio conduzido (acende permanentemente)

#### Reset Parcial — Fio Errado

- Pisar no fio da cor errada (na sequência) = **reset parcial**: o progresso volta N fios atrás, não ao início
- N é determinado pelo índice do erro:
  - Erro no fio 1 ou 2 = volta ao início (passo 0)
  - Erro no fio 3 ou 4 = volta 2 fios atrás
  - Erro no fio 5+ = volta 3 fios atrás
- Os fios conduzidos corretamente retornam ao estado apagado conforme o reset
- A sequência-alvo permanece visível — o jogador sabe o que precisa repetir
- **Não há reset por sair do fio** — apenas por pisar no fio errado. Sair do fio é apenas perda de progresso daquele segmento

#### Abertura de Porta

- Quando todos os fios da câmara são conduzidos na sequência correta: a porta de saída abre com efeito visual/sonoro claro (faísca elétrica percorre o diagrama completo)
- O jogador pode avançar para a próxima câmara
- Uma câmara completa **não reseta** — a porta permanece aberta para sempre nessa run

#### Variação de Câmaras

| Câmara | Fios na Sequência | Patrulhas | Layout |
|--------|-------------------|-----------|--------|
| 1 | 2 fios, 3 segmentos cada | 0 inimigos | Aberta, aprende o sistema |
| 2 | 3 fios, 3–4 segmentos cada | 1 patrulha | Corredor com cruzamentos |
| 3 | 4 fios, 4–5 segmentos cada | 2 patrulhas | Layout em grade com cruzamentos múltiplos |

### 3.4 Cruzamentos de Fios — O Desafio de Navegação

Cruzamentos são os pontos onde dois fios de cores diferentes se sobrepõem. O jogador deve navegar cruzamentos com precisão:

- **No cruzamento**: o sistema verifica a cor predominante sob o personagem (o fio que o personagem está seguindo)
- Se o personagem está percorrendo o fio azul e cruza sobre um trecho vermelho: sem penalidade se ele continua na direção do fio azul em menos de 0.3s
- Se o personagem **para** sobre um cruzamento por mais de 0.3s: o sistema considera que ele saiu do fio ativo → progresso do segmento reseta
- Cruzamentos são sinalizados visualmente (ponto de brilho onde os fios se encontram)

### 3.5 Coleta de Recurso — Núcleos Lógicos

- O **Núcleo Lógico** aparece **somente após a câmara 3 ser completada**
- O Núcleo aparece no centro geométrico da câmara 3
- Coleta: o jogador para completamente sobre o Núcleo por **1.5 segundos** (padrão do sistema de mochila)
- Um Núcleo por run (não há múltiplos no mapa — 1 item de alto valor)
- O jogador ainda deve chegar ao EXIT após coletar o Núcleo — o EXIT está fora da câmara 3
- Sistema de mochila padrão: o Núcleo ocupa 1 slot

**Nota de design — por que 1 recurso de alto valor?**
A tensão desta zona não vem de "quanto coletar" mas de "conseguir completar o circuito sob pressão". O recurso é a recompensa da maestria, não da grind. A decisão de sair cedo não existe aqui — você coleta 1 coisa ou 0 coisas.

### 3.6 Risco e Fail State

#### Inimigos — Guardiões de Câmara

- Tipo: **Sentinela de Circuito** — inimigo que patrulha entre câmaras em rotas fixas
- **Nova interação**: Sentinelas caminham sobre os fios, perturbando a condução — se o Sentinela passar sobre um fio que o jogador está conduzindo, a condução é interrompida (como uma sobrecarga no circuito)
- Se tocarem o jogador: **dano direto** (-1 HP)
- O jogador não tem combate ativo — deve desviar dos Sentinelas usando movimento
- Desafio real: executar a rota do fio enquanto o Sentinela aproxima pelo mesmo fio
- HP do jogador: 3 hits (3 HP, cada toque de Sentinela = -1 HP)
- HP zera = fail state (perde tudo da run)

#### Pressão de Tempo

- Timer visível da run: **90 segundos**
- Ao completar todas as câmaras + coletar Núcleo + chegar ao EXIT em tempo: run completa com sucesso
- Timer zera antes de sair com Núcleo = **fail state** (perde o Núcleo e a run)

#### Pressão Combinada

A pressão real é: percorrer o fio correto em movimento contínuo enquanto um Sentinela se aproxima pelo mesmo fio. O jogador deve escolher entre:
- Continuar no fio (mas o Sentinela vai interceptar)
- Sair do fio temporariamente para desviar (perde progresso do segmento, mas preserva HP)

---

## 4. Formulas

### Tempo de Condução por Segmento

```
tempo_conducao = 1.0s (por segmento de fio, fixo)

Justificativa: longo o suficiente para exigir atenção e ser interrompível por
Sentinelas, curto o suficiente para criar ritmo de movimento fluente.
Contraste com v1 (parada de 0.8s): mover é mais natural e imersivo que parar.
```

### Cálculo de Reset Parcial

```
fios_retroceder(erro_em_fio_F):
  Se F <= 2: retrocede para fio 0 (reset total)
  Se F == 3 ou F == 4: retrocede F - 2 fios
  Se F >= 5: retrocede 3 fios

Exemplos (câmara 3, 4 fios):
  Erro no fio 1 → volta ao fio 0 (refaz tudo)
  Erro no fio 3 → volta ao fio 1 (refaz a partir do fio 2)
  Erro no fio 4 → volta ao fio 1 (refaz fios 2, 3, 4)
```

### Tempo Esperado por Câmara (sem erros)

```
tempo_camara = soma de (n_segmentos_fio × tempo_conducao + tempo_deslocamento_entre_fios)

Variáveis:
  n_segmentos_fio           = segmentos por fio (3–5)
  tempo_conducao            = 1.0s por segmento
  tempo_deslocamento_fios   = estimativa de 1.5s de deslocamento entre fios (média)

Câmara 1 (2 fios × 3 segmentos): 2 × (3 × 1.0 + 1.5) = 2 × 4.5 = 9.0s (ideal, sem inimigos)
Câmara 2 (3 fios × 3.5 seg avg): 3 × (3.5 × 1.0 + 1.5) = 3 × 5.0 = 15.0s (ideal)
Câmara 3 (4 fios × 4.5 seg avg): 4 × (4.5 × 1.0 + 1.5) = 4 × 6.0 = 24.0s (ideal)

Total ideal: ~48s
Timer: 90s
Buffer: ~42s (~2 resets totais ou ~5 interrupções por Sentinelas)
```

### Velocidade dos Sentinelas

```
velocidade_sentinela = 120 px/s (constante)
velocidade_jogador_max = 200 px/s

O jogador é sempre mais rápido que o Sentinela.
A ameaça é o sentinela interceptando a rota do fio, não a perseguição.
```

---

## 5. Edge Cases

| Situação | Comportamento |
|----------|---------------|
| Jogador no cruzamento de dois fios, ambos na sequência possível | Sistema verifica a direção do movimento do personagem; o fio cuja direção mais coincide com o vetor de movimento é o fio ativo |
| Sentinela parado sobre um segmento do fio que o jogador precisa percorrer | Sentinela bloqueia fisicamente o segmento; o jogador pode aguardar ou tentar desviar pelo lado. Sentinela retoma patrulha em 3s de posição estática |
| Timer zera enquanto jogador está conduzindo o último fio (progresso em andamento) | Timer tem prioridade; fail state acionado. Não há crédito parcial |
| Câmara 3 completa, Núcleo aparece, mas jogador morre antes de coletar | Fail state: Núcleo desaparece; run perdida sem recursos |
| Jogador entra na câmara 2 antes de completar câmara 1 | Câmaras são fisicamente separadas por portas; câmara 2 só abre quando câmara 1 é completada — situação impossível |
| Sentinela percorre o mesmo fio que o jogador na mesma direção | Sentinela na frente: bloqueia a rota até o fio. Sentinela atrás: cria urgência; o jogador deve completar o segmento antes de ser alcançado |
| Jogador começa a conduzir fio errado por engano | Brilho vermelho imediato no fio (indicador de cor errada); reset parcial dispara ao completar 0.3s sobre o fio errado em movimento |
| Mochila cheia ao tentar coletar o Núcleo | Ativação não inicia; o Núcleo permanece no chão. O jogador pode ir ao EXIT sem o Núcleo — mas perde o item de alto valor da run |
| Dois Sentinelas na câmara 3 se movem para o mesmo fio ao mesmo tempo | Cada Sentinela tem rota independente; rota é gerada sem colisão entre eles na geração do mapa |
| Sequência-alvo gerada proceduralmente repete a mesma cor 3 vezes seguidas | Permitido — é um desafio de rastreamento espacial válido. Fios da mesma cor em posições diferentes requerem que o jogador saiba qual percorrer primeiro |

---

## 6. Dependencies

| Sistema | Relação | Direção |
|---------|---------|---------|
| **Sistema de Mochila** | O Núcleo Lógico ocupa 1 slot; mochila cheia bloqueia coleta | Zona depende do Sistema de Mochila |
| **Sistema de Recursos** | O Núcleo Lógico é entregue ao hub como recurso de foguete | Zona fornece recurso; Sistema de Recursos recebe |
| **Foguete (Hub)** | Núcleos Lógicos são usados para construir o Processador de Navegação | Foguete consome Núcleos |
| **Hub / Mapa-Mundo** | Jogador acessa a zona a partir do hub | Hub controla acesso |
| **Sistema de Fios (novo)** | Fios têm geometria de caminho, cor, segmentos, progresso de condução e interação com Sentinelas; sistema novo específico desta zona | Zona define e cria o Sistema de Fios |
| **Gerador de Mapas** | As câmaras, fios, cruzamentos e rotas de Sentinelas são gerados proceduralmente | Zona depende do Gerador com suporte a geometria de fio |
| **Sistema de HP** | O jogador tem 3 HP nesta zona | Zona configura HP via sistema compartilhado |
| **Zona Hordas** | Zona irmã de combate; Circuito Quebrado é o contraponto intelectual | Relação temática |
| **Zona Stealth** | Zona irmã de tensão; compartilha o solo mode | Relação temática; compartilha asset de personagem solo |

---

## 7. Tuning Knobs

| Parâmetro | Valor Base | Range Seguro | Categoria | Efeito no Gameplay |
|-----------|------------|--------------|-----------|---------------------|
| `tempo_conducao_segmento` | 1.0s | 0.6–1.8s | Feel | Ritmo de percurso; muito baixo = trivial, muito alto = frustrante com sentinelas perto |
| `tolerancia_cruzamento` | 0.3s | 0.2–0.5s | Feel | Janela de passagem em cruzamento sem penalidade; muito baixa = injusto, muito alta = trivial |
| `largura_fio` | 80px | 60–100px | Feel | Facilidade de manter-se sobre o fio; mais estreito = mais preciso, mais exigente |
| `timer_run` | 90s | 60–120s | Gate | Pressão de fundo |
| `hp_jogador` | 3 | 2–5 | Gate | Tolerância a hits de Sentinela |
| `velocidade_sentinela` | 120 px/s | 80–160 px/s | Feel | Ameaça dos Sentinelas |
| `n_fios_camara_1` | 2 | 1–3 | Curve | Dificuldade da câmara tutorial |
| `n_fios_camara_2` | 3 | 2–4 | Curve | Dificuldade da câmara intermediária |
| `n_fios_camara_3` | 4 | 3–5 | Curve | Dificuldade da câmara final |
| `n_segmentos_por_fio` | 3–5 | 2–6 | Curve | Distância de percurso por fio |
| `n_cores` | 3 | 2–4 | Curve | Complexidade de identificação dos fios |
| `sentinelas_camara_3` | 2 | 1–3 | Gate | Pressão de interceptação na câmara final |
| `fios_reset_erro_tardio` | 3 | 2–4 | Feel | Punição por pisar no fio errado tarde na sequência |

---

## 8. Acceptance Criteria

**Funcional (pass/fail para QA):**

- [ ] Uma run completa (3 câmaras + coleta do Núcleo + EXIT) é possível entre 45 e 90 segundos
- [ ] Percorrer um segmento de fio da cor correta por 1.0s contínuo marca o segmento como conduzido (acende)
- [ ] Sair do fio antes de 1.0s reseta o progresso do segmento atual (fio apaga, sem reset de câmara)
- [ ] Pisar em fio da cor errada em movimento por 0.3s+ dispara reset parcial correto (conforme tabela da seção 4)
- [ ] Completar todos os fios na sequência de uma câmara abre a porta de saída em 100% dos casos
- [ ] Sentinela que toca o jogador remove exatamente 1 HP
- [ ] Sentinela que passa sobre fio ativo interrompe a condução (progresso do segmento reseta)
- [ ] Cruzamento percorrido em menos de 0.3s na direção correta não reseta progresso
- [ ] Jogador com 0 HP entra em fail state e retorna ao hub sem recursos
- [ ] Timer zerando antes de sair com Núcleo = fail state
- [ ] Núcleo Lógico não aparece antes de a câmara 3 ser completada
- [ ] A sequência-alvo da câmara atual é sempre visível na UI durante a run

**Experiencial (validado por playtest):**

- [ ] Novo jogador entende o sistema de fios sem tutorial — apenas vendo a câmara 1 (2 fios, sem inimigos)
- [ ] O personagem movendo-se sobre o fio iluminado comunica visualmente "estou conduzindo eletricidade"
- [ ] Ao cometer um erro (fio errado), o jogador entende imediatamente o que aconteceu
- [ ] A presença do Sentinela durante percurso do fio cria tensão percebida, não frustração injusta
- [ ] Uma run sem erros e sem hits sente como "domínio do circuito"
- [ ] A coletar do Núcleo Lógico após completar as 3 câmaras sente como recompensa merecida

---

*Relacionado: `design/gdd/game-concept.md`, `design/gdd/resource-system.md`, `design/gdd/zone-stealth.md`*
