# Canon Decision — Protagonista: Dr. Myco

**Data:** 2026-06-05
**Status:** TRAVADO (decisão da Leticia: "vamos de dr myco")

## Decisão

O protagonista é **Dr. Myco**. É esse o nome que o jogo usa em todo texto
player-facing (hub, briefings, NPCs, telas de vitória/derrota, falas).

## Reconciliação do conflito (Myco vs. Paulo)

Os documentos divergiam: parte do material chamava o protagonista de "Dr. Paulo
Vitor Santos" (engenheiro aeroespacial / empreendedor de IA), parte de "Dr. Myco"
(micologista). Resolução adotada (proposta do World Builder):

> **"Dr. Myco" é o nome/apelido pós-Transição. Paulo Vitor Santos é o nome de
> nascimento — sua identidade *anterior*, de quando ele ajudou a construir o
> sistema de IA que destruiu o mundo. Ele abraçou a micologia como
> contra-tecnologia depois disso. O apelido marca a transformação ideológica,
> não uma profissão de origem.**

### Regras de uso
- **Player-facing / presente:** sempre **Dr. Myco** (ou "Myco").
- **Lore do passado dele / pré-Transição:** "Paulo" é aceitável e até desejável
  (referencia quem ele era). Ex.: o palco de inauguração em Campo "onde Paulo
  esteve, cinco anos atrás" — correto, é o passado dele.
- **NÃO confundir** com outros NPCs que por acaso se chamam Paulo (ex.: o técnico
  "Paulo A. Martins" do fragmento de lore CLEAN-447 — pessoa diferente, intocada).

## Aplicado no código (2026-06-05)
- `ui/hub/HubRocketPanel.ts`, `ui/hub/RocketLaunchOverlay.ts` — falas → "Dr. Myco".
- `state/HubData.ts` — hint do NPC doutor ("Dr. Myco", glyph 'M'), briefing do
  doutor, briefing da Hordas, e a referência da Priya.
- `scenes/runs/HordasScene.ts` — comentários de código.
- Preservados de propósito: comentário de passado em `FieldControlScene.ts` e o
  NPC distinto em `data/LoreFragments.ts`.

## Pendente (docs narrativos)
23 arquivos em `design/narrative/` ainda usam "Paulo" como nome corrente do
protagonista. Não foram reescritos em massa porque exigem julgamento por
contexto (nome de nascimento vs. apelido). Tarefa para o Writer/Narrative
Director: alinhar o material narrativo a esta regra, mantendo "Paulo" só onde
referencia o passado pré-Transição.
