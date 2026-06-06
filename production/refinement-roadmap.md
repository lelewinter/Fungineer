# Roadmap de Refino — rumo a 100% em Lore · Storytelling · Fluidez

**Data:** 2026-06-06
**Meta:** refinar o Fungineer até que **lore**, **storytelling** e **fluidez de
jogo** estejam em 100%. Este doc sequencia o trabalho em sprints, ancorado no
estado REAL do código e nos docs de design já produzidos.

---

## 0. A barra — o que "100%" significa em cada pilar

**Lore (100%):** uma única bíblia do mundo coerente e sem contradições; todas as
facções, zonas e mistérios documentados; cânone Dr. Myco limpo; e o texto
in-game reflete tudo isso.

**Storytelling (100%):** o jogador vive um arco emocional completo *através do
loop* — NPCs, descoberta de lore, beats por peça do foguete e finais — sem nunca
quebrar o gameplay "só-movimento".

**Fluidez (100%):** um jogador novo entende cada zona em segundos; transições,
feedback, áudio e balance fazem o loop parecer sem atrito e compulsivo
("só mais uma run").

---

## 1. Estado atual (verificado nesta sessão)

✅ **Pronto:** loop fecha (LANÇAR + Novo Ciclo), 11 zonas no contrato `RunScene`,
cânone Dr. Myco no código, sequência de lançamento procedural, beat de instalação
de peça (toast), balance inicial de `sinais_controle`, áudio generativo (fallback).

🟡 **Existe parcial (precisa ligar/aprofundar):**
- `HubState.lore_found` rastreia fragmentos, mas **não há UI pra ler** nem coleta
  in-zone que chame `markLoreFound`.
- NPCs têm `trust` em `HubData` e briefing no `HubCharacterCard`, mas o **trust é
  estático** (não sobe) e não há conversas destravadas por threshold.
- 10 fichas de personagem em `design/narrative/characters/` não viram diálogo
  in-game além do briefing.
- Briefing de zona aparece (`HubZoomPanel`), mas o `zone-rework.md` (briefings em
  voz Myco) ainda não foi aplicado.

🔴 **Buracos:**
- `design/narrative/world-lore.md` está **truncado**; o `world-lore-addendum.md`
  (facções, mistérios, Voz de CORE, lore das zonas 9-11) não foi integrado.
- ~23 docs narrativos ainda usam "Paulo" como nome corrente.
- Sem onboarding/tutorial implementado. Sem música/SFX gravados. Sem múltiplos finais.

---

## 2. Sprints

> Cada task lista um **dono** (persona) e os **arquivos/sistemas reais**. Critério
> de aceite é falsificável. Dependências no fim.

### 🟫 Sprint A — Lore Lock (a fundação)
**Tema:** uma bíblia do mundo única, coerente e canon-limpa. Nada se constrói em
cima de lore contraditório.

1. **Integrar o addendum** (World Builder) — fundir `world-lore-addendum.md` em
   `world-lore.md`; completar as seções que faltam (A Padre, O Coral, Selvagens,
   Mistério 2/3, Voz de CORE, lore das zonas 9-11, Final C).
2. **Resolver contradições** (World Builder + Narrative Director) — 8↔11 zonas,
   ARGOS em múltiplas zonas, a regra "bio vence máquina" (ver `world-rules-codex.md`);
   cruzar com os ambientes dos `design/gdd/zone-*.md`.
3. **Alinhar ao cânone Dr. Myco** (Writer) — varrer os ~23 docs em
   `design/narrative/` + as 10 fichas de `characters/`; "Paulo" só como nome de
   nascimento pré-Transição (ver `canon-decision-protagonist.md`).
4. **Travar a bíblia** como fonte de verdade única (Creative Director assina).

**Aceite:** zero "Paulo" como nome corrente; toda facção/zona/mistério tem lore
canônico; nenhuma contradição interna sobrevive a uma leitura cruzada.

---

### 🟪 Sprint B — Sistemas de Storytelling (a história ENTRA no jogo)
**Tema:** o loop conta a história. Tudo respeitando "só-movimento" (a narrativa
espera no hub, nunca compete com o gameplay — ver `narrative-systems-plan.md`).

1. **Log de Lore** (Gameplay Programmer + UX) — uma "estação de terminal" no hub
   que lê os fragmentos coletados. `HubState.lore_found`/`markLoreFound` já existem;
   falta (a) a UI de leitura e (b) disparar `markLoreFound` ao descobrir um
   fragmento numa run (marcado como "descoberto", lido depois no hub).
2. **Progressão de trust + conversas** (Gameplay Programmer + Narrative) — fazer o
   `trust` subir (por presença/runs, não só vitória — `narrative-systems-plan.md`)
   e destravar conversas por threshold usando as 10 fichas de `characters/`.
   Resgatar NPC → benefício mecânico → beat de conversa.
3. **Beats por peça do foguete** (Writer + já parcialmente no código) — aprofundar:
   `PIECE_INSTALL_BEAT` (toast) já existe; amarrar cada uma das 8 peças a um beat
   + reação de NPC, seguindo `rocket-piece-beat-map.md`.
4. **Briefings em voz Myco** (Writer) — aplicar `zone-rework.md` ao `HubData`/`HubZoomPanel`.

**Aceite:** o jogador conhece personagens, descobre lore e sente o arco avançar a
cada peça do foguete — tudo sem pausar o gameplay.

---

### 🟦 Sprint C — Primeiro Playtest + Balance/Flow
**Tema:** validar diversão e fluidez com gente de verdade. (Pode começar assim que
B tiver conteúdo suficiente.)

1. **Rodar o primeiro playtest** (Game Designer) — executar `first-playtest-plan.md`
   (teste A/B do gargalo `sinais_controle`).
2. **Aplicar balance** (Systems + Economy) — curva do foguete + payouts por zona
   (`rocket-tuning-verified.md`) pra cair na janela 6-10 runs sem farm degenerado.
3. **Tirar atrito de fluxo** (UX + Producer) — corrigir tempo morto, confusão e
   transições ásperas que o playtest revelar.

**Aceite:** 6-10 runs até lançar; nenhuma estratégia degenerada de zona única;
playtesters relatam o gancho "só mais uma run".

---

### 🟩 Sprint D — Onboarding & Game Feel (fluidez)
**Tema:** um jogador novo entende em segundos; o jogo "sente bem".

1. **Ensino de movimento por zona** (UX + Gameplay Programmer) — implementar o
   `onboarding-and-input-flows.md`: cartão de zona (2s), eco de 5s, reforço de
   primeiro-contato. Sem texto pesado.
2. **Fluxo do primeiro jogo** (UX) — hub → primeira raid → primeira peça, guiado
   de forma diegética.
3. **Feel pass** (Gameplay Programmer) — polir coleta, revelação de recompensa,
   transições hub↔zona, e o painel "Próxima Peça" no hub.
4. **Acessibilidade** (UX) — aplicar os achados de `accessibility-verified.md`.

**Aceite:** jogador novo entende o "mover" de cada zona sem ler texto; transições
suaves; feedback satisfatório a cada coleta e fim de run.

---

### 🟧 Sprint E — Áudio & Coesão Sensorial
**Tema:** a camada que falta. (Pode rodar em paralelo — é bem independente.)

1. **Transcodar áudio real** (Audio Director) — rodar `tools/transcode-audio.sh`
   (precisa de ffmpeg local) seguindo `transcode-manifest.md`; trocar refs
   `.wav→.ogg`. Hoje roda no fallback generativo.
2. **Ligar a direção sonora** (Audio + Gameplay Programmer) — paleta
   orgânico-vs-máquina, "Motivo do Foguete" de 4 notas, identidade por zona, e o
   som como feedback de movimento/risco (`audio-direction.md`).
3. **Áudio do lançamento** — o clímax precisa do som quente de decolagem.

**Aceite:** hub, cada zona e o lançamento têm áudio intencional; o motivo do
foguete costura a trilha.

---

### 🟥 Sprint F — Clímax Narrativo & Finais
**Tema:** storytelling 100% — o pagamento emocional.

1. **Múltiplos finais** (Narrative Director) — Final A/B/C do `narrative-arc.md`,
   destravados por trust de NPC (depende do sistema de trust do Sprint B).
2. **Lançamento como pico pleno** (Art + Audio + Writer) — a sequência procedural
   já existe; juntar arte (`launch-sequence-art-spec.md`), áudio (Sprint E) e a
   cópia (`launch-and-piece-copy.md`) num só momento que arranca reação.
3. **Beat do Novo Ciclo (NG+)** — o reinício com peso narrativo, sem quebrar o tom.

**Aceite:** o final emociona; os finais refletem as relações e escolhas do jogador.

---

## 3. Sequenciamento & paralelismo

```
A (Lore Lock) ──► B (Sistemas de Storytelling) ──► F (Finais)
                       │                              ▲
                       └──► C (Playtest+Balance) ─────┘
D (Onboarding/Feel) ── pode rodar em paralelo a B/C
E (Áudio) ──────────── pode rodar em paralelo o tempo todo
```

- **A antes de B:** não dá pra ligar lore no jogo antes de travá-la.
- **C precisa de B:** o playtest precisa de conteúdo/sistemas pra testar.
- **D e E são paralelos:** feel e áudio não dependem da lore.
- **F é o último:** precisa do trust (B), do áudio (E) e da arte do lançamento.

## 4. Definição de Pronto — checklist dos 3 pilares

**Lore 100%**
- [ ] `world-lore.md` completo e sem truncamento; addendum integrado
- [ ] Zero "Paulo" como nome corrente em docs e código
- [ ] Toda facção/zona/mistério com lore canônico, sem contradição
- [ ] GDDs de zona batem com a bíblia

**Storytelling 100%**
- [ ] Log de lore legível no hub; descoberta in-zone funciona
- [ ] Trust sobe e destrava conversas das 10 personagens
- [ ] Cada peça do foguete dispara um beat + reação de NPC
- [ ] Múltiplos finais por trust; Novo Ciclo tem beat

**Fluidez 100%**
- [ ] Jogador novo entende o "mover" de cada zona em ≤2 tentativas, sem texto
- [ ] 6-10 runs até lançar, sem farm degenerado (playtest confirma)
- [ ] Transições hub↔zona, coleta e recompensa com feedback caprichado
- [ ] Áudio intencional em hub/zonas/lançamento
- [ ] Acessibilidade básica (toque, daltonismo, fotossensibilidade) ok

---

*Fontes: design/narrative/* (lore, arco, personagens, beats, voz, cópia),
design/ux/onboarding-and-input-flows.md, design/audio/* + production/audio-decision.md,
design/systems/rocket-tuning-verified.md, design/first-playtest-plan.md,
docs/architecture/* e o código em frontend/src/.*
