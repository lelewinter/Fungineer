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

---

# Pass 2 (2026-06-05) — "vamos de Dr. Myco"

Build verde (tsc --noEmit + vite build) após cada item.

## ✅ Implementado no Pass 2

### 6. Cânone travado: Dr. Myco
Decisão da Leticia. Reconciliação (World Builder): "Dr. Myco" é o apelido
pós-Transição; "Paulo Vitor Santos" é o nome de nascimento / identidade anterior
(quando ajudou a criar a IA). Regra completa em
`design/narrative/canon-decision-protagonist.md`.
- Strings player-facing → "Dr. Myco": `HubRocketPanel`, `RocketLaunchOverlay`,
  `HubData` (hint do NPC doutor + glyph 'M', briefings do doutor/Hordas, fala da Priya),
  comentários da `HordasScene`.
- **Preservados de propósito:** comentário de passado em `FieldControlScene`
  ("where Paulo stood, five years ago" — é o passado dele) e o NPC distinto
  "Paulo A. Martins" em `LoreFragments` (pessoa diferente).
- **Pendente:** ~23 docs em `design/narrative/` ainda usam "Paulo" como nome
  corrente — alinhamento é tarefa do Writer (precisa de julgamento por contexto).

### 7. Música data-driven (Hordas / Field / Sacrifice)
As 3 zonas com HUD/enter custom hardcodavam o path da música. Agora leem
`ZONE.music` (`if (ZONE.music) playMusic(ZONE.music, …)`), como as outras 8.
- Faixas atuais preservadas: Field/Sacrifice já batiam com o data; a Hordas
  movido para o data (`ZONES[0].music = battle.wav`, sua faixa de combate dedicada).

### 8. Botão SAIR no Field
O Field era a única zona sem como sair (o Sacrifício já tem o tile `EXIT_RECT`).
Adicionado um botão "✕ SAIR" no HUD (hit area ~60px) que encerra a run como
derrota e volta ao hub.

### 9. SaveService — já estava pronto (nada a fazer)
A task-queue marcava 005 como PENDING, mas o `SaveService` já está completo e
fiado no `main.ts`: `load()` no boot, `arm()` nos signals do HubState (debounce
1.5s), `flush()` no `pagehide`, fallback localStorage. **Verificado, nenhuma ação.**

### Reward scene (task-queue 002/003) — já coberto
`buildEndOverlay({zone, victory, rewardLabel, failLabel})` já mostra recompensa/
derrota por zona no fim de cada run. Uma `RewardScene` separada seria redundante;
não implementada de propósito.

## ⛔ Bloqueado por tooling
- **Transcode de áudio 106MB → ~15.8MB OGG** — `ffmpeg` **não está disponível**
  neste ambiente. O script já existe e é idempotente; rodar localmente:
  ```
  tools/transcode-audio.sh          # gera .ogg ao lado dos .wav
  tools/transcode-audio.sh --dry-run
  ```
  Depois: trocar refs `.wav → .ogg` no código (passo atômico separado) e remover
  os WAVs. Gate do deploy Cloudflare (cap 25MB/arquivo).

## ⏸️ Deferido por decisão (risco > valor sem playtest)
- **Refactor `RunScene` base class** (Lead Programmer) — dedupe real (pointer
  binding ×7, delta-cap ×11, music ×11). **Não feito de propósito:** o próprio
  plano exige *"a zona migrada precisa ser jogável manualmente antes do merge"*,
  e migrar 11 zonas que já funcionam **sem playtest** arrisca quebrar gameplay
  shipado de forma que tsc/build não pegam (ordem de lifecycle, binding de input).
  Recomendação: fazer zona-a-zona com a Leticia jogando cada uma. Plano completo
  em `docs/architecture/run-framework-refactor.md`.

## ⚠️ Decisões de design ainda em aberto (de Pass 1)
- Timers Circuito (60→90) e Infecção (75→120) roteados pro valor do GameConfig —
  confirmar se é o desejado (1 linha pra reverter).
