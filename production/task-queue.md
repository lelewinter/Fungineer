# Fungineer — Task Queue

Backlog priorizado do **próximo vertical slice**: um build jogável de ponta-a-ponta
(hub -> escolher zona -> raid -> coletar recurso -> tela de recompensa -> depositar
no hub -> peça do foguete sobe -> repetir, com polish suficiente pra playtest e um
estado de vitória quando o foguete fica completo).

## Premissas assumidas (subagente não-interativo, Leticia indisponível)

Decididas sozinha pra destravar o slice. Revisar quando ela voltar.

1. **Fonte de verdade:** `design/MASTERPLAN.md` + `README.md`. São 11 zonas só-movimento,
   protagonista Dr. Myco, foguete biológico. O prompt-base que cita "9 zonas / Godot"
   foi ignorado.
2. **Alvo do slice:** profundidade vertical, não largura. Foco no loop completo usando
   as zonas que já são jogáveis (Hordas, Campo, Sacrifício, Stealth, Circuito,
   Extração, Infecção, Labirinto). As 3 de superfície (Cordilheira/Torres/Catedral)
   ficam em P2 — só precisam não quebrar o loop.
3. **Backend opcional:** o slice tem que ser 100% jogável só com frontend + localStorage.
   Save remoto (FastAPI) é P2, sem bloquear o loop.
4. **Valores de gameplay** vivem em `frontend/src/state/GameConfig.ts` ou em JSON sob
   `frontend/public/assets/data/`. Nada de número mágico em scene/run code.
5. **Sem arte custom nova:** placeholders procedurais respeitando a paleta canônica.
   Integração de pixel art real (CC0/custom) está fora do slice.
6. **Mobile-first:** viewport 480x854 (já em GameConfig), input só toque/drag.
7. **Mapa de recursos:** os `resource` em `Zones.ts` (strings PT) precisam de um mapa
   canônico para as `ResourceKey` de `HubState.ts`. Hoje há gap — tratado como P0.
8. **Personas/donos:** Gameplay Eng (sistemas de run), Hub/Meta Eng (loop e economia),
   FX/Feel (juice, partículas, áudio), Tools (geração procedural/dados).

## Legenda

- Prioridade: **P0** bloqueante do loop · **P1** necessário pro playtest · **P2** nice-to-have
- Tamanho: **P** (~meia sessão) · **M** (1 sessão) · **G** (multi-sessão)
- Dono: Gameplay Eng · Hub/Meta Eng · FX/Feel · Tools

---

## P0 — Bloqueantes do loop de ponta-a-ponta

---TASK---
ID: 001
Status: PENDING
Tela: frontend/src/state/HubState.ts
Descrição: Criar um mapa canônico recurso-de-zona -> ResourceKey. Hoje cada ZoneData em Zones.ts tem `resource` como string PT ("Núcleo Lógico", "Combustível Volátil", etc.) e HubState.depositBackpack só credita quando o item já é uma ResourceKey, então recursos coletados com outro rótulo somem. Adicionar `RESOURCE_KEY_BY_ZONE: Record<string, ResourceKey>` (chaveado por scene id da zona: 'main','field','sacrifice','stealth','circuit','extraction','infection','maze') em assets/data/resources.json, carregado por HubState. Backpack passa a guardar ResourceKey já normalizada na coleta (na run), e depositBackpack credita direto. Definir as ResourceKey faltantes que aparecem em ROCKET_RECIPE mas não no mapa.
Como verificar: rodar Hordas, coletar 3 recursos, voltar ao hub: o stock da ResourceKey correta sobe em 3 (visível no painel de stock do hub) e nenhum item é descartado.
---END---

---TASK---
ID: 002
Status: PENDING
Tela: frontend/src/scenes/runs/RunFrame (e cada *RunScene)
Descrição: Padronizar a saída de toda run num único contrato de resultado. Criar tipo `RunResult { victory: boolean; resourceKey: ResourceKey | null; resourceCount: number; fragments: number; }` e garantir que toda cena de run (Hordas, Field, Sacrifice, Stealth, Circuito, Extraction, Infeccao, Labirinto) emita esse resultado via GameState.runEnded ao terminar. Hoje GameState.runEnded emite só (victory, fragments) e o backpack vive à parte; unificar para a tela de recompensa (task 003) consumir uma estrutura só. Não alterar valores de balance — só o contrato de saída.
Como verificar: terminar qualquer zona jogável (vitória ou derrota) loga no console um RunResult coerente com o que foi coletado, e nenhuma cena de run lança erro de tipo no `npm run typecheck`.
---END---

---TASK---
ID: 003
Status: PENDING
Tela: frontend/src/scenes/runs (nova RewardScene/Overlay) + frontend/src/ui/Modal
Descrição: Criar a tela de recompensa pós-run que aparece entre a run e o retorno ao hub. Consome o RunResult (task 002). Mostra: vitória/derrota, recursos coletados (ícone+contagem por ResourceKey), tech fragments ganhos, e botão "Voltar ao Hub". Ao confirmar, chama HubState.depositBackpack/depositFlow e navega pro HubScene. Valores de timing/layout em GameConfig (ex: REWARD_REVEAL_DELAY), nunca hardcoded. Reusar Modal/PixiButton existentes.
Como verificar: ao terminar Hordas com vitória e 2 recursos coletados, aparece a tela de recompensa listando "+2 Biomassa" e os fragments; clicar "Voltar ao Hub" leva ao HubScene com o stock atualizado.
---END---

---TASK---
ID: 004
Status: PENDING
Tela: frontend/src/scenes/hub/HubScene (renderer do foguete)
Descrição: Garantir feedback visual imediato quando uma peça do foguete é construída. HubState.rocketPieceBuilt já emite (pieceIndex, pieceName); o renderer do foguete no hub deve escutar e (a) revelar/preencher a peça correspondente no sprite do foguete e (b) disparar um pulso/destaque. Mapear os 8 itens de ROCKET_RECIPE para 8 segmentos visuais do foguete. Posições/cores dos segmentos em assets/data/rocket_segments.json. Sem hardcode de coordenadas no scene.
Como verificar: depositar recurso suficiente pra fechar a "Base Estrutural" faz o segmento da base aparecer/acender no foguete do hub na hora, com um pulso visível.
---END---

---TASK---
ID: 005
Status: PENDING
Tela: frontend/src/state/SaveService + HubState/GameState
Descrição: Persistir o progresso do meta-loop em localStorage a cada ponto estável (peça construída, retorno ao hub, recurso depositado). HubState.toSnapshot/loadFromSnapshot já existem; ligar o SaveService para chamar toSnapshot após cada deposito/build e restaurar no boot. Chave e debounce em GameConfig (ex: SAVE_DEBOUNCE_MS). Sem backend — só localStorage, com try/catch silencioso. Fazer o BootScene chamar loadFromSnapshot.
Como verificar: construir 1 peça do foguete, dar refresh (F5) no navegador: o hub volta com rocket_pieces_built preservado e o stock restante intacto.
---END---

## P1 — Necessário pro playtest

---TASK---
ID: 006
Status: PENDING
Tela: frontend/src/scenes/hub/HubScene + frontend/src/ui/hub
Descrição: Adicionar um painel "Próxima Peça" persistente no hub mostrando a receita atual (HubState.nextPieceCost()) com custo por recurso e quanto já está em stock (ex: "Motor Principal — Combustível Volátil 1/3"). Atualiza via stockChanged e rocketPieceBuilt. Quando isRocketComplete() vira true, troca pra um banner "Foguete pronto pra lançar". Layout/strings em assets/data; números vêm de HubState.
Como verificar: no hub, o painel mostra a próxima peça e o progresso de cada recurso; ao depositar, os contadores sobem em tempo real e, ao fechar a última peça, surge o banner de foguete pronto.
---END---

---TASK---
ID: 007
Status: PENDING
Tela: frontend/src/scenes/hub/HubScene (nova LaunchScene/sequence)
Descrição: Implementar o estado de vitória do jogo. Quando HubState.isRocketComplete() é true, o foguete no hub fica interagível ("Lançar"); ao acionar, roda uma sequência de lançamento (tween de subida + FX) e abre uma tela final de vitória com resumo do run (peças, recursos totais, sobreviventes resgatados, runs totais). Botão "Novo Ciclo" reseta o estado pra rejogar. Timings/FX em GameConfig.
Como verificar: com as 8 peças construídas, o botão "Lançar" aparece no foguete; acioná-lo roda a animação e mostra a tela de vitória com o resumo; "Novo Ciclo" zera o progresso.
---END---

---TASK---
ID: 008
Status: PENDING
Tela: frontend/src/scenes/WorldMapScene
Descrição: No mapa-mundo, exibir por zona o recurso que ela dá e o nível de deterioração atual (HubState.zone_deterioration / getSpawnMultiplier). Cada card de zona mostra ícone do recurso e um indicador de estágio (0/1/2) com a cor de alerta. Marcar visualmente quais recursos a próxima peça do foguete ainda precisa (cruza com nextPieceCost) pra guiar a escolha de raid. Dados visuais em assets/data; lógica lê de HubState.
Como verificar: abrir o mapa-mundo mostra, em cada zona, o recurso e o estágio de deterioração; as zonas cujo recurso a próxima peça precisa ficam destacadas.
---END---

---TASK---
ID: 009
Status: PENDING
Tela: frontend/src/scenes/runs (HUD da run) + frontend/src/ui/run/HUD
Descrição: Garantir HUD mínimo consistente em todas as zonas jogáveis: contador de recurso coletado / capacidade da mochila (HubState.getBackpackCapacity), timer da zona quando aplicável, e estado de vida/derrota. Hoje o HUD varia por zona; extrair um componente comum em ui/run/HUD configurável por flags (temTimer, temMochila, temVida) lidas do RunFrame. Sem números hardcoded — limites vêm de GameConfig/HubState.
Como verificar: entrar em Hordas, Extração e Stealth mostra o mesmo HUD base (mochila X/Y sempre presente, timer só onde a zona tem timer) sem sobreposição de UI em 480x854.
---END---

---TASK---
ID: 010
Status: PENDING
Tela: frontend/src/scenes/runs (todas) + FX core
Descrição: Pass de "feel" mínimo no momento de coleta de recurso e no fim de run, compartilhado entre zonas: partícula de esporo + número flutuante "+1" ao coletar, screen-shake leve + flash temático na vitória/derrota, e SFX sintetizado via AudioManager (pickup, win, lose). Isso é o gancho de feedback que vende o playtest. Intensidades (shake, duração, escala do número) em GameConfig.
Como verificar: coletar um recurso em qualquer zona dispara partícula + "+1" + som de pickup; vencer/perder dispara shake e som correspondentes, idêntico entre zonas.
---END---

---TASK---
ID: 011
Status: PENDING
Tela: frontend/src/scenes/runs/StubRunScene + WorldMapScene
Descrição: Fazer as zonas ainda-stub (Cordilheira, Torres, Catedral) não quebrarem o loop: StubRunScene deve completar de forma jogável-mínima (coletar N recursos num timer curto e sair com um RunResult válido — task 002), creditando o recurso da zona. No mapa-mundo, marcá-las com badge "Prévia". Parâmetros (N, timer) em GameConfig por zona.
Como verificar: entrar na Cordilheira pelo mapa permite coletar recursos e sair com recompensa creditada no hub; a zona aparece com badge "Prévia" no mapa-mundo.
---END---

## P2 — Nice-to-have (não bloqueia o playtest)

---TASK---
ID: 012
Status: PENDING
Tela: frontend/src/scenes/hub/HubScene (NPCs) + frontend/src/state/CharacterRegistry
Descrição: Refletir sobreviventes resgatados no hub: cada personagem em CharacterRegistry/rescued_characters aparece como NPC no hub com nome e cor (SURVIVOR_ROSTER). Resgatar em Hordas deve persistir e popular o hub no retorno. Posições dos NPCs em assets/data; sem hardcode.
Como verificar: resgatar um personagem numa run de Hordas faz um NPC novo aparecer no hub com o nome/cor do roster ao voltar.
---END---

---TASK---
ID: 013
Status: PENDING
Tela: backend/main.py + frontend/src/core/ApiClient + SaveService
Descrição: Ligar o save remoto opcional ao loop. Quando VITE_API_URL existe, SaveService faz POST /api/state/save com o snapshot após cada ponto estável e GET /api/state/{slot} no boot, com fallback silencioso pra localStorage se a rede falhar. Sem mudar o schema do snapshot (HubStateSnapshot v1).
Como verificar: com backend rodando e VITE_API_URL setado, construir uma peça e dar refresh recupera o progresso mesmo com o localStorage limpo; sem backend, cai pro localStorage sem erro no console.
---END---

---TASK---
ID: 014
Status: PENDING
Tela: frontend/src/scenes/hub/HubScene + frontend/src/core (post-processing)
Descrição: Polish ambiente do hub pra vender o playtest: esporos flutuando, luz de lanterna quente radial sobre o Dr. Myco e o foguete, e CRT/vinheta suaves com toggle de intensidade. Tudo respeitando a paleta canônica (HUB_VARIANTS). Intensidades e densidade de partículas em GameConfig; toggle persistido no snapshot (hub_density já existe).
Como verificar: abrir o hub mostra esporos animados e a luz de lanterna sobre o foguete; alternar a densidade muda a quantidade de partículas e o estado persiste após refresh.
---END---

---TASK---
ID: 015
Status: PENDING
Tela: frontend/src/scenes/runs (todas) + frontend/src/state/GameConfig.ts
Descrição: Passe de balance inicial pro playtest: ajustar quantos recursos cada zona dá por run vs. o custo total de ROCKET_RECIPE (37+ unidades distribuídas) pra que o foguete completo leve ~6-10 runs, não 1 nem 40. Centralizar drop-count por zona em assets/data/zone_rewards.json e referenciar em GameConfig. Documentar a curva esperada num comentário.
Como verificar: jogando o loop normalmente, fechar o foguete leva entre 6 e 10 runs bem-sucedidas; o número de drops por zona vem do JSON e mudar o JSON muda a curva sem tocar em scene code.
---END---
