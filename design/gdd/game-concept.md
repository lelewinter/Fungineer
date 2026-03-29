---
tags: [fungineer, game-design, gdd]
date: 2026-03-21
tipo: game-design-doc
---

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
**Como mover funciona aqui**: Posiciona o esquadrão; ataque radial contínuo é automático. Resgates de humanos e poderes criam trade-offs de posicionamento.

### Zona 2: Stealth *(MVP)*
**Recurso dropado**: Componentes de IA (sistema de navegação do foguete)
**Como mover funciona aqui**: Evitar cones de visão de patrulhas, câmeras e raio de detecção sonora. Velocidade afeta raio de som; ficar parado pode ser a jogada certa.

### Zona 3+: *(Post-MVP — exemplos)*
- **Zona de Timing**: Mover para posições certas nos momentos certos (recursos: combustível)
- **Zona de Corrida**: Chegar ao recurso antes que a IA bloqueie a rota
- **Zona de Puzzle de Posição**: Empurrar/ativar sequências só com posicionamento

---

## Gerenciamento de Recursos

**Decisão estratégica antes de cada run:** *Qual zona raidar agora?*

### Opção A — Especialização por Zona
Cada zona dropa apenas seu tipo de recurso. O foguete exige todos os tipos.

```
Zona Hordas  → Sucata Metálica
Zona Stealth → Componentes de IA
Zona Timing  → Combustível
```

### Opção C — Capacidade de Carga Limitada
**Espaço limitado na mochila** (ex: 5 slots). Recursos espalhados pela zona. O jogador decide quando sair:

- Sair cedo = menos recursos, mais seguro
- Ficar mais = risco crescente, potencial de encher a mochila
- Morrer = perde tudo

**Resultado — decisões em dois níveis:**
1. **Qual zona?** (estratégico, na base)
2. **Quando sair?** (tático, dentro da run)

---

## Core Loop

### Momento-a-Momento (30 segundos)
Mover através de ambiente hostil. Tensão vem da leitura do ambiente e da escolha de posicionamento.

### Run (~1-2 minutos)
Entrar → coletar recursos (respeitando limite de mochila) → decidir sair ou arriscar → sobreviver ou falhar → retornar com o que coletou.

### Sessão (5-15 minutos)
Múltiplas runs em zonas diferentes. Foguete cresce na base entre os momentos de tensão.

### Progressão Longa
Peças do foguete desbloqueiam conforme recursos acumulam. Quando todas as peças estiverem prontas: foguete lança. Fim do jogo (ou next arc).

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

## Technical Considerations

| Consideration | Assessment |
|---|---|
| **Engine** | Godot 4.6 |
| **Art Style** | 2D — pixel art ou flat vector (a definir) |
| **Art Pipeline** | Baixa/Média — personagens simples, ambientes por zona |
| **Audio** | Moderado — trilha por zona, feedback sonoro de movimento |
| **Networking** | Nenhum |
| **Procedural** | Layout de zona + spawn de recursos/inimigos |
| **Content Volume MVP** | 2 zonas, 1 receita de foguete (3-4 peças), 1 sessão de ~10min |

---

## MVP Definition

**Hipótese central**: "O conceito de mover como único input cria experiências genuinamente diferentes em zonas distintas, e a loop meta de recursos→foguete gera motivação para continuar."

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

- **Design**: A restrição pode frustrar se zonas não comunicarem regras claramente; equilibrar dificuldade entre mecânicas tão diferentes é complexo
- **Technical**: Cada zona é quase um jogo independente — custo de manutenção cresce linearmente com zonas
- **Market**: Marketing precisa comunicar a restrição como feature, não limitação

---

## Next Steps

- [ ] `/prototype` — prototipar Zona Stealth (Zona Hordas já tem MVP)
- [ ] `/design-system` — GDD detalhado da Zona Stealth
- [ ] `/design-system` — GDD do sistema de recursos e mochila
- [ ] `/map-systems` — mapear dependências entre hub, zonas e recursos
- [ ] `/sprint-plan new` — planejar sprint com Zona Stealth como foco
- [ ] Implementar sistema de diálogos/fragmentos de lore in-zone (terminais, logs)
- [ ] Escrever diálogos de missão de confiança para Marcus (revelações por threshold)
- [ ] Definir o "vocabulário" de comunicação de CORE com Lena (Final C)

---

*Relacionado: `design/gdd/mvp-game-brief.md`, `design/narrative/world-lore.md`,
`design/narrative/narrative-arc.md`, `design/gdd/hub-and-characters.md`*
