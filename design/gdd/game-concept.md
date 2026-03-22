# Game Concept: Orbs (Working Title)

*Created: 2026-03-21*
*Status: Approved — Ready for Implementation*

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

Você é o cientista mais otimista e improvável do apocalipse.
Enquanto IAs controlam tudo lá fora, você está na base de resistência convencendo
os últimos humanos de que *sim*, um foguete artesanal vai funcionar.
Cada recurso trazido das zonas coloca uma nova peça no foguete. O foguete crescendo
visualmente na tela é a âncora emocional — progresso concreto, absurdo, esperançoso.

---

## Unique Hook

> "É como WarioWare meets Vampire Survivors — mas sua única ação em qualquer
> mini-game é mover o personagem. O que mover *significa* muda tudo."

---

## A Restrição Central

**MOVER é o único input do jogador em qualquer zona.**

Não há botão de ataque. Não há habilidade ativada manualmente. Não há interação direta.
O posicionamento IS o jogo. A restrição elimina tutoriais — o jogador já sabe o que pode
fazer em cada nova zona. A surpresa é *o que mover significa ali*.

---

## Estrutura do Jogo

### Hub: Base de Resistência

- Tela principal entre runs
- Foguete visível, crescendo fisicamente a cada componente adicionado
- Interface de recursos: o que você tem, o que cada peça do foguete exige
- Mapa-mundo: escolha qual zona raidar
- NPCs: humanos resgatados das zonas de hordas vivem aqui

### World Map: Zonas

Cada zona é um mini-game com:
- Duração máxima: **< 2 minutos**
- Estilo: **roguelike** (aleatoriedade, sem checkpoint)
- Fail state: **perde todos os recursos da run** (volta vazio)
- Recurso único por zona (ver Gerenciamento de Recursos)

---

## Zonas (MVP + Roadmap)

### Zona 1: Hordas *(MVP — ver mvp-game-brief.md)*
**Recurso dropado**: Sucata Metálica (estrutura do foguete)
**Como mover funciona aqui**: Você posiciona o esquadrão; ataque radial contínuo é automático.
Escolhas de resgate de humanos e poderes criam trade-offs de posicionamento.
**Referência**: Orbit Rescue MVP — toda a mecânica de squad, rescue, powers e boss já definida.

### Zona 2: Stealth *(MVP)*
**Recurso dropado**: Componentes de IA (sistema de navegação do foguete)
**Como mover funciona aqui**: Movimentação cuidadosa evita cones de visão de patrulhas de IA,
câmeras de segurança e raio de detecção sonora. Velocidade de movimento afeta o raio de som.
Ficar parado pode ser a jogada certa. Rota e timing são tudo.

### Zona 3+: *(Post-MVP — exemplos)*
- **Zona de Timing**: Mover para posições certas nos momentos certos (recursos: combustível)
- **Zona de Corrida**: Chegar ao recurso antes que a IA bloqueie a rota (recursos: TBD)
- **Zona de Puzzle de Posição**: Empurrar/ativar sequências só com posicionamento

---

## Gerenciamento de Recursos

**Decisão estratégica antes de cada run:** *Qual zona raidar agora?*

### Opção A — Especialização por Zona
Cada zona dropa apenas seu tipo de recurso. O foguete exige todos os tipos.
O jogador analisa o que precisa e escolhe a zona correspondente.

```
Zona Hordas  → Sucata Metálica
Zona Stealth → Componentes de IA
Zona Timing  → Combustível
...
```

### Opção C — Capacidade de Carga Limitada
Dentro de cada run, o jogador tem **espaço limitado na mochila** (ex: 5 slots).
Recursos aparecem espalhados pela zona. O jogador decide quando sair:

- Sair cedo = menos recursos, mais seguro
- Ficar mais = risco crescente (mais inimigos/alarmes), potencial de encher a mochila
- Morrer = perde tudo (fail state)

**Resultado**: Decisões em dois níveis:
1. **Qual zona?** (estratégico, na base)
2. **Quando sair?** (tático, dentro da run)

---

## Core Loop

### Momento-a-Momento (30 segundos)
Mover o personagem através de um ambiente hostil. Cada zona recontextualiza o que
"mover" significa — tensão vem da leitura do ambiente e da escolha de posicionamento.

### Run (~1-2 minutos)
Entrar na zona → coletar recursos (respeitando limite de mochila) → decidir sair ou
arriscar mais → sobreviver ou falhar → retornar (ou não) com o que coletou.

### Sessão (5-15 minutos)
Múltiplas runs em zonas diferentes. Cada run traz progresso no foguete. A tela da base
entre runs mostra o foguete crescendo — recompensa visual entre os momentos de tensão.

### Progressão Longa
Peças do foguete desbloqueiam conforme recursos acumulam. Quando todas as peças estiverem
prontas: o foguete lança. Fim do jogo (ou next arc).

---

## Game Pillars

### Pilar 1 — Movimento é Tudo
Toda mecânica, todo desafio, toda solução emerge apenas de posicionamento.
Zero botões de ação. Zero combate manual.
*Teste: "Devemos adicionar um botão de ataque na zona de stealth?" → Não.*

### Pilar 2 — Zonas São Gêneros
O mesmo input (mover) recria gêneros completamente diferentes em cada zona.
A surpresa de como mover funciona é o conteúdo principal do jogo.
*Teste: "Devemos deixar todas as zonas parecidas para consistência?" → Não. Variedade radical é o ponto.*

### Pilar 3 — Esperança Desesperada
Tom escuro, cientista absurdamente otimista. O foguete crescendo fisicamente é a âncora emocional.
Progresso concreto e visível em um mundo que parece impossível.
*Teste: "Devemos adicionar eventos de perda permanente na base?" → Não. A base é santuário.*

### Pilar 4 — Cada Run É Uma Aposta
Fail = perde tudo da run. Isso torna cada recurso coletado um momento de peso real.
A decisão de sair cedo é tão importante quanto sobreviver.
*Teste: "Devemos dar checkpoint dentro das runs?" → Não. Compromete o peso das decisões.*

### Anti-Pilares
- **NÃO é um jogo de combate manual**: nenhum ataque ativado pelo jogador em nenhuma zona
- **NÃO é um base builder**: a base é recompensa visual e social, não uma camada de gestão de construção
- **NÃO é narrativa pesada**: o apocalipse é cenário e tom, não roteiro com cutscenes longas
- **NÃO tem runs longas**: se uma zona passa de 2 minutos, corta conteúdo, não adiciona tempo

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

## Technical Considerations

| Consideration | Assessment |
|---|---|
| **Engine** | Godot 4.6 (já configurado) |
| **Art Style** | 2D — pixel art ou flat vector (a definir) |
| **Art Pipeline** | Baixa/Média — personagens simples, ambientes por zona |
| **Audio** | Moderado — trilha por zona, feedback sonoro de movimento |
| **Networking** | Nenhum |
| **Procedural** | Layout de zona + spawn de recursos/inimigos |
| **Content Volume MVP** | 2 zonas, 1 receita de foguete (3-4 peças), 1 sessão de ~10min |

---

## MVP Definition

**Hipótese central**: "O conceito de mover como único input cria experiências
genuinamente diferentes em zonas distintas, e a loop meta de recursos→foguete
gera motivação para continuar."

**Requerido no MVP**:
1. Hub com foguete visual e interface de recursos
2. Zona de Hordas completa (ver `mvp-game-brief.md`)
3. Zona Stealth com mecânica de detecção por cone de visão + som
4. Sistema de mochila com limite de slots
5. 1 receita de foguete com 2 tipos de recurso (Sucata + Componentes de IA)
6. Fail state funcionando (perde recursos da run)

**Fora do MVP**:
- Mais de 2 zonas
- Mais de 1 receita de foguete
- NPCs com diálogo
- Meta-progressão além do foguete
- Sound design final

### Scope Tiers

| Tier | Zonas | Foguete | Timeline |
|---|---|---|---|
| **MVP** | 2 (Hordas + Stealth) | 1 receita, 2 recursos | 6-8 semanas |
| **Vertical Slice** | 3 zonas | 1 receita, 3 recursos | +4 semanas |
| **Alpha** | 4-5 zonas | Receita completa | +8 semanas |
| **Full Vision** | 6+ zonas | Multi-receita, arcos | A definir |

---

## Risks

### Design
- A restrição de "só mover" pode frustrar se as zonas não comunicarem claramente as regras
- Equilibrar dificuldade entre zonas com mecânicas tão diferentes é complexo

### Technical
- Cada zona é quase um jogo independente — custo de manutenção cresce linearmente com zonas

### Market
- Conceito forte mas nicho — marketing precisa comunicar a restrição como feature, não limitação

---

## Next Steps

- [ ] `/prototype` — prototipar Zona Stealth (Zona Hordas já tem MVP)
- [ ] `/design-system` — GDD detalhado da Zona Stealth
- [ ] `/design-system` — GDD do sistema de recursos e mochila
- [ ] `/map-systems` — mapear dependências entre hub, zonas e recursos
- [ ] `/sprint-plan new` — planejar sprint com Zona Stealth como foco

---

*Relacionado: `design/gdd/mvp-game-brief.md` — especificação completa da Zona de Hordas*
