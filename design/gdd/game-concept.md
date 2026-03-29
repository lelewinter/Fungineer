---
tags: [fungineer, game-design, gdd]
date: 2026-03-21
updated: 2026-03-29
tipo: game-design-doc
---

# Game Concept: Orbs (Working Title)

*Created: 2026-03-21*
*Updated: 2026-03-29*
*Status: Em Desenvolvimento — Alpha*

---

## Elevator Pitch

> Um cientista maluco lidera os últimos humanos da Terra em um apocalipse dominado por IAs.
> Construa um foguete peça por peça raideando zonas perigosas — mas sua única ação
> em qualquer zona é mover o personagem.

---

## Core Identity

| Aspect | Detail |
|---|---|
| **Genre** | Roguelike mini-game anthology + meta-progressão estratégica |
| **Platform** | Mobile (Android/iOS) — primário; Desktop para dev/teste |
| **Target Audience** | Mid-core mobile, fãs de roguelikes curtos e jogos com restrições criativas |
| **Player Count** | Single-player |
| **Session Length** | 5–15 min (múltiplas runs de <2min cada) |
| **Monetization** | A definir |
| **Estimated Scope** | Medium (3–9 meses) |
| **Comparable Titles** | WarioWare (anthology), Into the Breach (posicionamento estratégico), Vampire Survivors (auto-combat + movimento) |

---

## Core Fantasy

Dr. Paulo Vitor Santos aprovou o sistema de IA que acabou com o mundo — não por malícia, por excesso de crença. Agora convence os últimos humanos a construir um foguete artesanal. O foguete crescendo visualmente é a âncora emocional: progresso concreto raideando a infraestrutura que Paulo mesmo ajudou a construir.

**A questão que o jogo não responde por você**: A IA estava errada? Ou o mandato estava errado?

---

## Unique Hook

> "É como WarioWare meets Vampire Survivors — mas sua única ação em qualquer
> mini-game é mover o personagem. O que mover *significa* muda tudo."

---

## A Restrição Central

**MOVER é o único input do jogador em qualquer zona.**

Não há botão de ataque, habilidade ativada manualmente, ou interação direta. O posicionamento IS o jogo. A restrição elimina tutoriais — a surpresa é *o que mover significa* em cada zona.

---

## Estrutura do Jogo

### Hub: Base de Resistência

- Tela principal entre runs
- Foguete visível (RocketDrawer), crescendo fisicamente a cada componente adicionado
- Painel de recursos mostra estoque atual
- Área de personagens resgatados
- Botão de acesso ao Mapa-Mundo
- Dr. Valério aparece com diálogo ao completar peças do foguete

### World Map: Bunker 3 Andares

Mapa estilo Fallout Shelter — corte transversal de bunker com **3 andares × 3 colunas = 9 salas**:
- 8 salas são zonas raidáveis (ZoneRoom)
- 1 sala é a Baía do Foguete (-1)
- Cada sala mostra ícone, nome, subtítulo e botão RAID
- Ao selecionar uma zona, abre o ConfirmRaidDialog com descrição, recurso e dificuldade
- ScrollContainer permite navegar entre andares

### Zonas

Cada zona é um mini-game com:
- Duração máxima: **60–120 segundos** (varia por zona)
- Estilo: **roguelike** (aleatoriedade, sem checkpoint)
- Fail state: **perde todos os recursos da run** (volta vazio)
- Recurso único por zona (ver Gerenciamento de Recursos)

---

## Zonas (8 implementadas)

### Zona 0: Hordas — Orbit Rescue Arena
**Cena**: `Main.tscn` | **GDD**: `mvp-game-brief.md`, `enemies-horda-zone.md`
**Recurso**: Sucata Metálica (`scrap`)
**Timer**: ~90s + boss fight
**Mecânica**: Esquadrão auto-ataca; jogador posiciona o grupo. Waves de inimigos com escalada. Wave 1 → evento de resgate (escolher 1 de 2 personagens). Wave 2 → evento de poder (escolher 1 de 3 transformações). Boss fight. Extração para vitória.
**Como mover funciona aqui**: Posicionamento do esquadrão define quem é atacado e quem sobrevive.

### Zona 1: Instalação de IA — Stealth
**Cena**: `StealthMain.tscn` | **GDD**: `zone-stealth.md`, `zone-stealth-map.md`
**Recurso**: Componentes de IA (`ai_components`)
**Mecânica**: Infiltração solo. Coletar componentes evitando drones de patrulha. Detecção dispara alarme com resposta escalada. Sair pelo EXIT.
**Como mover funciona aqui**: Velocidade afeta raio de som; ficar parado pode ser a jogada certa. Igualar velocidade do drone = disfarce como eco.

### Zona 2: Circuito Quebrado — Puzzle
**Cena**: `CircuitMain.tscn` | **GDD**: `zone-circuit.md`
**Recurso**: Núcleo Lógico (`nucleo_logico`)
**Timer**: 90s
**Mecânica**: Navegação por puzzle de sequência. Seguir placas de pressão coloridas na ordem correta através de 3 câmaras. Placa errada reseta progresso.
**Como mover funciona aqui**: Pisar nas placas certas na sequência certa é o único desafio.

### Zona 3: Corrida de Extração — Lane Runner
**Cena**: `ExtractionMain.tscn` | **GDD**: `zone-extraction-run.md`
**Recurso**: Combustível Volátil (`combustivel_volatil`)
**Timer**: 60s
**Mecânica**: 7 lanes verticais, mundo scrollando da direita para esquerda. Toque na metade superior/inferior da tela para trocar de lane. Coletar canisters de combustível, desviar de 5 tipos de debuff (fumaça, slow, faísca, EMP, teia).
**Como mover funciona aqui**: Troca de lane é o único input — timing e leitura de padrões.

### Zona 4: Controle de Campo — Territorial
**Cena**: `FieldControlMain.tscn` | **GDD**: `zone-field-control.md`
**Recurso**: Sinais de Controle (`sinais_controle`) — recurso passivo/flow
**Timer**: 90s
**Mecânica**: 5–7 zonas de captura. Ficar dentro de uma zona a captura; gera Sinais de Controle passivamente. Inimigos contestam zonas capturadas. Velocidade de chegada dá bônus 3× na captura.
**Como mover funciona aqui**: Cobrir território amplo vs. defender zonas — trade-off espacial constante.

### Zona 5: Infecção — Propagação em Grafo
**Cena**: `InfectionMain.tscn` | **GDD**: `zone-infection.md`
**Recurso**: Biomassa Adaptativa (`biomassa_adaptativa`)
**Timer**: 120s
**Mecânica**: Grafo de 25 nós. Jogador É o vírus — mover entre nós espalha infecção e gera Biomassa. Healers podem reverter nós infectados.
**Como mover funciona aqui**: Mover para um nó o infecta; o desafio é otimizar a rota de propagação enquanto Healers desfazem o progresso.

### Zona 6: Labirinto Dinâmico — Maze
**Cena**: `MazeMain.tscn` | **GDD**: `zone-maze.md`
**Recurso**: Fragmentos Estruturais (`fragmentos_estruturais`)
**Timer**: 3 HP (sem timer)
**Mecânica**: Labirinto com portas cíclicas (timers visíveis). Portas fechando causam dano. Aproximar-se de uma porta acelera sua abertura. Drones de patrulha spawn quando portas abrem. Coletar Fragmentos e chegar ao EXIT.
**Como mover funciona aqui**: Timing de passagem entre portas + fuga de drones. Cada porta é um micro-risco.

### Zona 7: Sacrifício — Decisão Estratégica
**Cena**: `SacrificeMain.tscn` | **GDD**: `zone-sacrifice.md`
**Recurso**: Misto (Sucata + Componentes de IA)
**Timer**: 90s
**Mecânica**: Hub central com 4–6 câmaras visíveis. Cada câmara mostra custos antes da entrada (penalidade de tempo, inimigos, slots, efeitos em cadeia). Análise fria → execução quente. Esquadrão auto-luta inimigos dentro.
**Como mover funciona aqui**: Entrar em uma câmara é o compromisso. A decisão de *quais* câmaras visitar e em *que ordem* é o jogo.

---

## Gerenciamento de Recursos

**7 tipos de recurso**, cada um vinculado a uma zona específica:

| Recurso | Zona | Tipo |
|---|---|---|
| Sucata Metálica (`scrap`) | Hordas | Mochila (slots) |
| Componentes de IA (`ai_components`) | Stealth / Sacrifício | Mochila (slots) |
| Núcleo Lógico (`nucleo_logico`) | Circuito | Mochila (slots) |
| Combustível Volátil (`combustivel_volatil`) | Extração | Mochila (slots) |
| Sinais de Controle (`sinais_controle`) | Campo | Flow (passivo) |
| Biomassa Adaptativa (`biomassa_adaptativa`) | Infecção | Mochila (slots) |
| Fragmentos Estruturais (`fragmentos_estruturais`) | Labirinto | Mochila (slots) |

**Decisão estratégica antes de cada run:** *Qual zona raidar agora?*

- Capacidade de mochila limitada (5 slots)
- Recursos de flow (Sinais de Controle) não ocupam slots — gerados passivamente
- Sair cedo = menos recursos, mais seguro
- Ficar mais = risco crescente
- Morrer = perde tudo da run

---

## Foguete — 8 Peças

O foguete é construído sequencialmente. Cada peça exige recursos de zonas específicas, forçando o jogador a diversificar:

| # | Peça | Recursos Necessários |
|---|---|---|
| 1 | Base Estrutural | 3 scrap |
| 2 | Motor Principal | 3 combustível |
| 3 | Processador | 2 núcleo lógico |
| 4 | Revestimento | 3 fragmentos + 2 scrap |
| 5 | Rede Neural | 4 AI components + 20 sinais |
| 6 | Sistema Vital | 6 biomassa + 2 combustível |
| 7 | Blindagem Externa | 3 fragmentos + 3 AI components |
| 8 | Ignição Final | 2 scrap + 1 núcleo + 30 sinais + 4 biomassa |

As primeiras peças exigem um recurso de uma zona. As últimas peças exigem recursos de 2–4 zonas, forçando maestria em múltiplas mecânicas.

---

## Personagens

### Dr. Valério
Cientista-líder. Aparece no Hub com diálogo ao completar peças do foguete.

### Esquadrão Resgatável (9 sobreviventes)

| Nome | Papel | Zona de Preferência |
|---|---|---|
| Capitã Runa | Guardiã | — |
| Brix | Artilheiro | — |
| Zara | Artificeira | — |
| Luz | Médica | — |
| Ex-Exec | Estrategista | — |
| Fio | Hacker | — |
| Ferro-Velho | Engenheiro | — |
| Mira | Elite | — |
| Nulo | Agente Stealth | — |

**Sistema de Confiança**: 6+ personagens registrados com diálogos por threshold (0/40/60/80/100). Confiança cresce via missões e presença em runs.

### Fragmentos de Lore
15+ fragmentos coletáveis nas zonas (terminais, ordens de trabalho, fotos, tickets de suporte). Rastreados em `HubState.lore_found`.

---

## Core Loop

### Momento-a-Momento (30 segundos)
Mover através de ambiente hostil. Tensão vem da leitura do ambiente e da escolha de posicionamento.

### Run (~1-2 minutos)
Entrar → coletar recursos (respeitando limite de mochila) → decidir sair ou arriscar → sobreviver ou falhar → retornar com o que coletou.

### Sessão (5-15 minutos)
Múltiplas runs em zonas diferentes. Foguete cresce na base entre os momentos de tensão.

### Progressão Longa
Peças do foguete desbloqueiam conforme recursos acumulam. Confiança com personagens cresce em paralelo. Quando todas as 8 peças estiverem prontas: foguete lança.

---

## Game Pillars

### Pilar 1 — Movimento é Tudo
Toda mecânica, desafio e solução emerge apenas de posicionamento. Zero botões de ação.
*Teste: "Devemos adicionar um botão de ataque na zona de stealth?" → Não.*

### Pilar 2 — Zonas São Gêneros
O mesmo input recria gêneros completamente diferentes em cada zona. Variedade radical é o ponto.
*Teste: "Devemos deixar todas as zonas parecidas para consistência?" → Não.*

### Pilar 3 — Esperança Desesperada
Tom escuro, cientista absurdamente otimista. A base é santuário — sem eventos de perda permanente.
*Teste: "Devemos adicionar eventos de perda permanente na base?" → Não.*

### Pilar 4 — Cada Run É Uma Aposta
Fail = perde tudo da run. A decisão de sair cedo é tão importante quanto sobreviver.
*Teste: "Devemos dar checkpoint dentro das runs?" → Não.*

### Anti-Pilares
- **NÃO é um jogo de combate manual**: nenhum ataque ativado pelo jogador em nenhuma zona
- **NÃO é um base builder**: base é recompensa visual/social, não gestão de construção
- **NÃO é narrativa pesada**: sem cutscenes longas — narrativa emerge em diálogos curtos e fragmentos de lore; ignorável
- **NÃO tem runs longas**: se uma zona passa de 2 minutos, corta conteúdo
- **NÃO condena nem absolve a IA**: sem resposta certa; conclusões diferentes para jogadores diferentes

---

## Player Experience (MDA)

| Aesthetic | Priority | Como entregamos |
|---|---|---|
| **Challenge** (maestria, posicionamento) | 1 | Zonas exigem leitura e timing de movimento |
| **Discovery** (surpresa por zona nova) | 2 | Cada zona recontextualiza o mesmo input |
| **Fantasy** (cientista maluco escapando) | 3 | Personagem, tom, foguete visual |
| **Submission** (runs curtas, ritmo) | 4 | <2min por run, sessões de 5-15min |

---

## Player Profile

| Attribute | Detail |
|---|---|
| **Age range** | 18–35 |
| **Gaming experience** | Mid-core |
| **Time availability** | Sessões curtas (5–15 min) no dia a dia |
| **Platform preference** | Mobile |
| **Games they play** | Vampire Survivors, Balatro, Alto's Odyssey, Mini Metro |
| **What they want** | Tensão satisfatória em sessões curtas, sensação de progressão clara |
| **Dealbreakers** | Runs longas, complexidade de entrada alta, punição excessiva |

---

## Sistemas Implementados

| Sistema | Arquivo | Status |
|---|---|---|
| **GameConfig** | `src/autoload/GameConfig.gd` | 130+ valores de configuração (arena, personagens, inimigos, waves, boss, mochila) |
| **GameState** | `src/autoload/GameState.gd` | Estado de run: RunState enum, party, backpack, poder ativo, sinais |
| **HubState** | `src/autoload/HubState.gd` | Progressão persistente: stock de 7 recursos, 8 peças do foguete, sobreviventes, zones_unlocked, deterioração |
| **CharacterRegistry** | `src/autoload/CharacterRegistry.gd` | 6+ personagens com diálogos por trust threshold |
| **HUD** | `src/ui/HUD.gd` | Health dots, power icon, timer, backpack display, debug overlay |
| **StealthHUD** | `src/ui/StealthHUD.gd` | HUD específica da zona stealth |
| **RescueScreen** | `src/ui/RescueScreen.gd` | Escolha de resgate pós-wave |
| **PowerOfferScreen** | `src/ui/PowerOfferScreen.gd` | Escolha de poder pós-wave |
| **GameOverScreen** | `src/ui/GameOverScreen.gd` | Tela de derrota |
| **VictoryScreen** | `src/ui/VictoryScreen.gd` | Tela de vitória com tech fragments |
| **RocketDrawer** | `src/ui/RocketDrawer.gd` | Visualização do progresso do foguete |
| **LoreFragments** | `src/data/LoreFragments.gd` | 15+ fragmentos coletáveis por zona |

---

## Technical Considerations

| Consideration | Assessment |
|---|---|
| **Engine** | Godot 4.6 |
| **Art Style** | 2D — pixel art ou flat vector (a definir) |
| **Art Pipeline** | Baixa/Média — personagens simples, ambientes por zona |
| **Audio** | Moderado — trilha por zona, feedback sonoro de movimento |
| **Networking** | Nenhum |
| **Procedural** | Layout de zona + spawn de recursos/inimigos |
| **Content Volume** | 8 zonas, 8 peças de foguete, 7 recursos, 9 sobreviventes, 15+ lore fragments |

---

## Risks

- **Design**: A restrição pode frustrar se zonas não comunicarem regras claramente; equilibrar dificuldade entre 8 mecânicas diferentes é complexo
- **Technical**: Cada zona é quase um jogo independente — custo de manutenção cresce linearmente com zonas
- **Market**: Marketing precisa comunicar a restrição como feature, não limitação
- **Scope**: 8 zonas polidas exige mais QA e balancing do que 2

---

## Next Steps

- [ ] Polish e balancing das 8 zonas (gameplay loops de cada uma)
- [ ] Sistema de deterioração de zonas (funcionalidade já esboçada em HubState)
- [ ] Implementar diálogos de confiança para todos os personagens
- [ ] Sound design por zona
- [ ] Art direction final (atualmente placeholder)
- [ ] Tutorial / onboarding — comunicar "só mover" sem tutoriais explícitos
- [ ] Monetização — definir modelo
- [ ] Playtest com público externo

---

*Relacionado: `design/gdd/mvp-game-brief.md`, `design/gdd/resource-system.md`,
`design/narrative/world-lore.md`, `design/narrative/narrative-arc.md`,
`design/gdd/hub-and-characters.md`, `design/gdd/zone-*.md`*
