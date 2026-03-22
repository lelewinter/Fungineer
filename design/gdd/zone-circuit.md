# Circuito Quebrado — Game Design Document

**Version**: 1.0
**Date**: 2026-03-22
**Status**: Draft

---

## 1. Overview

O Circuito Quebrado é uma zona de puzzle espacial em tempo real. O jogador navega sozinho por câmaras interligadas, pisando em placas de pressão no chão em uma sequência correta para abrir o caminho até o Núcleo Lógico. O mapa é dividido em múltiplas câmaras separadas por portas trancadas; cada câmara contém um conjunto de placas coloridas que devem ser ativadas na ordem certa. Inimigos patrulham entre as câmaras criando janelas de execução. A mecânica central é que **mover é dar input lógico** — o jogador não resolve o puzzle pensando com a cabeça, mas com o corpo, movendo-se pelas placas certas na sequência certa.

O recurso coletado, **Núcleo Lógico**, é usado no foguete como o processador central do sistema de navegação autônoma — a "mente" do foguete que calculará a trajetória de escape orbital.

---

## 2. Player Fantasy

Você está hackeando um sistema de segurança de IA usando o único método que os designers nunca consideraram: andar no lugar certo. Cada câmara é um circuito quebrado que a IA não consegue mais executar sozinha. Você é o processador ausente. Quando a última porta se abre e o Núcleo aparece no centro da câmara, há uma satisfação limpa — não a euforia do combate, mas o clique silencioso de ter entendido o sistema antes dele entender você. É o prazer do programador que encontrou o bug.

**Estética MDA primária**: Challenge (maestria de leitura espacial e execução sequencial).
**Estética secundária**: Discovery (entender o padrão da câmara antes de executar).

---

## 3. Detailed Rules

### 3.1 Estrutura da Run

- O jogador entra sozinho (squad fica na base)
- O mapa é dividido em **3 câmaras em sequência** (linear, com variações de layout procedural)
- Cada câmara tem seu próprio conjunto de placas e sua própria porta de saída
- A porta final (câmara 3) libera o **Núcleo Lógico** ao centro
- Após coletar o Núcleo, o jogador deve chegar ao ponto de saída (EXIT) para completar a run
- Morrer = perde todos os recursos da run (fail state padrão)
- Duração alvo: 60–120 segundos por run

### 3.2 Interpretação do Movimento (como arrastar funciona aqui)

- **Input**: arrastar o dedo = mover o personagem (padrão do jogo)
- **Significado aqui**: cada posição no mapa tem valor lógico. Mover = ativar o que está embaixo dos seus pés
- **Ativação de placa**: o personagem precisa **parar completamente sobre uma placa por 0.8 segundos** para ativá-la (mais rápido que coleta de recurso — o ritmo é mais agressivo)
- Movimento sobre uma placa sem parar = placa não ativada, nenhum efeito
- A direção do movimento importa para navegação, mas não para ativação — só a parada conta

**Contraste intencional com outras zonas:**
- Zona Hordas: parar é perigoso (inimigos se aproximam)
- Zona Stealth: parar é seguro (elimina ruído)
- Circuito Quebrado: parar é o único jeito de progredir — mas na placa errada, o custo é voltar na sequência

### 3.3 Mecânica Central — Sistema de Placas e Sequências

#### Placas de Pressão

- Cada câmara tem **4 a 6 placas** distribuídas no chão
- As placas são **código-coloridas**: 3 cores disponíveis (vermelho, amarelo, azul)
- Uma câmara pode ter múltiplas placas da mesma cor
- Cada câmara mostra uma **sequência-alvo** na parede — ícones coloridos na ordem correta (ex: Azul → Vermelho → Azul → Amarelo)

#### Ativação e Progresso

- O jogador deve pisar nas placas na ordem mostrada pela sequência-alvo
- Uma placa ativada corretamente **acende** (brilho intenso) e um indicador de sequência avança
- A sequência-alvo fica visível na UI durante toda a câmara (ícones coloridos em fileira, o próximo piscando)

#### Reset Parcial — Erro na Sequência

- Pisar na cor errada = **reset parcial**: o progresso volta N passos atrás, não ao início
- N é determinado pelo índice do erro:
  - Erro no passo 1 ou 2 = volta ao início (passo 0)
  - Erro no passo 3 ou 4 = volta 2 passos atrás
  - Erro no passo 5+ = volta 3 passos atrás
- As placas ativadas corretamente retornam ao estado neutro conforme o reset
- A sequência-alvo permanece visível — o jogador sabe o que precisa repetir
- Não há penalidade de tempo pelo erro além do tempo perdido refazendo passos

#### Abertura de Porta

- Quando a sequência da câmara é completada: a porta de saída abre com efeito visual/sonoro claro
- O jogador pode avançar para a próxima câmara
- Uma câmara completa **não reseta** — a porta permanece aberta para sempre nessa run

#### Variação de Câmaras

| Câmara | Sequência | Patrulhas | Layout |
|--------|-----------|-----------|--------|
| 1 | 3 passos, 4 placas | 0 inimigos | Aberta, aprende o sistema |
| 2 | 4 passos, 5 placas | 1 patrulha | Corredor central, placas nas bordas |
| 3 | 5 passos, 6 placas | 2 patrulhas | Layout em cruz, placas nos quadrantes |

### 3.4 Coleta de Recurso — Núcleos Lógicos

- O **Núcleo Lógico** aparece **somente após a câmara 3 ser completada**
- O Núcleo aparece no centro geométrico da câmara 3
- Coleta: o jogador para completamente sobre o Núcleo por **1.5 segundos** (padrão do sistema de mochila)
- Um Núcleo por run (não há múltiplos no mapa — 1 item de alto valor)
- O jogador ainda deve chegar ao EXIT após coletar o Núcleo — o EXIT está fora da câmara 3
- Sistema de mochila padrão: o Núcleo ocupa 1 slot

**Nota de design — por que 1 recurso de alto valor?**
A tensão desta zona não vem de "quanto coletar" mas de "conseguir completar o puzzle sob pressão". O recurso é a recompensa da maestria, não da grind. A decisão de sair cedo não existe aqui — você coleta 1 coisa ou 0 coisas.

### 3.5 Risco e Fail State

#### Inimigos — Guardiões de Câmara

- Tipo: **Sentinela de Circuito** — inimigo que patrulha entre câmaras em rotas fixas
- Não perseguem como na Zona Stealth — ao detectar o jogador, carregam em linha reta na direção dele
- Se tocarem o jogador: **dano direto** (o jogador tem HP nesta zona, diferente de Stealth onde detecção = fim)
- O jogador não tem combate ativo — deve desviar dos Sentinelas usando movimento
- HP do jogador: 3 hits (3 HP, cada toque de Sentinela = -1 HP)
- HP zera = fail state (perde tudo da run)

#### Pressão de Tempo

- Timer visível da run: **90 segundos**
- Ao completar todas as câmaras + coletar Núcleo + chegar ao EXIT em tempo: run completa com sucesso
- Timer zera antes de sair com Núcleo = **fail state** (perde o Núcleo e a run)
- Timer zera antes de completar o puzzle = fail state (Núcleo nunca aparece)
- O timer é pressão de fundo — um jogador que entende as sequências tem tempo confortável; a pressão real vem de resets por erros

#### Pressão Combinada

A pressão real é: executar a sequência correta enquanto um Sentinela está se aproximando. O jogador deve escolher entre:
- Completar o passo atual (mas o Sentinela vai chegar)
- Mover para desviar (e perder o progresso parcial da ativação atual)

---

## 4. Formulas

### Tempo de Ativação de Placa

```
tempo_ativacao = 0.8s (fixo, não varia com upgrades)

Justificativa: mais rápido que coleta de recurso (1.5s) porque ativações
são numerosas por run. Rápido o suficiente para criar ritmo, lento o suficiente
para ser interrompível por Sentinelas.
```

### Cálculo de Reset Parcial

```
passos_retroceder(erro_em_passo_P):
  Se P <= 2: retrocede para passo 0 (reset total)
  Se P == 3 ou P == 4: retrocede P - 2 passos
  Se P >= 5: retrocede 3 passos

Exemplos:
  Câmara 3 tem sequência de 5 passos: [Azul, Vermelho, Azul, Amarelo, Azul]
  Erro no passo 1 → volta ao passo 0 (refaz tudo)
  Erro no passo 3 → volta ao passo 1 (refaz a partir do passo 2)
  Erro no passo 5 → volta ao passo 2 (refaz passos 3, 4, 5)
```

### Tempo Esperado por Câmara (sem erros)

```
tempo_camara = (n_passos × tempo_ativacao) + tempo_deslocamento_medio

Variáveis:
  n_passos              = número de passos na sequência da câmara (3–5)
  tempo_ativacao        = 0.8s por placa
  tempo_deslocamento    = estimativa de 2.0s de caminhada entre placas (média)

Câmara 1: 3 × 0.8 + 3 × 2.0 = 2.4 + 6.0 = 8.4s (ideal, sem inimigos)
Câmara 2: 4 × 0.8 + 4 × 2.0 = 3.2 + 8.0 = 11.2s (ideal, 1 patrulha)
Câmara 3: 5 × 0.8 + 5 × 2.0 = 4.0 + 10.0 = 14.0s (ideal, 2 patrulhas)

Total ideal (sem erros, sem desvios): ~34s
Timer da run: 90s
Buffer para erros e desvios: ~56s (~1.6 erros por placa ou ~4-6 desvios totais)
```

### Velocidade dos Sentinelas

```
velocidade_sentinela = 120 px/s (constante)
velocidade_jogador_max = 200 px/s

O jogador é sempre mais rápido que o Sentinela.
A ameaça é o sentinela bloqueando a rota até a próxima placa, não a perseguição.
```

### HP e Custo de Hit

```
hp_jogador = 3 hits
dano_por_hit = 1 HP
regeneracao_hp = nenhuma dentro da run

Sobrevivência mínima: completar a run com 1 HP restante ainda é vitória plena.
```

---

## 5. Edge Cases

| Situação | Comportamento |
|----------|---------------|
| Jogador pisa em duas placas ao mesmo tempo (borda entre elas) | Considera a placa com maior sobreposição de hitbox; segunda placa ignorada |
| Sentinela bloqueia exatamente a próxima placa da sequência | Sentinela tem hitbox menor que a placa; jogador pode se posicionar parcialmente. Se não for possível, Sentinela sai da posição após 3s de patrulha |
| Timer zera enquanto jogador está sobre o Núcleo (ativação em progresso) | Ativação cancela; fail state acionado. Não há crédito parcial |
| Câmara 3 completa, Núcleo aparece, mas jogador morre antes de coletar | Fail state: Núcleo desaparece; run perdida sem recursos |
| Jogador entra na câmara 2 antes de completar câmara 1 | Câmaras são fisicamente separadas por portas; câmara 2 só abre quando câmara 1 é completada — situação impossível |
| Erro na placa 0 (primeiro passo) | Nenhum reset visual — sequência apenas permanece no passo 0 sem avanço |
| Jogador perde HP 3 vezes na câmara 1 | Fail state antes de completar o puzzle — run perdida sem Núcleo |
| Mochila cheia ao tentar coletar o Núcleo | Ativação não inicia; o jogador deve ir ao EXIT e descartar outro item... mas não há mecanismo de descarte in-run. O Núcleo permanece no chão. Jogador pode esvaziar um slot somente saindo pela EXIT sem o Núcleo — recurso do slot perdido, Núcleo nunca coletado. Isso é um edge case adverso documentado, não resolvido pelo sistema (design note: slots de mochila devem ser gerenciados antes de entrar). |
| Dois Sentinelas na câmara 3 se movem para a mesma placa ao mesmo tempo | Cada Sentinela tem rota independente; rota é gerada sem colisão entre eles na geração do mapa. Se colidirem dinamicamente (improvável), o Sentinela mais recente desvia para o nó de patrulha mais próximo |
| Sequência-alvo gerada proceduralmente resulta em mesma cor em 3 passos consecutivos | Permitido pelo sistema — é um desafio de memória válido. Não há restrição de repetição |

---

## 6. Dependencies

| Sistema | Relação | Direção |
|---------|---------|---------|
| **Sistema de Mochila** | O Núcleo Lógico ocupa 1 slot; mochila cheia bloqueia coleta | Zona depende do Sistema de Mochila |
| **Sistema de Recursos** | O Núcleo Lógico é entregue ao hub como recurso de foguete; este sistema deve registrar o tipo "Núcleo Lógico" | Zona fornece recurso; Sistema de Recursos recebe |
| **Foguete (Hub)** | Núcleos Lógicos são usados para construir o Processador de Navegação do foguete (peças definidas em resource-system.md — slot a ser adicionado) | Foguete consome Núcleos |
| **Hub / Mapa-Mundo** | Jogador acessa a zona a partir do hub; hub deve listar Circuito Quebrado como zona disponível | Hub controla acesso |
| **Gerador de Mapas** | As câmaras, sequências e rotas de Sentinelas são geradas proceduralmente; este sistema deve conhecer os parâmetros de câmaras (n_passos, n_placas, n_sentinelas) | Zona depende do Gerador |
| **Sistema de HP** | O jogador tem 3 HP nesta zona; diferente da Zona Stealth (detecção = fim imediato); o sistema de HP deve ser configurável por zona | Zona configura HP via sistema compartilhado |
| **Zona Hordas** | Zona irmã de combate; Circuito Quebrado é o contraponto intelectual (pensar vs lutar) | Relação temática, sem dependência técnica |
| **Zona Stealth** | Zona irmã de tensão; Circuito Quebrado compartilha o solo mode mas com HP em vez de detecção-imediata | Relação temática; compartilha asset de personagem solo |

---

## 7. Tuning Knobs

| Parâmetro | Valor Base | Range Seguro | Categoria | Efeito no Gameplay |
|-----------|------------|--------------|-----------|---------------------|
| `tempo_ativacao_placa` | 0.8s | 0.5–1.5s | Feel | Ritmo de execução da sequência; muito baixo = trivial, muito alto = frustrante com sentinelas perto |
| `timer_run` | 90s | 60–120s | Gate | Pressão de fundo; base para calcular quantos erros o jogador pode cometer |
| `hp_jogador` | 3 | 2–5 | Gate | Tolerância a erros de combate (hits de Sentinela) |
| `velocidade_sentinela` | 120 px/s | 80–160 px/s | Feel | Ameaça dos Sentinelas; nunca deve exceder velocidade do jogador |
| `n_passos_camara_1` | 3 | 2–4 | Curve | Dificuldade da câmara tutorial |
| `n_passos_camara_2` | 4 | 3–5 | Curve | Dificuldade da câmara intermediária |
| `n_passos_camara_3` | 5 | 4–6 | Curve | Dificuldade da câmara final |
| `n_placas_por_camara` | 4–6 | 3–8 | Curve | Distância entre placas; mais placas = mais caminhada por passo |
| `n_cores` | 3 | 2–5 | Curve | Complexidade cognitiva da sequência; 2 = trivial, 5 = sobrecarga |
| `sentinelas_camara_3` | 2 | 1–3 | Gate | Pressão de combate na câmara final; 0 = sem pressão, 3+ = provável bloqueio de rota |
| `passos_reset_erro_tardio` | 3 | 2–4 | Feel | Quanto a punição por erro tardio "machuca"; mais = punitivo, menos = leniente |

---

## 8. Acceptance Criteria

**Funcional (pass/fail para QA):**

- [ ] Uma run completa (3 câmaras + coleta do Núcleo + EXIT) é possível entre 45 e 90 segundos
- [ ] Completar a sequência de uma câmara abre a porta de saída em 100% dos casos
- [ ] Pisar na cor errada em qualquer posição da sequência dispara o reset parcial correto (conforme tabela da seção 4)
- [ ] Sentinela que toca o jogador remove exatamente 1 HP
- [ ] Jogador com 0 HP entra em fail state e retorna ao hub sem recursos
- [ ] Timer zerando antes de sair com Núcleo = fail state (run perdida)
- [ ] Núcleo Lógico não aparece antes de a câmara 3 ser completada
- [ ] Mochila cheia impede ativação da coleta do Núcleo (círculo de progresso não aparece)
- [ ] A sequência-alvo da câmara atual é sempre visível na UI durante a run

**Experiencial (validado por playtest):**

- [ ] Novo jogador entende o sistema de placas e sequências sem leitura de tutorial — apenas vendo a câmara 1 (3 passos, sem inimigos)
- [ ] Ao cometer um erro, o jogador entende imediatamente o que aconteceu e o que precisa repetir
- [ ] A presença do Sentinela durante execução da sequência cria tensão percebida (o jogador reporta sentir pressão, não frustração injusta)
- [ ] O som de completar uma câmara comunica claramente "avancei" sem necessidade de texto
- [ ] Uma run sem erros e sem hits de Sentinela comunica ao jogador que ele "dominou" a câmara
- [ ] A coletar do Núcleo Lógico após completar as 3 câmaras sente como recompensa merecida, não como formalidade

---

*Relacionado: `design/gdd/game-concept.md`, `design/gdd/resource-system.md`, `design/gdd/zone-stealth.md`*
