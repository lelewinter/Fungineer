# Implementation Notes — Persona Follow-ups (2026-06-05)

Pass de implementação derivado das 17 personas. Só entrou aqui o que foi
**verificado contra o código shipado** e validado com `npm run build` (verde).
Várias sugestões dos agentes miravam config morto ou mecânicas que não existem
mais — listadas no fim pra não serem reimplementadas por engano.

## ✅ Implementado (build verde: tsc + vite build)

### 1. Timers de run centralizados no GameConfig
Os 8 scenes que declaravam `const TIMER = N` local agora leem de
`GameConfig.*_RUN_TIMER` (regra do projeto: nenhum número mágico de gameplay em
scene code). Adicionadas 5 keys: `STEALTH/CORDILHEIRA/TORRES/CATEDRAL/LABIRINTO_RUN_TIMER`.

**⚠️ Decisão de design pendente** — dois scenes divergiam do config e foram
roteados para o **valor documentado no config** (tratado como fonte de verdade),
o que muda a duração efetiva:
- **Circuito:** rodava 60s (hardcode) → agora 90s (`CIRCUIT_RUN_TIMER`). +30s.
- **Infecção:** rodava 75s (hardcode) → agora 120s (`INFECTION_RUN_TIMER`). +45s.

Se o valor pretendido era o hardcode, basta editar a key no GameConfig (1 linha).
Game designer precisa confirmar. O Level Designer marcou Circuito como a "parede" —
90s a afrouxa.

### 2. Vazamento de setTimeout (Field & Sacrifice)
`FieldControlScene` e `SacrificeScene` faziam `setTimeout(...replace(HubScene), 2500)`
sem cancelar. Agora o handle é guardado e limpo no `exit()` → sem risco de
dupla-navegação se a cena for trocada antes do timer.

### 3. Barras de progresso invertidas (Extração & Circuito)
Usavam `setHealth(1 - progresso)`, fazendo a barra ficar **vermelha/vazia
justamente ao vencer** (o `setHealth` pinta de vermelho abaixo de 0.4). Invertido
para `setHealth(progresso)` → enche conforme você avança.

### 4. Denominador da barra de Infecção
`setHealth(1 - pelletsLeft / (COLS*ROWS))` usava o total de células (221) em vez
do total de pellets. Agora guarda `totalPellets` no init e usa
`1 - pelletsLeft / totalPellets` → escala 0→1 correta.

### 5. 🚀 Fim de jogo / lançamento do foguete (o risco #1)
`HubState.isRocketComplete()` existia mas **não era consumido** — o jogo não tinha
final. Agora:
- `HubState.resetForNewCycle()` zera o progresso de run (preserva prefs cosméticas).
- `HubRocketPanel` mostra um botão **🚀 LANÇAR** quando o foguete está completo
  (sinal `launchRequested`).
- Novo `ui/hub/RocketLaunchOverlay.ts` — tela de vitória (DECOLAGEM + resumo:
  peças/raides/sobreviventes) com botão **Novo Ciclo** que reseta e volta ao hub.
- Fiação no `HubScene` (`launchRequested → openModal(RocketLaunchOverlay)`).

O `HubRenderer.redraw()` roda contínuo derivando do `HubState`, então o reset
reflete no hub automaticamente. (FX de lançamento é mínimo — bob/flicker do glifo;
uma `LaunchScene` cheia com tween de subida + câmera fica como polish futuro.)

## ❌ Sugestões de agentes que NÃO se aplicam ao código atual
Ao inspecionar o fonte, estas premissas estavam erradas (os agentes raciocinaram
a partir de docs/config, não do scene shipado):

- **"Loop quebrado / recursos descartados" (Producer, TD, Economy, Task-Writer):**
  não confirmado. Quase todas as zonas chamam `HubState.depositFlow('<ResourceKey>', n)`
  com a key correta; Sacrifício usa `depositBackpack` com `'scrap'/'ai_components'`
  (keys válidas). O gap só existiria no `ResourceItem` genérico (default `'scrap'`),
  cujo backpack não é depositado fora de Sacrifício. **Nenhum recurso some no loop real.**
- **"Spike injusto da Extração" (Level Designer):** baseado em lanes/scroll/debuffs
  LENTO+FAÍSCA. O `ExtractionScene` real é Boulder Dash (cavar/empurrar pedras) e
  **não usa** `EXTRACTION_LANE_*/SCROLL_*/DEBUFF_*/SPARK_*`. Essas keys do GameConfig
  são **mortas** (design lane-runner antigo) — candidatas a remoção.
- **"Circuito inacessível pra daltônicos" (UX):** o UX descreveu Circuito como
  "fios por cor em sequência". O Circuito real é Snake/Tron (rastro). Fix de
  textura por cor não se aplica.
- **"Labirinto em faixa de fotossensibilidade >2Hz" (UX):** o aviso de parede usa
  cadência de 2-3s (`MAZE_WARNING_*`), não blink rápido. Sem risco.

## ⏳ Trabalho maior não feito neste pass (precisa de design/decisão ou é multi-sessão)
- **Refactor `RunScene` base class** (Lead Programmer) — elimina duplicação real
  (pointer binding ×7, delta-cap ×11, music ×11). Plano em `docs/architecture/run-framework-refactor.md`.
- **Tela de recompensa unificada** (task-queue 002/003) e **SaveService** (005).
- **Música data-driven** (Hordas/Field/Sacrifice hardcodam paths que divergem de
  `ZONES[].music`) — qual valor é o certo precisa do audio/design.
- **Quit button em Field/Sacrifice** (HUDs custom sem o botão de desistir).
- **Transcode de áudio 106MB → ~15.8MB OGG** (Audio Director / `task-audio-transcode.md`) —
  gate do deploy Cloudflare.
- **Reconciliação de cânone Dr. Myco vs Dr. Paulo** (CD/Narrative/World-Builder).
