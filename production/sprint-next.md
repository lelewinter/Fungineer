# Fungineer — Plano do Próximo Sprint (rumo ao Soft-Launch jogável)

**Autor:** Producer
**Data:** 2026-06-05 · **HEAD:** `8b20f49`
**Status:** Vivo — este doc NÃO substitui `roadmap.md` (milestones VS-1..VS-6) nem
`task-queue.md` (backlog completo). É o **re-sequenciamento da Rodada 2**: o que
mudou, o novo caminho crítico e o plano do **um** próximo sprint.
**Fontes verificadas:** `git log`, código em `frontend/src/` (lido, não inferido),
`npm run typecheck` (VERDE) + `npm run build` (VERDE) executados nesta sessão,
`production/implementation-notes.md`, `production/task-queue.md`.

> Lição da Rodada 1 aplicada: apurei o estado REAL antes de planejar. Várias
> "P0 bloqueantes" dos docs já estavam fechadas no código, e o risco de áudio é
> diferente (e pior) do que os docs descreviam — ver Seção 4.

---

## 1. O que mudou desde o roadmap da Rodada 1 (itens FECHADOS)

Confirmado no código + git, não só nos docs. Verifiquei cada um por leitura direta.

| Item da Rodada 1 | Estado agora | Evidência (verificada) |
|---|---|---|
| **VS-1 / R1 — fim de jogo (era o risco #1)** | **FECHADO** | `HubState.isRocketComplete()` consumido; `HubRocketPanel` emite `launchRequested`; `ui/hub/RocketLaunchOverlay.ts` (tela de vitória) existe e está fiada no HubScene; `resetForNewCycle()` zera o ciclo |
| **SaveService (task #005)** | **FECHADO** | Completo, fiado no `main.ts` (load no boot, arm nos signals, flush no pagehide, fallback localStorage). Nenhuma ação |
| **Reward overlay por zona (#002/#003)** | **FECHADO** | `buildEndOverlay({zone,victory,rewardLabel,failLabel})` cobre recompensa/derrota por zona; RewardScene separada descartada como redundante |
| **Cânone Dr. Myco (strings player-facing)** | **FECHADO** | Migrado em HubRocketPanel, RocketLaunchOverlay, HubData, falas. Pendente só nos ~23 docs `design/narrative/` (task #022) |
| **Timers centralizados no GameConfig** | **FECHADO** | 8 scenes leem `*_RUN_TIMER`. Resta confirmar 2 valores roteados (Circuito 60→90, Infecção 75→120) — decisão de design, 1 linha |
| **Música data-driven** | **FECHADO** | Hordas/Field/Sacrifice leem `ZONE.music` como as outras 8 |
| **Botão SAIR no Field** | **FECHADO** | Hit area ~60px no HUD, encerra como derrota |
| **Refactor grande (#73) — split de Hordas** | **FECHADO** | `scenes/runs/hordas/{HordasRenderer,config,entities,separation}.ts` extraídos; `RunFrame.ts` existe como base parcial |
| **Vazamento de setTimeout (Field/Sacrifice)** | **FECHADO** | Handles guardados e limpos no `exit()` |
| **Barras de progresso invertidas + denominador Infecção** | **FECHADO** | `setHealth(progresso)` correto; `totalPellets` usado |

### Correção importante de premissa (o docs estava errado)
- **"Loop quebrado / recursos descartados" (task #001 P0):** **NÃO É VERDADE.**
  Verifiquei todas as 11 cenas: cada uma chama `depositFlow('<ResourceKey>', n)`
  com a key **canônica correta** (`combustivel_volatil`, `nucleo_logico`,
  `biomassa_adaptativa`, `sinais_controle`, `ai_components`,
  `fragmentos_estruturais`, `scrap`) ou `depositBackpack` com keys válidas.
  **Nenhum recurso some no loop.** O `resource:` em `Zones.ts` é só **rótulo de
  display** — não dirige o depósito. Logo a task #001, marcada P0 bloqueante,
  **NÃO é bloqueante**: vira um item P1 de coesão de label (ver S3, item Eco-Label).
- **Cobertura da economia (R2):** auditada. As 7 ResourceKey têm fonte:
  `scrap`←Cordilheira/Sacrifice · `combustivel_volatil`←Extração ·
  `nucleo_logico`←Circuito · `sinais_controle`←Campo ·
  `biomassa_adaptativa`←Hordas/Infecção · `fragmentos_estruturais`←Catedral/Labirinto ·
  `ai_components`←Stealth/Torres/Sacrifice. **A receita das 8 peças é
  matematicamente completável.** R2 cai de "Alto" para "Médio" (só falta o
  *balance* da curva, não a viabilidade).

### Saúde do build (apurado agora, não assumido)
- `npm run typecheck` → **VERDE** (exit 0).
- `npm run build` → **VERDE** (exit 0), `dist/` gerado, PWA precache 777 KiB.
- **Mas:** `dist/assets/audio` = **20K** (só `.gitkeep`). **O build NÃO embute os
  WAVs.** Ver R-A1 na Seção 4 — isto muda a natureza do risco de áudio.

---

## 2. Novo caminho crítico

Com VS-1 (fim de jogo) FECHADO, o gargalo deixou de ser "fechar o loop" e passou a
ser **"o loop fechado é divertido o bastante pra mostrar a um estranho, e dá pra
colocá-lo no ar?"**. Nova cadeia crítica:

```
  [build VERDE — JÁ ESTÁ]
          │
          ▼
  ┌───────────────────────────────────────────────┐
  │ A. BALANCE DA CURVA (#019)                      │  decisão de design (game-designer)
  │    8 peças construíveis em ~6–10 runs, não 1/40 │  → sem isto o "fim de jogo" fechado
  │    + confirmar timers Circuito/Infecção         │     não é jogável de verdade
  └───────────────────┬───────────────────────────┘
                      │  (em paralelo, independente: B)
          ┌───────────┴───────────┐
          ▼                       ▼
  ┌──────────────────┐   ┌──────────────────────────────┐
  │ B. DECISÃO DE     │   │ C. FEEL/JUICE compartilhado   │
  │    ÁUDIO (R-A1)   │   │    (#010/#020) — pickup FX,    │
  │  *gate do deploy* │   │    "+1", shake, SFX           │
  │  transcode OU     │   │  vende o playtest             │
  │  ship sem música  │   └──────────────┬───────────────┘
  └────────┬─────────┘                  │
           │                            ▼
           │                  ┌──────────────────────┐
           │                  │ D. SMOKE-TEST POR ZONA │  cobre o risco do refactor
           │                  │  (cada zona jogada à mão)│  RunFrame/#73 já mergeado
           │                  └──────────┬─────────────┘
           └──────────────┬─────────────┘
                          ▼
                ┌──────────────────────┐
                │ E. DEPLOY (VS-5)      │  *BLOCKER EXTERNO: login Leticia*
                │  Cloudflare Pages     │
                └──────────────────────┘
```

**Cadeia mais longa (define a data):**
`BALANCE (#019)` → `FEEL (#010/#020)` → `SMOKE-TEST por zona` → `DEPLOY`.
**Gate paralelo, mas duro:** `DECISÃO DE ÁUDIO` precisa estar resolvida antes do DEPLOY.

**Mudanças de sequência vs. Rodada 1:**
1. VS-1 saiu do caminho crítico (feito). O novo item nº1 de alavancagem é o
   **balance da curva** — o fim existe mas pode ser inalcançável ou trivial.
2. **Audio mudou de "transcode pra caber" para "o build não embute áudio nenhum"**
   (S4). Decisão de produção, não só tarefa de tooling.
3. **Smoke-test por zona** entra como item de primeira classe: o #73 (split Hordas)
   e o `RunFrame` parcial mexeram em código de run shipado; precisa de playtest
   manual por zona antes de qualquer deploy (o próprio plano #018 exige isso).

---

## 3. Backlog do próximo sprint (1 sprint ≈ 1–2 semanas, time indie)

Premissas (subagente não-interativo): time pequeno, 4 "personas" de execução +
Leticia para decisões/credenciais. Capacidade é o constraint. **Buffer 20%** para
bugs/imprevistos (regra do projeto). IDs referenciam `task-queue.md` onde existe.

**Meta do sprint (critério de saída global):** um estranho pega o build local,
joga o loop completo (hub → 3–4 zonas → depositar → foguete cresce → LANÇAR →
tela de vitória) **sem ajuda e sem crash**, com feedback de coleta que "vende", e
a decisão de áudio para o deploy está tomada e documentada.

### P0 — sem isto o slice não fecha

| ID | Task | Dono (persona) | Tam | Deps | Critério de saída |
|----|------|----------------|-----|------|-------------------|
| S-01 | **Balance da curva do foguete** (#019): drop-counts em `assets/data` vs. ROCKET_RECIPE; fechar em ~6–10 runs. Confirmar timers Circuito (60→90) e Infecção (75→120) com o valor canônico | game-designer (decide) + Hub/Meta Eng (fia) | M | build verde (ok) | Jogando o loop normal, fechar o foguete leva 6–10 runs; mudar JSON muda a curva sem tocar scene; timers batem com o valor decidido |
| S-02 | **DECISÃO DE ÁUDIO p/ o deploy** (R-A1): escolher entre (a) transcode WAV→OGG + corrigir o serving de `public/assets` p/ os OGGs entrarem no `dist/`, ou (b) soft-launch só-SFX/silencioso e música pós-launch. Documentar como ADR/nota | Producer (facilita) + technical-director (build/PWA) + audio (audição) | P (decisão) + M (execução do caminho escolhido) | — | Decisão registrada; se (a): `dist/assets/audio` contém OGGs (~16MB) e música toca; se (b): build sem 404 de áudio e nota de escopo escrita |
| S-03 | **Feel-pass de coleta compartilhado** (#010/#020): helper único `collectFx(x,y)` — esporo + "+1" flutuante + pop + SFX de pickup; shake+flash no fim de run. Intensidades em GameConfig | FX/Feel Eng | M | — | Coletar em ≥3 zonas distintas dispara FX idêntico; vencer/perder dispara shake+som; intensidade muda via GameConfig sem tocar scene |
| S-04 | **Smoke-test manual por zona** (gate de regressão pós-#73/RunFrame): jogar cada uma das 8 zonas jogáveis à mão — mover, coletar, vencer E perder, sair com recompensa creditada no hub. Registrar bugs | QA + Producer (coordena) | M | S-01 (curva), S-03 (feel) idealmente antes | Checklist de 8 zonas todas verdes (sem crash, recompensa credita, sem UI sobreposta em 480×854); bugs achados viram tasks |

### P1 — necessário pro playtest "vender", não bloqueia o loop cru

| ID | Task | Dono (persona) | Tam | Deps | Critério de saída |
|----|------|----------------|-----|------|-------------------|
| S-05 | **Painel "Próxima Peça" no hub** (#006): receita atual com custo/recurso e progresso de stock; banner "Foguete pronto" quando completo | Hub/Meta Eng | M | — | Hub mostra a próxima peça e progresso por recurso em tempo real; fechar a última peça mostra o banner |
| S-06 | **Feedback de peça construída no foguete** (#004): renderer escuta `rocketPieceBuilt`, revela/acende o segmento + pulso. Mapa 8 peças → 8 segmentos em `assets/data` | Hub/Meta Eng | M | — | Fechar uma peça acende o segmento correspondente no foguete do hub na hora, com pulso |
| S-07 | **Reconciliação de labels de recurso** (Eco-Label, ex-#001 rebaixada): alinhar `Zones.ts` `resource` (display) e os labels do reward overlay com a ResourceKey realmente depositada, pro jogo não "mentir" o nome do recurso | UI Eng + narrative-director (nomes canônicos) | P | — | Em cada zona, o recurso exibido (HUD + reward) = nome canônico da key depositada; nenhum descasamento |
| S-08 | **HUD mínimo consistente** (#009): mochila X/Y sempre presente, timer só onde há, vida/derrota; componente comum em `ui/run/HUD` | UI Eng | M | — | Hordas/Extração/Stealth mostram o mesmo HUD base sem sobreposição em 480×854 |
| S-09 | **Zonas stub não quebram o loop** (#011): Cordilheira/Torres/Catedral completam mínimo-jogável e creditam recurso; badge "Prévia" no mapa | Gameplay Eng | M | S-04 | Entrar nas 3 pelo mapa permite coletar e sair com recompensa; badge "Prévia" visível |

### Fora deste sprint (P2 / pós-slice — documentado pra não relitigar)
- Save remoto Railway (#013) — localStorage cobre o slice.
- Polish do hub (#014), sequência cinemática de lançamento (#021).
- Refactor RunFrame zona-a-zona além da 1ª (#018) — só DEPOIS do smoke-test; uma
  zona por PR com playtest. **Não migrar as 11 de uma vez.**
- Alinhar os ~23 docs narrativos ao cânone Myco (#022) — docs, não código.
- Feel completo nas 7 zonas não-vitrine; arte real; música original.

**Carga estimada:** P0 = 4 itens (1×P, 3×M + decisão) · P1 = 5 itens (1×P, 4×M).
Para time indie de 4 execução isto é ~1 sprint de 2 semanas **com o buffer de 20%**
respeitado se S-09 e 1–2 P1 escorregarem pro sprint seguinte. **Não prometer todos
os P1.** Os 4 P0 + S-05/S-06 são o compromisso firme; S-07/S-08/S-09 são "se sobrar".

---

## 4. Os 3 maiores riscos restantes

Probabilidade × Impacto em Baixa/Média/Alta. Dono = quem mitiga.

### R-A1 — Pipeline de áudio: o build não embute áudio E o transcode está travado por ffmpeg local
- **Prob:** Alta · **Impacto:** Alto · **Dono:** technical-director + audio; Producer facilita a decisão
- **Por quê (apurado agora, pior que os docs diziam):** o código referencia
  `res://assets/audio/...wav`, que resolve para `/assets/...`. Em produção isso
  depende de `frontend/public/assets` ser um symlink para `../../assets` (comentado
  no `vite.config.ts`), **mas neste checkout `public/assets` é um diretório real
  sem os WAVs** — por isso `npm run build` gera `dist/assets/audio` com só **20K**
  (.gitkeep). Ou seja: **hoje o build de produção sai SEM música.** Além disso o
  transcode WAV→OGG (~106MB → ~16MB) está **BLOQUEADO**: `ffmpeg` não existe neste
  ambiente (confirmado: `which ffmpeg` → vazio). O maior WAV é 23,1MB (sob o cap de
  25MB/arquivo do Cloudflare por pouco), mas 106MB num PWA mobile é inviável de
  qualquer forma.
- **Mitigação (decisão S-02, escalar à Leticia/TD):**
  1. **Caminho A (com música):** rodar `tools/transcode-audio.sh` numa máquina com
     ffmpeg → gerar OGGs → **corrigir o serving** (symlink real ou copiar OGGs pra
     `public/assets/audio`) → trocar refs `.wav`→`.ogg` (passo atômico) → remover
     WAVs. Gate: `dist/assets/audio` passa a conter os OGGs e o jogo toca som.
  2. **Caminho B (destravar o soft-launch já):** shippar **só-SFX/silencioso** (os
     SFX `.wav` de UI são pequenos, ~1,5MB) e adicionar música no primeiro patch
     pós-launch. Remove ffmpeg do caminho crítico do deploy.
  - **Recomendação do Producer:** **Caminho B para o soft-launch**, A como
    fast-follow. Música não pode segurar o primeiro contato com jogador quando o
    tooling está bloqueado no ambiente. Documentar como decisão de escopo.
  - **Gate "feito":** decisão registrada; `npm run build` sem 404 de áudio no
    console; se B, nota de escopo + task de fast-follow criada.

### R-B — Refatoração #73 / RunFrame mexeu em código de run shipado sem playtest por zona
- **Prob:** Média · **Impacto:** Alto · **Dono:** QA + Producer (coordena o smoke-test); Lead Programmer para fixes
- **Por quê:** o #73 extraiu Hordas para `scenes/runs/hordas/*` e há um `RunFrame.ts`
  base parcial. O plano de refactor (`docs/architecture/run-framework-refactor.md`)
  **explicitamente exige** que cada zona migrada seja jogada manualmente antes do
  merge — porque os bugs aqui são de **ordem de lifecycle e binding de input**, que
  `tsc`/`build` **NÃO pegam** (ambos estão verdes e mesmo assim pode haver regressão
  de gameplay). Hordas é a zona mais "gorda" (1163 linhas originais) e a mais
  arriscada de ter regredido no split.
- **Mitigação:** **S-04 é o controle direto deste risco** — smoke-test manual das 8
  zonas jogáveis (mover/coletar/vencer/perder/recompensa) antes de qualquer deploy.
  Priorizar Hordas (a refatorada) e Extração (que reimplementa pointer binding à mão
  e é a próxima candidata a migrar em #018). **Nenhuma migração nova de zona
  (#018) entra neste sprint** até o smoke-test passar. Regra: 1 zona por PR, com a
  Leticia jogando cada uma.
- **Gate "feito":** checklist de 8 zonas verde; qualquer regressão vira bug P0 antes
  do deploy.

### R-C — Balance: o "fim de jogo" existe mas a curva pode ser inalcançável ou trivial
- **Prob:** Média · **Impacto:** Médio · **Dono:** game-designer (decide a curva) + Producer (audita)
- **Por quê:** VS-1 fechou a *mecânica* de vitória, mas os drop-counts por zona ainda
  não foram cruzados com o custo total da receita (8 peças; picos altos em
  `sinais_controle: 20` e `30`, só fonte = Campo). Se Campo dropar pouco
  `sinais_controle` por run, fechar o foguete pode exigir dezenas de runs (grind) —
  ou, ao contrário, fechar em 1–2 runs e o slice não ter clímax. Os 7 recursos têm
  fonte (R2 resolvido), então é **tuning, não viabilidade.** Some-se a isto os 2
  timers roteados em aberto (Circuito 90s afrouxa a "parede" marcada pelo Level
  Designer; Infecção 120s).
- **Mitigação:** **S-01** — tabela zona→key→drop-por-run vs. receita total, alvo
  6–10 runs; drop-counts em `assets/data` (não hardcoded) pra iterar barato; decidir
  os 2 timers no mesmo passe. Validar no smoke-test (S-04) que um jogador novo fecha
  o foguete numa sessão razoável.
- **Gate "feito":** ≥1 sessão completa fecha o foguete em 6–10 runs; nenhum recurso
  vira gargalo de grind; timers confirmados.

---

## 5. Como saberemos que acertamos (métricas de validação)

- **S-01/R-C:** ≥1 jogador novo fecha o foguete em 6–10 runs numa sessão, sem grind.
- **S-02/R-A1:** decisão de áudio registrada; `npm run build` sem 404 de áudio.
- **S-03:** coleta dispara FX idêntico em ≥3 zonas; playtester nota o feedback.
- **S-04/R-B:** 8 zonas smoke-test verdes; Hordas (refatorada) joga idêntica ao esperado.
- **Sprint:** um estranho joga o loop completo até LANÇAR sem ajuda e sem crash.

## 6. Handoffs imediatos (Producer → personas)

| Para | Pedido | Bloqueia |
|---|---|---|
| game-designer | Decidir a curva de drops (alvo 6–10 runs) + os 2 timers (Circuito/Infecção) | S-01, R-C |
| technical-director | Co-decidir o caminho de áudio (A transcode vs. B só-SFX) e corrigir o serving de `public/assets` | S-02, R-A1, deploy |
| audio | Audição pós-transcode SE caminho A | S-02 |
| QA | Conduzir o smoke-test das 8 zonas (Hordas/Extração primeiro) | S-04, R-B |
| Leticia | (1) ratificar a decisão de áudio; (2) login Cloudflare Pages — avisar 2 sprints antes do deploy | S-02, VS-5 |

---

### Premissas assumidas nesta passagem (revisar quando a Leticia voltar)
- A1: Soft-launch = PWA web pública (Cloudflare Pages), sem app store (coerente com ADR-002).
- A2: Vitrine = loop completo + 3–4 zonas com feel; as 11 já jogáveis, corte é de profundidade.
- A3: Áudio NÃO segura o deploy — recomendo Caminho B (só-SFX no launch, música fast-follow).
- A4: Backend/Railway fora do caminho crítico (localStorage cobre).
- A5: Nenhuma migração nova de zona (#018) neste sprint até o smoke-test passar.
