# Fungineer — Roadmap de Produção (rumo a Vertical Slice / Soft-Launch)

**Autor:** Producer
**Data:** 2026-06-05
**Status:** Vivo — revisar a cada fim de milestone
**Fontes lidas:** `README.md`, `design/MASTERPLAN.md`, `design/narrative/zone-rework.md`,
`docs/adr/adr-002-web-port.md`, `production/*`, leitura do código em `frontend/src/`
(state, scenes/runs, scenes/hub).

> Escopo deste doc: **milestones, sequenciamento (caminho crítico) e risco.**
> A task-queue detalhada (tarefas de 1-3 dias com owner/estimativa/critério) é
> responsabilidade do `task-writer` em `production/task-queue.md` (ainda não existe —
> ver Risco 5). Este roadmap é a entrada para esse documento.

---

## 0. Estado real apurado (não o que README/MASTERPLAN dizem)

Há divergência entre os documentos e o código. O **código está mais avançado** do que
o MASTERPLAN (datado 2026-06-03, fala em "8 zonas, 5 stub"). O apurado por leitura direta:

| Item | Estado real | Evidência |
|---|---|---|
| Zonas implementadas | **11/11 existem como cenas jogáveis** (não 8) | `frontend/src/scenes/runs/*.ts` — 11 arquivos, todos > 200 linhas |
| Profundidade de feel | **3 zonas "gordas"** (Hordas 1163, Sacrifice 758, Field 503) vs **8 zonas "magras"** (200–410 linhas) | `wc -l` por cena |
| Meta-loop | **Funcional**: receita do foguete (8 peças), 7 recursos, depósito de mochila, deterioração, save versionado | `state/HubState.ts` (ROCKET_RECIPE, tryBuildNextPiece, toSnapshot) |
| Estado de vitória | **`isRocketComplete()` existe mas NÃO é consumido em lugar nenhum** | grep: só definido, nunca chamado fora do próprio HubState |
| Sequência de final/lançamento | **AUSENTE** — sem cutscene/launch/ending | grep `launch|ending|finale` → nada de gameplay |
| Narrativa | **Rework completo escrito, "Awaiting Lead Implementation"** | `design/narrative/zone-rework.md` v1.0 |
| Briefings/labels por zona | **Stale/inconsistentes** com o rework e parcialmente com as keys de recurso | `state/Zones.ts` (ex.: Hordas mostra "Biomassa" mas deposita `scrap`) |
| Áudio | Engine pronta; **8 faixas WAV ~106 MB excedem o cap de 25 MB do Cloudflare** | `production/task-audio-transcode.md` |
| Deploy | Documentado mas **nunca executado** (depende de login da Leticia) | README §Deploy; MASTERPLAN §9 |
| Arte | Tudo placeholder procedural; paths fixos para troca | MASTERPLAN §6 |

**Premissas assumidas (subagente não-interativo):**
- A1: Alvo de soft-launch = **PWA web pública (Cloudflare Pages), sem app store.** Coerente com ADR-002.
- A2: "Vertical slice" = **um caminho completo e polido** hub → raide → depósito → foguete cresce → **lançamento/final**, com 3–4 zonas em qualidade-vitrine, não as 11.
- A3: Time indie pequeno; capacidade é o constraint dominante. Cortar > adiar > acumular dívida.
- A4: Backend é opcional (localStorage fallback) — **não está no caminho crítico** do soft-launch.
- A5: O rework narrativo é "no mechanic rebuilds" (só strings/props) — barato, alto impacto.

---

## 1. Milestones até soft-launch

Cada milestone tem **objetivo** (por que existe), **critério de saída** (binário, testável) e **personas-chave**.
Renumerados a partir do estado real — substituem M0–M9 do MASTERPLAN, que assumiam zonas como stub.

### VS-1 — Fechar o Loop (Vertical Slice Esqueleto)
**Objetivo:** provar que a âncora de progresso do jogo paga. Hoje o foguete cresce mas
chegar em "completo" não faz nada — o jogo não tem fim. Sem isto não há vertical slice, só sandbox.
**Inclui:**
- Sequência de **lançamento/final** disparada por `isRocketComplete()` (cena/overlay de vitória do jogo, não da run).
- Garantir um caminho de progressão atingível: economia balanceada o bastante para construir as 8 peças sem grind absurdo.
- Tela de "novo jogo / continuar" e wipe de save coerentes com o final.
**Critério de saída:** um jogador consegue, do zero, raidar → depositar → construir as 8 peças → ver a sequência de lançamento → tela final. Sem crash no fluxo. Save/continue respeita o estado pós-final.
**Personas:** game-designer (define o que é "vencer" e a economia-alvo), creative-director (tom do final), gameplay programmer (wire-up), narrative-director (texto do final).

### VS-2 — Consistência de Conteúdo (Narrativa + Economia)
**Objetivo:** o jogo hoje "fala" coisas inconsistentes. Labels de recurso, briefings e
nomes de zona divergem entre `Zones.ts`, `HubData.ts` e o rework. Barato de arrumar, alto retorno de coesão.
**Inclui:**
- Aplicar `design/narrative/zone-rework.md` Parte 3 (briefings, status/HUD labels, reward/fail strings, display names). **Sem rebuild de mecânica.**
- Reconciliar `Zones.ts` `resource` display com as keys reais depositadas (Hordas, Cordilheira, Torres, Catedral hoje mentem ao jogador sobre o que coletam).
- Validar que cada zona realmente deposita o recurso que sua peça de foguete precisa (cobertura da receita — ver Risco 2).
**Critério de saída:** todas as 11 zonas exibem briefing/labels do rework; o recurso mostrado = recurso depositado; auditoria de economia confirma que as 8 peças são construíveis pelas zonas existentes.
**Personas:** narrative-director (texto), game-designer (cobertura de economia), UI programmer (strings/HUD).

### VS-3 — Vitrine: 3–4 Zonas em Qualidade de Lançamento
**Objetivo:** soft-launch julga-se pelo melhor que o jogador vê primeiro, não pela média.
Levar um subconjunto a "feel completo" (partículas, juice, shake, som reativo, props do rework) — não espalhar polish fino por 11.
**Zonas recomendadas (mix de arquétipos + já gordas):** Hordas (combate), Infecção (Pac-Man), Circuito (Snake), Campo (controle de área). Cobrem 4 sensações distintas de "mover".
**Inclui:** FX core/juice/luz/post já existem em `run/fx/` — aplicar e tunar por zona; props baratos do rework (Pixi Graphics, sem assets novos); SFX reativo por evento.
**Critério de saída:** playtest interno aprova as 4 zonas-vitrine nos 3 pilares (drag feel, legibilidade, impacto de poder/objetivo); FPS estável em Android mid-range; as outras 7 permanecem jogáveis sem regressão.
**Personas:** technical-director (perf budget), creative-director (bar de qualidade), gameplay/FX programmer, audio.

### VS-4 — Áudio Shippável + Build de Produção
**Objetivo:** destravar o deploy. O áudio atual quebra o build do Cloudflare (cap 25 MB) e o footprint de PWA.
**Inclui:**
- Executar `tools/transcode-audio.sh` (WAV→OGG, ~106 MB → ~15 MB), swap atômico de paths + remoção dos WAV (`production/task-audio-transcode.md`).
- `npm run build` + `npm run typecheck` limpos; auditoria de bundle/asset < 20 MB.
- PWA: service worker / cache LRU validado em mobile; primeira carga sem warning de storage.
**Critério de saída:** build de produção gera `dist/` < limites do Pages; áudio toca em hub/mapa/zonas sem 404; PWA instala em Android sem warning.
**Personas:** technical-director (build/PWA), audio (audição pós-transcode), QA.

### VS-5 — Deploy + Hardening de Soft-Launch
**Objetivo:** colocar no ar de forma estável e observável. Primeiro contato real com jogadores.
**Inclui:**
- Cloudflare Pages conectado ao repo (deploy por push) — **requer login da Leticia** (blocker conhecido, MASTERPLAN §9.3).
- (Opcional, fora do caminho crítico) Railway para save remoto; sem ele, localStorage.
- Smoke test em produção: boot, hub, uma run de cada arquétipo, save/continue, final.
- Telemetria mínima / canal de feedback de playtest.
**Critério de saída:** URL pública `.pages.dev` joga o loop completo (boot → run → depósito → foguete → lançamento) em pelo menos 1 Android e 1 desktop; sem crash; save persiste entre sessões.
**Personas:** Producer (coordenação + blocker de login), technical-director (deploy), QA (smoke test), Leticia (credenciais).

### VS-6 — Balance & Polish Pass (estabilização pós-slice)
**Objetivo:** ajustar com base no primeiro playtest real antes de divulgar mais amplamente.
**Inclui:** tuning de duração de run (alvo 90–150s, herdado do checklist arquivado), curva da economia, dificuldade de deterioração, bugs de soft-launch.
**Critério de saída:** duração de run dentro da janela-alvo em ≥3 sessões; nenhum bug crítico aberto; retro de soft-launch documentada com itens de ação.
**Personas:** game-designer (balance), QA (regressão), Producer (retro).

---

## 2. Caminho crítico (o que bloqueia o quê)

```
                 ┌─────────────────────────────────────────────┐
                 │  PRÉ: instalar deps + typecheck/build verde   │  (sandbox sem node_modules hoje)
                 └───────────────────────┬─────────────────────┘
                                         │
        ┌────────────────────────────────┴────────────────────────────────┐
        │                                                                   │
  ┌─────▼──────┐                                                     ┌──────▼───────┐
  │  VS-1      │  Fechar o loop (lançamento/final)                   │   VS-2       │  Narrativa + economia
  │ *CRÍTICO*  │  ── decisão de design: "o que é vencer?" ──┐        │ (paralelo)   │  (independente de VS-1)
  └─────┬──────┘                                            │        └──────┬───────┘
        │                                                   │               │
        │   depende de game-designer definir economia-alvo  │               │
        │   E de creative/narrative definirem o tom do final│               │
        ▼                                                   ▼               ▼
  ┌──────────────────────────────────────────────────────────────────────────────┐
  │                       VS-3  Vitrine 3–4 zonas (feel completo)                   │
  │   depende de: loop fechado (VS-1) p/ playtestar progressão de ponta a ponta     │
  │   beneficia de: strings/props do rework (VS-2) p/ a vitrine parecer coesa        │
  └───────────────────────────────────────┬──────────────────────────────────────┘
                                           │
                                  ┌────────▼─────────┐
                                  │  VS-4  Áudio+Build │  *CRÍTICO p/ deploy*
                                  │  (transcode WAV→OGG│   pode começar cedo, mas
                                  │   destrava Pages)  │   precisa estar verde antes de VS-5
                                  └────────┬─────────┘
                                           │
                                  ┌────────▼─────────┐
                                  │  VS-5  Deploy     │  *BLOCKER EXTERNO: login Leticia*
                                  └────────┬─────────┘
                                           │
                                  ┌────────▼─────────┐
                                  │  VS-6  Balance    │
                                  └──────────────────┘
```

**Cadeia crítica (a mais longa, define a data):**
`PRÉ build verde` → **VS-1 (fechar o loop)** → **VS-3 (vitrine)** → **VS-4 (áudio/build)** → **VS-5 (deploy)**.

**Bloqueios-chave:**
1. **VS-1 bloqueia tudo a jusante de fato.** Sem final, não dá pra playtestar a progressão de ponta a ponta (VS-3) nem ter um soft-launch que "termina". É o item de maior alavancagem e o mais subestimado pelos docs atuais.
2. **VS-1 está bloqueado por uma decisão de design** (não de engenharia): "o que é vencer, e quão longo é o caminho até lá?" Isso é do **game-designer + creative-director**, não do Producer. Escalar cedo.
3. **VS-4 (transcode) bloqueia VS-5 (deploy)** por causa do cap de 25 MB do Cloudflare. Tarefa pequena, mas é gate duro. Pode rodar em paralelo a VS-1/VS-3 desde já — recomendo antecipar.
4. **VS-5 tem blocker externo** (credenciais da Leticia). Não-paralelizável por mim. Avisar com 2 sprints de antecedência (responsabilidade de Producer).
5. **VS-2 é paralelizável** e não trava ninguém, mas deveria preceder VS-3 para a vitrine não exibir labels inconsistentes.

**Itens fora do caminho crítico (podem ficar para depois do soft-launch):**
backend/Railway (save remoto), feel das 7 zonas não-vitrine, arte real (Tracks B/C), música original (síntese atual basta), 8ª zona de profundidade narrativa por trust threshold.

---

## 3. Registro de Riscos — TOP 5

Probabilidade × Impacto em escala Baixa/Média/Alta. Dono = persona responsável pela mitigação.

### R1 — O loop não tem fim; o "vencer" não está definido nem implementado
- **Prob:** Alta · **Impacto:** Alto
- **Por quê:** `isRocketComplete()` existe mas nada o consome; não há sequência de lançamento. O foguete é a âncora de progresso do jogo inteiro (README) e não paga. Um vertical slice sem clímax não é vertical slice.
- **Dono:** game-designer (definir condição/comprimento de vitória) + creative-director (tom do final). Producer coordena o handoff.
- **Mitigação:** escalar a decisão de design **antes** de VS-1 começar. Aceitar um final mínimo-viável-mas-real (overlay + cutscene curta de síntese) para o soft-launch; final cinematográfico fica para pós-launch. Critério de "feito": jogador novo chega ao final em uma sessão de teste.

### R2 — Buraco de cobertura da economia (zonas ↔ recurso ↔ peça do foguete)
- **Prob:** Média · **Impacto:** Alto
- **Por quê:** A receita exige 7 keys (`scrap`, `ai_components`, `nucleo_logico`, `combustivel_volatil`, `sinais_controle`, `biomassa_adaptativa`, `fragmentos_estruturais`), com picos grandes (`sinais_controle: 20` e `30`). Os display names em `Zones.ts` divergem das keys depositadas (ex.: Hordas mostra "Biomassa", deposita `scrap`; 3 zonas de superfície depositam keys diferentes do label). Se alguma key tiver fonte fraca ou nenhuma, o foguete fica matematicamente inacabável → soft-launch sem fim possível, reforçando R1.
- **Dono:** game-designer (balance de economia) + Producer (auditoria de cobertura).
- **Mitigação:** auditoria explícita em VS-2: tabela zona→key→quantidade-por-run vs. receita total. Resolver qualquer key sem fonte suficiente antes de VS-3. Reconciliar labels com keys no mesmo passo.

### R3 — Polish em 11 zonas estoura a capacidade indie (scope creep do MASTERPLAN)
- **Prob:** Alta · **Impacto:** Médio
- **Por quê:** O MASTERPLAN prega "sem MVP, o jogo inteiro, 11 zonas no ar". Levar 11 zonas a feel/áudio/arte completos é trabalho de estúdio, não de indie pequeno. 8 das 11 estão "magras". Tentar polir todas atrasa o soft-launch indefinidamente.
- **Dono:** creative-director (define o bar) + Producer (defende o escopo) + technical-director (perf).
- **Mitigação:** cortar para a estratégia de **vitrine** (VS-3): 3–4 zonas polidas, 7 jogáveis-mas-cruas. As 11 já são jogáveis, então o jogador tem conteúdo; o polish é progressivo pós-launch. Documentar o corte como decisão (ADR ou nota de escopo) para evitar relitígio.

### R4 — Áudio/asset estoura limites do Cloudflare e PWA (deploy travado)
- **Prob:** Média · **Impacto:** Alto (se não tratado, bloqueia VS-5 inteiro)
- **Por quê:** 8 WAV ~106 MB, com `dungeon_theme_2.wav` em 23 MB já roçando o cap de 25 MB/arquivo do Pages; footprint de PWA pesado em Android mid-range. Tarefa já documentada (`task-audio-transcode.md`) mas **OPEN, owner TBD**.
- **Dono:** technical-director (build/PWA) + audio (audição pós-transcode).
- **Mitigação:** rodar o transcode cedo (não esperar VS-4); é idempotente e reversível por `git revert`. Gate de "feito": bundle < 20 MB, sem 404, PWA instala limpo. Atribuir owner imediatamente.

### R5 — Fonte de verdade de produção fragmentada / `task-queue.md` inexistente
- **Prob:** Alta · **Impacto:** Médio
- **Por quê:** README e MASTERPLAN contradizem o código (8 vs 11 zonas, stub vs jogável). `sprint-01-plan.md` está arquivado (era Godot). `task-queue.md` é citado como fonte de verdade em 3 lugares mas **não existe**. Sem fonte única, esforço duplica e decisões se perdem.
- **Dono:** Producer (este roadmap) + task-writer (gerar `task-queue.md` a partir daqui).
- **Mitigação:** este roadmap vira a fonte de sequenciamento; pedir ao task-writer para criar `production/task-queue.md` derivado de VS-1..VS-6. Atualizar README/MASTERPLAN status de zonas para "11 jogáveis, profundidade variável" para parar a contradição. Revisar riscos semanalmente.

---

## 4. Recomendação de priorização — o que cortar / adiar / fazer

Dado escopo indie (premissa A3), a ordem de valor é: **fechar o loop > coesão > vitrine > shippar > polir o resto.**

### Fazer agora (alavancagem máxima, custo baixo-médio)
1. **Fechar o loop (VS-1).** Maior alavancagem do projeto inteiro. Sem isto nada mais importa.
2. **Auditoria + reconciliação de economia/labels (VS-2).** Barato, destrava R2 e dá coesão.
3. **Transcode de áudio (VS-4, antecipado).** Pequeno, reversível, destrava o deploy. Rodar em paralelo já.

### Cortar do soft-launch (preservar para pós-launch, não jogar fora)
- **Feel/juice completo nas 7 zonas não-vitrine.** Ficam jogáveis-mas-cruas. Polish progressivo depois.
- **Arte real (Tracks B/C do MASTERPLAN).** Placeholders procedurais respeitam a paleta; troca é por arquivo. Não bloqueia jogar.
- **Música original / trilha externa.** Síntese atual + as faixas existentes bastam para soft-launch.
- **Camadas narrativas por trust threshold de personagem** (Marcus 40/60/80/100% etc. do rework). Profundidade linda, mas opcional para o primeiro contato. Manter briefings/labels (baratos); adiar os arcos ramificados.

### Adiar (não corta, mas sai do caminho crítico)
- **Backend / save remoto (Railway).** localStorage cobre o soft-launch (A4). Subir só se o playtest exigir cross-device.
- **Final cinematográfico.** Versão mínima-mas-real no soft-launch (R1); upgrade depois.
- **Otimização de perf além do "estável em mid-range".** Não dourar antes de ter sinal de jogador.

### Princípios de defesa de escopo (para usar nas negociações creative ↔ tech)
- "As 11 já são jogáveis" é uma vantagem — o corte é de **profundidade**, não de **quantidade**. O jogador não perde conteúdo.
- Cada item adicionado ao soft-launch precisa de aprovação explícita (regra herdada do sprint-01 arquivado — ainda válida).
- Medir sucesso do slice por: **o loop completo é satisfatório?** — não por "todas as zonas estão lindas?".

---

## 5. Como saberemos que acertamos (métricas de validação)

- **VS-1:** ≥3 jogadores novos chegam ao lançamento do foguete numa sessão, sem ajuda, sem crash.
- **VS-2:** zero divergências label↔key; auditoria de economia prova as 8 peças construíveis.
- **VS-3:** as 4 zonas-vitrine passam os 3 pilares no playtest; FPS estável em Android mid-range.
- **VS-4/5:** URL pública joga o loop completo em 1 Android + 1 desktop; save persiste.
- **VS-6:** duração de run 90–150s em ≥3 sessões; nenhum bug crítico aberto; retro documentada.

---

## 6. Handoffs imediatos (Producer → personas)

| Para | Pedido | Bloqueia |
|---|---|---|
| game-designer | Definir condição e comprimento de "vencer"; revisar economia da receita (R1/R2) | VS-1, VS-2 |
| creative-director + narrative-director | Tom e conteúdo da sequência de lançamento/final | VS-1 |
| technical-director | Atribuir owner ao transcode; validar build/PWA (R4) | VS-4, VS-5 |
| task-writer | Gerar `production/task-queue.md` a partir de VS-1..VS-6 | R5 |
| Leticia | Login Cloudflare Pages (e opcional Railway) — avisar 2 sprints antes | VS-5 |
