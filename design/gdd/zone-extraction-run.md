# Corrida de Extração — Game Design Document

**Version**: 1.0
**Date**: 2026-03-22
**Status**: Draft

---

## 1. Overview

A Corrida de Extração é uma zona de speedrun com pressão de timer. O jogador tem um tempo fixo e limitado para percorrer um mapa semi-linear com caminhos ramificados, coletando o máximo de Combustível Volátil possível antes que o timer chegue a zero. Ao contrário de todas as outras zonas, a coleta aqui é **instantânea ao toque** — não há parada de 1.5 segundos. Mover é coletar; a velocidade é o ativo. O desafio é de roteamento: planejar qual caminho percorrer dentro do tempo disponível para maximizar o combustível extraído.

O **Combustível Volátil** é o propelente do motor do foguete — sem ele, o foguete tem estrutura e navegação, mas não tem empuxo para vencer a gravidade. É literalmente o que faz o foguete se mover.

---

## 2. Player Fantasy

Você tem 60 segundos. O combustível está espalhado por um depósito em colapso controlado por IAs. Não há tempo para ser cuidadoso. Você vê os canisters no mapa, traça a rota com o olhar, e executa. Cada desvio de rota é uma aposta: o caminho perigoso à esquerda tem mais combustível, mas um drone bloqueará a passagem em 10 segundos. Você pega o combustível fácil ou corre o risco? A run termina e você olha para o medidor — podia ter pegado mais 3 canisters se tivesse ido pela esquerda. Na próxima run, você vai pela esquerda.

**Estética MDA primária**: Challenge (roteamento eficiente, execução sob pressão de tempo).
**Estética secundária**: Submission (ritmo frenético de coleta, "one more run" para otimizar a rota).

---

## 3. Detailed Rules

### 3.1 Estrutura da Run

- O jogador entra **com o squad** (igual à Zona Hordas — até 4 personagens)
- O mapa é semi-linear: um ponto de entrada, um ponto de saída (EXIT), 3–4 rotas possíveis entre eles
- Combustível Volátil está distribuído pelo mapa em canisters
- A run termina quando:
  - O **timer chega a 0** — run encerra automaticamente; recursos coletados são mantidos
  - **Todos os personagens morrem** — fail state; perde todos os recursos
  - O jogador **chega ao EXIT voluntariamente** — run encerra com os recursos coletados até então
- Não há obrigação de chegar ao EXIT — o timer é o natural stopping point

**Distinção de outras zonas:**
- Não é necessário chegar ao EXIT para manter recursos — o timer é a saída natural
- Chegar ao EXIT antes do timer = encerramento voluntário antecipado (estratégia válida se a mochila estiver cheia)

### 3.2 Interpretação do Movimento (como arrastar funciona aqui)

- **Input**: arrastar o dedo = mover o squad (igual à Zona Hordas — squad segue o líder)
- **Significado aqui**: mover é coletar. Passagem sobre um canister = coleta instantânea. Parar não faz nada de especial aqui.
- **Coleta instantânea ao contato**: o personagem líder (ou qualquer membro do squad) que toca fisicamente o canister o coleta sem pausa
- **Sem círculo de progresso**: ao contrário do sistema padrão de 1.5s, aqui não há espera
- O sistema de mochila padrão ainda se aplica: cada canister ocupa 1 slot. Mochila cheia = não pode coletar mais

**Por que esta inversão existe:**
A Corrida de Extração é explicitamente o oposto da coleta cuidadosa das outras zonas. O design de parada de 1.5s existe para criar risco através de vulnerabilidade. Aqui, a vulnerabilidade vem do timer e da rota — parar seria incoerente com o tema de velocidade.

### 3.3 Mecânica Central — Roteamento e Timer

#### Layout do Mapa

O mapa tem estrutura de **diamante**: entrada → 3 rotas paralelas → saída. As rotas convergem em 1–2 pontos intermediários (junções), criando possibilidade de trocar de rota no meio do percurso.

| Rota | Perfil | Combustível | Tempo para Percorrer | Inimigos |
|------|--------|-------------|----------------------|----------|
| Rota Segura | Larga, poucos obstáculos | 4–5 canisters | ~20s | 0–1 drones lentos |
| Rota Intermediária | Corredor com obstáculos | 6–7 canisters | ~25s | 1–2 drones ativos |
| Rota Perigosa | Estreita, muito obstruída | 8–10 canisters | ~30s | 2–3 drones + Sentinela |

#### Canisters em Movimento

- 30% dos canisters são **estáticos** (posição fixa no mapa)
- 70% dos canisters são **dinâmicos** (rolando ou quicando em trajetória previsível)
  - Trajetória: linear com rebote nas paredes (velocidade: 60–90 px/s)
  - O jogador deve **interceptar** o canister — posicionar-se no caminho dele
  - Canisters dinâmicos sempre aparecem nas rotas de risco médio/alto (recompensa por planejamento)

#### Canisters de Tempo Extra

- Canisters especiais com ícone distinto (+T) espalham-se **exclusivamente nas rotas de médio e alto risco**
- Ao coletar um +T: **+10 segundos adicionados ao timer**
- Apenas 2–3 canisters de tempo extra existem por run
- Eles contam como 1 slot de mochila se coletados... mas os canisters de tempo **não ocupam slot** — são efeito imediato, não item
- Isso cria um incentivo claro para as rotas perigosas: mais combustível E mais tempo

#### Timer

- Timer inicial: **60 segundos**
- Visível na UI em tempo real (contagem regressiva)
- Ao atingir 10 segundos: alerta visual intensificado (pisca, muda de cor)
- Ao atingir 0: run encerra imediatamente, tela de resultado mostra o que foi coletado
- Recursos coletados até o momento do timer zero são preservados na mochila (não é fail state)

#### Squad e Cobertura de Área

- O squad (até 4 personagens) mantém sua formação padrão ao redor do líder
- A formação do squad cobre uma área maior — personagens nos flancos coletam canisters próximos automaticamente
- Com squad de 4: raio de cobertura lateral ~80px além do líder
- Com squad de 1 (apenas o Doutor): raio de cobertura 0 (só o que o líder toca)
- Isso cria incentivo para levar o squad completo: mais cobertura = mais canisters por metro percorrido

### 3.4 Coleta de Recursos — Combustível Volátil

- **Coleta**: instantânea ao toque de qualquer membro do squad com o canister
- **Não há círculo de progresso** — contato = coletado
- **Sistema de mochila**: cada canister = 1 slot (padrão do jogo)
- **Mochila cheia**: personagens simplesmente passam pelos canisters sem coletá-los (nenhum feedback intrusivo)
- **Canisters de tempo (+T)**: não ocupam slot; efeito imediato ao contato
- Ao encerrar a run (timer zero ou EXIT voluntário): todo o Combustível na mochila vai para o estoque do hub
- **Fail state** (todos morrem): perde tudo da mochila

### 3.5 Risco e Fail State

#### Inimigos

- Tipo: **Drone de Patrulha** — equivalente ao Spitter da Zona Hordas, mas com comportamento de zona
- Drones patrulham rotas predefinidas; não perseguem, mas causam dano se o jogador entrar no alcance
- Alcance de ataque: 150px; projétil lento (70 px/s)
- Nas rotas perigosas: **Sentinela de Alta Segurança** — inimigo que bloqueia passagens por 5s antes de se mover (força o jogador a calcular janelas de passagem)
- O squad ainda combate automaticamente (como na Zona Hordas) — drones podem ser destruídos
- HP dos personagens: padrão (Guardian 200, Striker 120, Artificer 100, Medic 80)
- Todos os personagens mortos = fail state

#### Relação Risco/Recompensa

A tensão não é "morrer é fácil" — a tensão é "o tempo que gasto evitando inimigos é tempo que não estou coletando combustível". Morrer é possível mas improvável se o jogador conhece o mapa. O risco real é **ineficiência de rota**.

---

## 4. Formulas

### Combustível Esperado por Rota (sem canisters dinâmicos)

```
combustivel_rota_segura       = 4–5 canisters
combustivel_rota_intermediaria = 6–7 canisters
combustivel_rota_perigosa     = 8–10 canisters

Variação por seed procedural: ±1 canister por rota
```

### Cobertura de Coleta do Squad

```
raio_coleta_lider = 30px (hitbox do personagem líder)
raio_extra_por_membro = 20px de cobertura lateral adicional

Squad de 1: cobertura total = 30px (só o líder)
Squad de 2: cobertura total ≈ 50px lateral
Squad de 3: cobertura total ≈ 70px lateral
Squad de 4: cobertura total ≈ 90px lateral

Observação: cobertura não é linear — os membros do squad ficam
em posições relativas ao líder, não em linha reta. O valor acima
representa o raio efetivo de coleta sem desvio de rota.
```

### Valor de Cada Segundo do Timer

```
combustivel_por_segundo = combustivel_rota / tempo_rota

Rota segura:      4.5 / 20 = 0.22 canisters/s
Rota intermediária: 6.5 / 25 = 0.26 canisters/s
Rota perigosa:   9.0 / 30 = 0.30 canisters/s

Com canister de tempo (+10s na rota perigosa):
  Valor real da rota perigosa = 9.0 canisters + (0.30 × 10) = 9.0 + 3.0 = 12.0 equivalentes
  Tornando a rota perigosa ~2.67× mais valiosa que a segura no longo prazo
```

### Pressão de Tempo por Mochila

```
runs_para_encher_mochila(slots, combustivel_por_rota):
  = slots / combustivel_por_rota

Mochila padrão (3 slots), rota segura (4.5/run):
  runs_para_encher = não aplicável — o timer esgota antes de encher nos melhores casos
  (60s de timer, rota segura em ~20s = pode fazer 1 rota e metade de outra por run)

Mochila upgrade 2 (7 slots), rota perigosa (9/run):
  Mochila enche em ~47s de corrida — chegar ao EXIT aos ~47s ou esperar timer em ~60s
  → EXIT voluntário a 47s economiza 13s, que poderiam ter sido usados para +3-4 canisters extras se a rota fosse possível
  → Dilema: ir ao EXIT cedo (garantir recursos) ou continuar (risco de morrer, perder tudo)
```

### Capacidade de Mochila vs Tempo de Run

```
tempo_run_max       = 60s + (n_canisters_tempo × 10s)
max_canisters_tempo = 3

timer_max_possivel  = 60 + 30 = 90s (se coletar os 3 canisters de tempo)

slots_mochila_base      = 3
slots_mochila_upgrade_1 = 5
slots_mochila_upgrade_2 = 7

Com timer máximo (90s) e mochila upgrade 2 (7 slots):
  Combustível esperado por rota = 9 / 30s = 0.3/s × 90s ≈ 27 combustíveis potenciais
  Mas mochila só tem 7 slots → mochila é o bottleneck, não o timer
  → Upgrade de mochila tem valor máximo nesta zona
```

---

## 5. Edge Cases

| Situação | Comportamento |
|----------|---------------|
| Mochila cheia, canister dinâmico colide com o personagem | Canister passa pelo personagem sem ser coletado — sem feedback visual especial (consistente com sistema de mochila cheia em outras zonas) |
| Timer zera enquanto personagem está sobre o EXIT | Run encerra normalmente com os recursos coletados — não há penalidade por estar no EXIT no momento zero |
| Squad inteiro morre exatamente ao mesmo tempo que timer zera | Fail state tem prioridade — perde os recursos da run |
| Canister de tempo (+T) coletado com mochila cheia | Efeito de tempo se aplica normalmente — canisters de tempo nunca são bloqueados por mochila cheia |
| Dois membros do squad tocam o mesmo canister estático simultaneamente | O primeiro a calcular colisão coleta; o segundo ignora (o canister já saiu do mapa) |
| Canister dinâmico sai dos limites do mapa | Canister rebate na parede do limite — nunca escapa do mapa |
| Jogador chega ao EXIT com mochila vazia (0 combustível) | Run encerra normalmente — 0 combustível adicionado ao hub. Sem penalidade especial além do tempo perdido |
| Todos os canisters coletados antes do timer zerar | Run continua até timer zero ou EXIT voluntário — não há vitória antecipada por coletar tudo (o mapa não "acaba") |
| Squad de 4 na rota estreita (perigosa) | Formação de squad comprime para caber no corredor; hitbox de coleta dos membros laterais reduz ao tamanho do corredor. Membros extras não ficam presos — apenas a cobertura lateral diminui |
| Timer de tempo extra coletado com timer em 0 | Impossível — run encerra ao atingir 0, antes de processar mais coletas naquele frame |

---

## 6. Dependencies

| Sistema | Relação | Direção |
|---------|---------|---------|
| **Sistema de Mochila** | Combustível Volátil ocupa slots; mochila cheia bloqueia coleta; upgrades de mochila têm impacto máximo nesta zona | Zona depende do Sistema de Mochila |
| **Sistema de Recursos** | Combustível Volátil é registrado como tipo de recurso; entregue ao hub ao fim da run | Zona fornece recurso; Sistema de Recursos recebe |
| **Foguete (Hub)** | Combustível Volátil alimenta o motor principal do foguete — peças de propulsão no recipe-system.md | Foguete consome Combustível |
| **Sistema de Squad (Zona Hordas)** | Esta zona herda o sistema de squad: até 4 personagens, formação, combate automático; personagens coletam canisters lateralmente | Zona depende do Sistema de Squad |
| **Hub / Mapa-Mundo** | Jogador acessa a zona a partir do hub; estado de mochila (slots disponíveis) é informação relevante pré-run | Hub controla acesso |
| **Gerador de Mapas** | Layout semi-linear com 3 rotas é gerado proceduralmente; parâmetros de densidade de canisters por rota devem ser configuráveis | Zona depende do Gerador |
| **Sistema de Timer** | Timer de run é específico desta zona (60s base) — outras zonas não têm timer explícito desta natureza; sistema de timer deve ser implementado como componente reutilizável | Zona define parâmetros do Timer |
| **Zona Hordas** | Zona irmã; compartilha o sistema de squad e combate automático; contraste temático: Hordas é territorial/parado, Extração é direcional/em movimento | Dependência técnica (squad) + relação temática |

---

## 7. Tuning Knobs

| Parâmetro | Valor Base | Range Seguro | Categoria | Efeito no Gameplay |
|-----------|------------|--------------|-----------|---------------------|
| `timer_inicial` | 60s | 45–90s | Gate | Duração e intensidade da corrida; abaixo de 45s = muito punitivo, acima de 90s = perde a urgência |
| `bonus_tempo_canister` | +10s | +5s–+20s | Gate | Valor de arriscar rotas perigosas por tempo adicional |
| `n_canisters_tempo_por_run` | 2–3 | 1–4 | Gate | Quão extensível o timer é; mais canisters = runs mais longas para especialistas |
| `velocidade_canister_dinamico` | 70 px/s | 40–100 px/s | Feel | Dificuldade de interceptação; muito rápido = imprevisível, muito lento = trivial |
| `porcentagem_canisters_dinamicos` | 70% | 40–80% | Curve | Proporção de canisters que requerem interceptação vs posição fixa |
| `combustivel_rota_segura` | 4–5 | 3–6 | Curve | Recompensa base; define o piso de eficiência |
| `combustivel_rota_perigosa` | 8–10 | 6–14 | Curve | Recompensa máxima; define o teto de rota arrojada |
| `raio_cobertura_membro_squad` | 20px | 10–35px | Feel | Vantagem de squad grande para coleta lateral |
| `velocidade_jogador_max` | 200 px/s | — | Feel | Herdado do sistema global; não alterar por zona |
| `hp_drone_patrul` | 60 | 40–100 | Curve | Tempo para o squad derrotar um drone em rota (indiretamente afeta segurança de rota) |
| `alcance_ataque_drone` | 150px | 100–200px | Feel | Raio de perigo nas rotas; mais = rotas mais perigosas lateralmente |

---

## 8. Acceptance Criteria

**Funcional (pass/fail para QA):**

- [ ] Contato de qualquer membro do squad com qualquer canister resulta em coleta imediata (0s de espera)
- [ ] O timer conta regressivamente e a run encerra automaticamente ao atingir 0
- [ ] Recursos coletados até o timer zero são mantidos na mochila e transferidos ao hub (não é fail state)
- [ ] Todos os personagens mortos = fail state; mochila perde todos os recursos
- [ ] Chegada voluntária ao EXIT encerra a run imediatamente com todos os recursos coletados
- [ ] Canister de tempo (+T) adiciona exatamente 10 segundos ao timer imediatamente ao contato, sem ocupar slot de mochila
- [ ] Mochila cheia faz personagens passarem sobre canisters estáticos sem coletá-los, silenciosamente
- [ ] O layout sempre tem pelo menos 3 rotas distintas entre entrada e saída
- [ ] Canisters dinâmicos rebotem nas paredes e nunca saem dos limites do mapa

**Experiencial (validado por playtest):**

- [ ] Novo jogador entende "tocar = coletar" nos primeiros 5 segundos da primeira run sem tutorial
- [ ] Após 2 runs, o jogador começa a planejar a rota antes de se mover (não apenas reagir)
- [ ] A existência de múltiplas rotas é percebida pelo jogador como uma escolha, não como confusão
- [ ] Uma run com mochila cheia (todos os slots preenchidos) gera o desejo de "na próxima vou com mais slots"
- [ ] O timer em 10 segundos cria urgência perceptível (mudança de comportamento do jogador)
- [ ] Uma run completa (entrada ao encerramento) ocorre entre 45 e 75 segundos

---

*Relacionado: `design/gdd/game-concept.md`, `design/gdd/resource-system.md`, `design/gdd/mvp-game-brief.md`*
