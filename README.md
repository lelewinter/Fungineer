# Fungineer

> Um cientista maluco lidera os últimos humanos da Terra em um apocalipse dominado por IAs.
> Construa um foguete peça por peça raideando zonas perigosas —
> mas sua única ação em qualquer zona é **mover o personagem**.

---

## O Jogo

As IAs tomaram o planeta. Você é o cientista mais improvável do apocalipse —
otimista, absurdo, e absolutamente convicto de que um foguete artesanal vai funcionar.

A base de resistência é o hub. De lá, você escolhe qual zona raidar, coleta recursos,
e volta (se sobreviver) para colocar mais uma peça no foguete.
O foguete crescendo na tela é a âncora emocional do jogo — progresso concreto, visível, esperançoso.

**A restrição central:** em qualquer zona, o único input é mover o personagem.
Não há botão de ataque, habilidade ativada ou interação direta.
Posicionamento é o jogo. O que "mover" significa muda completamente de zona para zona.

---

## Zonas

Cada zona é um mini-game diferente com a mesma restrição. O que muda é o que mover significa.

| Zona | Mecânica central |
|------|-----------------|
| **Hordas** | Squad de 4, combate automático radial, rescate de personagens |
| **Stealth** | Evitar cones de detecção e raio sonoro das IAs |
| **Circuito** | Placas coloridas em sequência, sentinelas patrulhando |
| **Extração** | Coletar recursos com parede autoscroll avançando |
| **Campo** | Capturar e defender zonas contra reconquistadores |
| **Infecção** | Conter propagação de nós infectados, curar aliados |
| **Labirinto** | Navegação procedural com inimigos rastreadores |
| **Sacrifício** | Câmaras com coleta cronometrada, invasores do hub |

---

## Progressão

Cada zona dropa um tipo único de recurso. O foguete precisa de todos:

- `scrap` — sucata básica das Hordas
- `ai_components` — componentes das IAs (Circuito)
- `nucleo_logico` — núcleos lógicos (Pesquisa)
- `combustivel_volatil` — combustível da Extração
- `sinais_controle` — sinais do Campo
- `biomassa_adaptativa` — biomassa da Infecção
- `fragmentos_estruturais` — fragmentos do Sacrifício

Morreu na run? Perde tudo que coletou. Sem checkpoint.

---

## Stack

- **Engine**: Godot 4.6
- **Linguagem**: GDScript
- **Plataforma alvo**: Mobile (Android/iOS)
- **Sessão típica**: 5–15 min (várias runs de < 2 min)

---

## Estrutura do projeto

```
src/          — código do jogo
assets/       — arte, áudio, shaders
design/       — GDDs e conceito do jogo
docs/         — documentação técnica
production/   — planejamento de sprint
```

---

## Infraestrutura de desenvolvimento

Este projeto usa o **[Claude Code Game Studios](https://github.com/Donchitos/Claude-Code-Game-Studios)**
como base — um sistema de 48 agentes especializados (design, programação, QA, narrativa, produção)
que coordenam o desenvolvimento através do Claude Code.

---

*Roguelike anthology · Mobile-first · Godot 4.6*
