# Fungineer — Audio Direction

**Version**: 1.0
**Date**: 2026-06-05
**Author**: Audio Director (subagent)
**Status**: Approved for Implementation

---

## Premissas de produção documentadas

Este documento foi produzido sem iteração interativa. As seguintes premissas foram
assumidas com base nos documentos fonte (MASTERPLAN.md, README.md,
production/task-audio-transcode.md, GDDs de zona):

- Toda música parte como síntese procedural (WebAudio / MusicSynth existente) e
  será substituída por trilha real no M6/M7.
- O pipeline de transcode já estabelece OGG Vorbis como formato único de entrega.
- O AudioManager existente suporta fallback procedural: quando um arquivo não existe,
  rota para `sfxSynth` / `musicSynth`. Esta direção é compatível com esse modelo.
- Mobile-first significa que o design de mix assume fone de ouvido monofônico
  barato como pior caso, e caixinha de smartphone como caso mediano.
- "11 zonas" conforme README.md (Hordas, Campo, Sacrifício, Stealth, Circuito,
  Extração, Infecção, Labirinto, Cordilheira, Torres, Catedral). O MASTERPLAN.md
  lista 8 — a discrepância é tratada como evolução do design; o README.md é
  considerado mais atual.

---

## 1. Paleta Sonora Central — Orgânico vs. Máquina

### 1.1 A tese sonora

O jogo tem uma tese filosófica que precisa ser audível sem narração: natureza e
fungo são a tecnologia dos sobreviventes; aço e código são a tecnologia das IAs.
O áudio deve tornar isso sensível — não apenas ambiental, mas estrutural. A
diferença entre zonas orgânicas e zonas de IA não é de gênero musical: é de
matéria sonora.

### 1.2 Camada Orgânica — O Mundo dos Sobreviventes

**Instrumentação e textura:**

- **Cordas friccionadas**: violoncelo e contrabaixo gravados com arco lento,
  harmonias abertas e imperfeitas. Não polido. A afinação pode vagar levemente.
- **Percussão de corpo**: batidas em superfícies de madeira, troncos ocos,
  tambores de barril. Sem kit de bateria eletrônica.
- **Sopros de madeira**: flauta doce, ocarina, ou flauta de bambu. Timbre
  irregular, humano, com ruído de ar audível nas notas mais fortes.
- **Bioluminescência sonora**: sons de cristal (water glass, glass harmonica) para
  representar o brilho dos fungos — etéreos, não sintéticos.
- **Voz humana**: humming, vocalizações sem palavras, respiração. Presente no hub
  e em momentos de vitória. Nunca em zonas de IA pura.
- **Textura de micélio**: ruído granular de baixa frequência (80–200 Hz), como
  crescimento subterrâneo. Presente como drone de fundo no hub. Não musical — só
  textura.

**O que é diegético na camada orgânica:**

| Fonte | O que o jogador ouve | Justificativa narrativa |
|---|---|---|
| Passos do Dr. Myco | Folhas secas, terra compacta | Ele caminha sobre superfícies naturais |
| Foguete no hub | Borbolhamento de fermentação, estalo de madeira | O foguete é biológico |
| Esporos flutuando | Tinidos suaves, glissandos curtos de água | Partículas bioluminescentes |
| NPCs no hub | Vozes abafadas, sons de vida (tosse, riso baixo) | Humanos vivendo |
| Coleta de recurso orgânico | Clique úmido, sucção | Substância biológica sendo capturada |

### 1.3 Camada da Máquina — O Mundo das IAs

**Instrumentação e textura:**

- **Síntese subtrativa fria**: ondas quadradas e dente-de-serra com envelope
  preciso. Zero imprecisão de afinação. Articulação mecânica, não musical.
- **Ruído branco recortado**: usado como percussão de IA — clicks, glitches,
  dropout de bits. Não melódico.
- **Drones de motor**: frequências estáticas na faixa de 100–400 Hz imitando
  servidores ou transformadores. Sempre um tom fixo, sem vibrato.
- **Metalofone processado**: samples de metal (chapa, trilho) com EQ que remove
  os harmônicos quentes, deixando apenas o timbre frio e alto.
- **Pulsos rítmicos de relógio**: clock subdivisions em tempos exatos. Sem swing.
  Humanização zero.
- **Voz sintetizada de IA**: drones modulados que sugerem prosódia mas não chegam
  a palavra — como um LLM sendo ouvido por dentro.

**Como a IA invade o orgânico:**

Este é o dispositivo central de tensão sonora. Nas zonas controladas por máquinas,
a paleta orgânica não desaparece — ela é corrompida. O processo de invasão sonora
tem três estágios, mapeados ao estado de risco da run:

**Estágio 0 — Orgânico puro (hub, entrada na zona):**
Apenas paleta natural. Música e ambiente sem elemento sintético.

**Estágio 1 — Contaminação (risco médio, presença de patrulha, alerta parcial):**
Um drone de IA, suave e constante, é inserido abaixo da música orgânica.
Frequência: 220 Hz ou 440 Hz, onda quadrada com volume a -18 dB relativo à música.
O jogador sente o perigo antes de vê-lo.

**Estágio 2 — Invasão (alerta ativo, detecção iminente, barra de risco alta):**
A música orgânica é LPF (low-pass filtered) progressivamente — como ouvir através
de concreto. O drone de IA sobe em volume e começa a bater em ritmo de clock. Os
instrumentos quentes somem; o que resta é só o esqueleto harmônico mais o ruído
sintético.

**Estágio 3 — Captura/morte:**
Silêncio total por 0.3s → burst de ruído branco processado (0.5s) → silêncio.
Seguido de som de falha: tom descendente de 8-bit, seco. Sem música imediatamente
após. O hub restaura a camada orgânica com fade lento (3s).

**Tabela de parâmetros de invasão:**

| Parâmetro | Estágio 0 | Estágio 1 | Estágio 2 | Estágio 3 |
|---|---|---|---|---|
| LPF na música orgânica | Nenhum | Nenhum | 800 Hz corte | Corte total |
| Drone de IA (dB relativo) | Off | -18 dB | -8 dB | Off (burst) |
| BPM do clock sintético | Off | Off | Dobra a cada alerta | Off |
| Voz humana nos SFX | Presente | Presente | Abafada | Ausente |

---

## 2. Estratégia de Música por Contexto

### 2.1 Princípio de coesão

Onze zonas com identidades radicalmente diferentes corriam o risco de soar como
onze jogos distintos. A estratégia de coesão é definida por duas regras:

**Regra 1 — Um sistema harmônico compartilhado.** Toda música do jogo vive em
escalas modais específicas. Modos orgânicos (Dórico, Mixolídio) para ambientes
de sobreviventes. Modos mecânicos (Lócrio, tons inteiros) para territórios de IA.
A transição entre escalas é o sinal musical de onde você está.

**Regra 2 — Um motivo de identidade recorrente.** Um fragmento melódico de 4
notas (O Motivo do Foguete, definido abaixo) aparece em todas as músicas do jogo
de formas diferentes: esperançoso no hub, distorcido nas zonas de IA, triunfante
no lançamento. O jogador não precisa reconhecê-lo conscientemente — só precisa
sentir que o jogo tem alma consistente.

**O Motivo do Foguete:**
`Mi - Sol - La - Re` (intervalo de quarta ascendente, depois terça menor, depois
quarta descendente). Evoca ascensão (Mi→La) seguida de incerteza (La→Re).
Absurdamente otimista e levemente torto — como Dr. Myco.

### 2.2 Hub — Base de Resistência

**Estado emocional:** Santuário. Esperança desesperada em repouso. O jogador
precisa sentir que pode respirar, mas que o mundo lá fora é real e perigoso.

**Música:** `mus_hub_base_calm_loop.ogg`

- Modo Dórico em Mi menor
- Instrumentação: cello em pizzicato, flauta de bambu, água (granular), drone de
  micélio no sub-grave
- Tempo: 72 BPM. Suave swing orgânico.
- O Motivo do Foguete aparece na flauta, uma vez a cada ~32 compassos, quase
  imperceptível
- Quando o foguete ganha uma nova peça: stinger de 4s (`mus_hub_rocket_upgrade_stinger.ogg`)
  que é o Motivo do Foguete tocado pleno, com acordes de cordas e vozes
- Loop: intro de 8 compassos + loop de 32 compassos. Transição sem corte.

**Variante noturna / tensão pré-run:**
Quando o jogador abre o mapa-mundo para escolher zona, um filtro HPF sobe
gradualmente na música do hub (700 Hz → 2 kHz em 2s), tornando-a mais etérea e
distante — psicologicamente preparando a saída.

### 2.3 Mapa-Mundo

**Música:** `mus_world_overview_loop.ogg`

- Versão mais esparsa da música do hub: só drone de micélio e cristal (sem flauta)
- Serve como crossfade do hub para a zona selecionada
- Duração: suficiente para cobrir tempo de navegação (~30–45s de loop)

### 2.4 As 11 Zonas — Identidade Sonora Individual

Cada zona tem uma identidade musical definida por três eixos:
**posição no eixo orgânico/máquina**, **mecânica de tensão**, e **referência
clássica que inspira a zona**.

#### Grupos por natureza mecânica

**Grupo A — Zonas de Ação/Horda (tensão sustentada alta):**

| Zona | Identidade musical | Instrumento principal | Arquivo de loop |
|---|---|---|---|
| Hordas | Orgânico guerreiro. Percussão de barril intensa, cello em tremolo, esporos ritmicamente. Modo Dórico acelerado (140 BPM). | Percussão de corpo + cello | `mus_zone_hordas_battle_loop.ogg` |
| Campo de Controle | Orgânico tático. Mais espaçado que Hordas. Tensão vem do silêncio entre as batidas. 110 BPM, Mixolídio. | Madeira (flauta) + percussão | `mus_zone_campo_control_loop.ogg` |
| Sacrifício | Orgânico urgente. Tempo acelera adaptativamente com o timer (ver 2.5). 120→160 BPM. Percussão dominante. | Percussão de corpo | `mus_zone_sacrifice_urgent_loop.ogg` |

**Grupo B — Zonas de Infiltração (tensão latente, silêncio é poder):**

| Zona | Identidade musical | Instrumento principal | Arquivo de loop |
|---|---|---|---|
| Stealth | IA invadindo orgânico. Música mínima — só drone grave e click de clock suave. O som do personagem parado é quase o único áudio. Quando alerta sobe, Estágios 1→2 da invasão (ver 1.3). | Drone de IA + silêncio | `mus_zone_stealth_tense_loop.ogg` |
| Labirinto | Orgânico contemplativo. Puzzle slow-burn. Flauta solo + água + silêncio longo. 80 BPM. O Motivo do Foguete aparece quando um fragmento é empurrado corretamente (stinger). | Flauta solo | `mus_zone_maze_puzzle_loop.ogg` |

**Grupo C — Zonas de Máquina pura (IA domina o espaço):**

| Zona | Identidade musical | Instrumento principal | Arquivo de loop |
|---|---|---|---|
| Circuito Quebrado | Eletricidade. Síntese pura: arpejo de onda quadrada seguindo sequência do circuito. Cada segmento completado acende um novo tom no arpejo. A música é literalmente o progresso do puzzle. | Síntese quadrada | `mus_zone_circuit_electric_loop.ogg` |
| Extração | Industrial. Batida mecânica pesada, metal processado. Zona vertical de corrida: BPM alto (150), pulso de clock proeminente. Tensão sustentada sem pico — é sempre urgente. | Metal processado + clock | `mus_zone_extraction_drive_loop.ogg` |
| Infecção | Ambíguo orgânico-IA. O jogador é o vírus — nem humano nem máquina. Música híbrida: base de clock de IA (80 BPM) com melodia de water glass (orgânico) flutuando por cima. Quando nós são infectados, novos tons são adicionados à melodia. | Glass harmonica + clock | `mus_zone_infeccao_spread_loop.ogg` |

**Grupo D — Zonas de Superfície (abertura, escala, perigo externo):**

| Zona | Identidade musical | Instrumento principal | Arquivo de loop |
|---|---|---|---|
| Cordilheira | Vento e altitude. Orgânico hostil: cordas em tremolo muito lento, vento processado como melodia. Frogger-like: tensão de ritmo sincopado. | Cordas em tremolo + vento | `mus_zone_cordilheira_wind_loop.ogg` |
| Torres | Gravidade e metal. Donkey Kong-like: música mais mecânica que as outras, mas com o Motivo do Foguete em contraponto como lembrança do objetivo. BPM 130, onda quadrada + percussão. | Sintetizador + percussão | `mus_zone_torres_climb_loop.ogg` |
| Catedral | Sagrado e geométrico. Q*bert-like: isométrico, resoluto. Cordas em pizzicato seguindo padrão de plataformas acesas. Cada plataforma acesa adiciona uma nota à harmonia. | Pizzicato de corda | `mus_zone_catedral_sacred_loop.ogg` |

### 2.5 Música Adaptativa — Regras de Comportamento

**Regra de tempo adaptativo (Zona Sacrifício):**
O BPM da música sobe 5 BPM a cada 15s de corrida cronometrada, de 120 até 160 BPM
máximo. Implementação: preparar 3 loops em tempos diferentes (120, 140, 160) e
fazer crossfade de 2s entre eles conforme timer avança. Arquivos:
`mus_zone_sacrifice_120_loop.ogg`, `mus_zone_sacrifice_140_loop.ogg`,
`mus_zone_sacrifice_160_loop.ogg`.

**Regra de camadas aditivas (Circuito, Infecção, Catedral):**
Música começa esparsa (1–2 vozes). Cada evento de progresso (segmento de circuito
completado, nó infectado, plataforma acesa) adiciona uma camada de áudio.
Implementação: loops com mesma duração e BPM em sincronização, cada um silencioso
por padrão, volume subindo ao trigger. Max 4 camadas simultâneas.

**Regra de invasão sonora (Stealth, zonas de IA):**
Descrita na seção 1.3. Implementação via dois parâmetros expostos ao AudioManager:
`invasionLevel` (0.0–1.0) e `alertLevel` (0.0–1.0). O GameScene atualiza esses
parâmetros a cada frame relevante. O AudioManager aplica:
- LPF cutoff = lerp(20000, 600, invasionLevel)
- Drone volume = lerp(-60, -6, invasionLevel) dB
- Clock BPM = lerp(0, 180, alertLevel)

**Regra de transição entre zonas:**
Saída de zona → fadeout de 1.5s da música da zona → stinger de resultado (vitória
ou falha, 2–3s) → crossfade de 2s para música do hub. Nunca corte seco entre
músicas narrativamente distintas.

### 2.6 Lançamento do Foguete — O Clímax Sonoro

O lançamento é o fim do jogo. É o único momento onde todas as camadas coexistem.

**Estrutura em 5 partes:**

1. **Contagem (30s antes do lançamento):**
   Música do hub continua mas cresce lentamente em volume e densidade.
   Percussão de corpo entra em crescendo.

2. **Ignição (evento de lançamento confirmado):**
   Stinger de 8s: O Motivo do Foguete em sua forma plena e orquestrada
   (cordas, flauta, percussão, vozes). Arquivo:
   `mus_hub_launch_ignition_stinger.ogg`

3. **Ascensão (foguete subindo na tela):**
   Loop de 60s com música climática. BPM 120, Mixolídio. Todas as camadas
   orgânicas presentes. Sobre as cordas, flauta e percussão, os temas de todas
   as zonas são citados brevemente em fragmentos de 4 compassos cada — uma
   retrospectiva musical da jornada. Arquivo: `mus_hub_launch_ascent_loop.ogg`

4. **Ponto de silêncio (foguete sai da tela):**
   2s de silêncio absoluto. Nenhum efeito sonoro. Nenhuma música. Só o jogador.

5. **Chegada (tela final):**
   Retorno do Motivo do Foguete, só flauta e respiração humana. Íntimo e pequeno
   depois do clímax. O absurdo otimista resolvido.
   Arquivo: `mus_hub_launch_arrival_loop.ogg`

---

## 3. Áudio de Feedback de Movimento — O Som como Interface

### 3.1 A restrição como design de áudio

Com input único (mover), o áudio carrega mais peso do que em qualquer jogo com
botões. Cada tipo de informação que em outros jogos seria confirmada por um botão
precisa aqui ser comunicada pelo som do movimento e de seus efeitos colaterais.
O áudio é a camada de legibilidade do estado de jogo.

### 3.2 O Som do Próprio Movimento

O movimento do personagem tem três camadas sonoras simultâneas:

**Camada 1 — Textura de superfície (diegético):**
O som dos passos muda conforme o ambiente da zona. Esta é informação de contexto
espacial.

| Contexto | Som dos passos | Arquivo |
|---|---|---|
| Hub / bunker | Madeira ressonante, lenta | `sfx_movement_footstep_wood_01.ogg` |
| Zona orgânica (grama, terra) | Folhas secas, crunch suave | `sfx_movement_footstep_organic_01.ogg` |
| Zona de IA (concreto, metal) | Metal fino, echo curto | `sfx_movement_footstep_metal_01.ogg` |
| Stealth — lento | Quase inaudível: fricção suave | `sfx_movement_footstep_silent_01.ogg` |
| Stealth — rápido | Passos amplos + ruído de vento | `sfx_movement_footstep_loud_01.ogg` |

**Camada 2 — Velocidade como instrumento (feedback de estado):**
Na Zona Stealth, a velocidade determina o raio sonoro e o perigo. O jogador
precisa sentir isso pelo áudio mesmo sem olhar para o indicador visual.

- Velocidade baixa (< 30% do máximo): drone suave de ar, quase imperceptível.
  Volume: -24 dB relativo à música.
- Velocidade média (30–70%): toque suave de folha, 1 vez por segundo.
- Velocidade alta (> 70%): fricção de ar audível, crescente. Um componente de
  ruído branco a -12 dB que sobe linearmente com a velocidade.

Esta camada é exclusiva da Stealth. Nas outras zonas, velocidade não é informação
de risco — sem feedback adicional de velocidade.

**Camada 3 — Proximidade de inimigo (diegético):**
O raio de detecção sonora da Stealth é representado pelo timbre dos passos do
inimigo ficando audível. Quanto mais próximo o inimigo, mais alto e mais nítido
o som mecânico de seus movimentos.

| Distância do inimigo | O que o jogador ouve |
|---|---|
| > 300px | Nada |
| 200–300px | Hum mecânico suavíssimo, -30 dB |
| 100–200px | Click rítmico de servo motor, -18 dB |
| < 100px | Pulso de clock audível, -8 dB + filtro stéreo levemente fora do centro |

### 3.3 Feedback de Coleta e Recompensa

**Princípio:** O som de coleta é a recompensa mais frequente do jogo. Precisa ser
satisfatório sem ser irritante nas primeiras 50 vezes que o jogador ouve.
Variação de 4 variantes aleatórias por tipo de recurso.

| Evento | Som | Características |
|---|---|---|
| Coleta de recurso orgânico | Clique úmido + harmônico ascendente curto (2 notas do Motivo do Foguete) | Orgânico, satisfatório, ~0.4s |
| Coleta de componente de IA | Click seco + tom descendente sintético (IA capturada) | Frio mas satisfatório, ~0.3s |
| Coleta de recurso raro | Stinger de 3 notas cheias + partícula sonora | Distintivo, não pode ser confundido com coleta comum |
| Slot de mochila cheio | Tom de aviso orgânico — nota de madeira batida seca | Urgente mas não agressivo |

Arquivos:
- `sfx_gameplay_collect_organic_0[1-4].ogg`
- `sfx_gameplay_collect_ai_0[1-4].ogg`
- `sfx_gameplay_collect_rare_01.ogg`
- `sfx_gameplay_backpack_full_01.ogg`

### 3.4 Feedback de Risco e Perigo

**Princípio:** Risco crescente precisa ser sentido antes de ser visto. Hierarquia
de urgência clara: aviso < alerta < morte. Nunca usar o mesmo timbre para eventos
de urgência diferente.

| Evento | Som | Urgência |
|---|---|---|
| Primeiro inimigo no campo | Sem som específico — a música muda (Estágio 1) | Baixa (ambiental) |
| Barra de alerta a 50% | Click de clock suave, isolado, 1 vez | Média |
| Barra de alerta a 80% | Série de 3 clicks acelerados + filtro na música | Alta |
| Detecção completa / alerta total | Burst de ruído sintético (0.3s) + sirene descendente (1s) | Crítica |
| Hit / dano recebido | Impacto orgânico (batida de barril) + tom de dor curto | Alta |
| Morte / falha na run | Silêncio 0.3s → burst sintético → silêncio → tema de falha (2s) | Terminal |

Arquivos:
- `sfx_gameplay_alert_mid_01.ogg`
- `sfx_gameplay_alert_high_01.ogg`
- `sfx_gameplay_alert_full_01.ogg`
- `sfx_gameplay_hit_01.ogg` → `sfx_gameplay_hit_04.ogg` (4 variantes)
- `sfx_gameplay_death_01.ogg`

### 3.5 Feedback de Combate Automático (Zona Hordas e afins)

O combate é automático — o jogador não ativa ataques. O áudio precisa confirmar
que o sistema está funcionando sem exigir atenção auditiva constante.

**Regra de mix de combate:**
- Sons de ataque do squad: volume a 70% dos SFX. Nunca devem abafar a música.
- Sons de dano em inimigos: volume a 80%. Devem ser distintos dos ataques.
- Sons de morte de inimigo: leve variação de tom por tipo de inimigo. Confirmação
  clara mas não comemorativa (combate automático = confirmação de estado, não
  conquista do jogador).
- Sons de chegada de onda: distintivo, não pode ser mascarado. Prioridade alta.

| Evento de combate | Som | Variantes | Arquivo base |
|---|---|---|---|
| Ataque do squad (melee) | Impacto orgânico suave | 4 | `sfx_combat_squad_hit_0[1-4].ogg` |
| Morte de inimigo padrão | Decomposição sintética curta | 3 | `sfx_combat_enemy_death_0[1-3].ogg` |
| Morte de boss | Burst longo + silêncio + stinger orgânico | 1 | `sfx_combat_boss_death_01.ogg` |
| Nova onda de inimigos | Tom de alarme orgânico distinto | 2 | `sfx_combat_wave_spawn_0[1-2].ogg` |
| Resgate de humano | Som de voz humana (alívio) + ting de cristal | 1 | `sfx_gameplay_rescue_01.ogg` |

### 3.6 Feedback de UI

UI é o único contexto onde perfeição técnica importa mais que caráter orgânico —
o jogador precisa de confirmação inequívoca de ação de interface.

| Evento | Som | Arquivo |
|---|---|---|
| Toque em botão | Click de madeira, seco, ~0.1s | `sfx_ui_button_click_01.ogg` |
| Confirmação / seleção | Dois clicks de madeira ascendentes | `sfx_ui_confirm_01.ogg` |
| Cancelar / voltar | Click de madeira descendente | `sfx_ui_cancel_01.ogg` |
| Completar / sucesso | Três notas do Motivo do Foguete | `sfx_ui_complete_01.ogg` |
| Erro / bloqueado | Tom orgânico oco, fechado | `sfx_ui_error_01.ogg` |
| Abertura de modal | Slide suave de madeira | `sfx_ui_modal_open_01.ogg` |

**Substituição imediata dos WAVs existentes:**
Conforme o task de transcode, os seguintes arquivos WAV listados no código
precisam ser substituídos por OGGs com os nomes desta direção ou remapeados:
- `Click_03.wav` → `sfx_ui_button_click_01.ogg`
- `Click_01.wav` → `sfx_ui_button_click_01.ogg`
- `Click_02.wav` → `sfx_ui_button_click_01.ogg` (variante 02 se diferenciação necessária)
- `Confirm_01.wav`, `Confirm_03.wav`, `Confirm_05.wav` → `sfx_ui_confirm_01.ogg`
- `Complete_01.wav` → `sfx_ui_complete_01.ogg`
- `menu.wav` → `mus_hub_base_calm_loop.ogg`
- `battle.wav` → `mus_zone_hordas_battle_loop.ogg`
- `dungeon_theme_1.wav` → `mus_zone_sacrifice_urgent_loop.ogg`

---

## 4. Estratégia Técnica de Implementação em PWA

### 4.1 Formato único de entrega

**OGG Vorbis** em todo o projeto. Sem exceção. Sem MP3, sem WAV em produção.
Compatibilidade de OGG em browsers modernos: 97%+ (2026). O único caso de
incompatibilidade seria Safari pré-2019 — fora do target.

Alinhamento com o pipeline existente:
- Música → OGG, libvorbis quality 4 (~80 kbps stereo VBR) — conforme `transcode-audio.sh`
- SFX → OGG, libvorbis quality 3 (~64 kbps mono VBR) — conforme `transcode-audio.sh`
- Para SFX de UI (click, confirm): quality 2 (~48 kbps mono VBR) é suficiente.
  São sons de < 0.5s onde a diferença de qualidade é imperceptível.

### 4.2 Budget de tamanho

**Restrição hard:** Cloudflare Pages limita arquivos individuais a 25 MB.
**Restrição soft:** PWA service worker com LRU cap de 40 entradas de áudio.
**Alvo total:** < 18 MB de áudio em produção (deixa margem de segurança).

| Categoria | Quantidade | Duração média | Tamanho estimado (OGG q4) |
|---|---|---|---|
| Música — hub e mapa | 4 arquivos | 60s | ~2.4 MB |
| Música — 11 zonas | 11 loops base + 3 variantes Sacrifício = 14 | 60–90s | ~8.4 MB |
| Música — lançamento | 4 arquivos | 30–60s | ~1.8 MB |
| SFX — gameplay | ~25 arquivos (com variantes) | 0.3–1.5s | ~1.2 MB |
| SFX — combate | ~12 arquivos (com variantes) | 0.3–2.0s | ~0.6 MB |
| SFX — UI | 6 arquivos | 0.1–0.5s | ~0.2 MB |
| Ambientes (drip, vento) | 5 loops | 30s | ~1.2 MB |
| **Total estimado** | **~66 arquivos** | — | **~15.8 MB** |

Todos os arquivos individuais ficam abaixo de 1 MB (loops de 90s a 80kbps = ~900 KB).
Nenhum arquivo ultrapassa o limite de 25 MB do Cloudflare.

### 4.3 Latência mobile — Estratégia de preload

**O problema:** Mobile browsers têm latência de decodificação de áudio que pode
chegar a 200–400ms no primeiro play. Em jogos baseados em posicionamento, SFX de
feedback (hit, coleta) com 300ms de atraso percebido destroem o feel.

**Estratégia em três camadas:**

**Camada 1 — Preload de SFX críticos no BootScene:**
Os SFX de feedback imediato (click UI, hit, collect) são carregados como
`HTMLAudioElement` no boot, antes do menu aparecer. O `AudioManager` existente
já usa cache de templates + `cloneNode()` — esse padrão está correto para SFX.
Lista de preload obrigatório:
- Todos os `sfx_ui_*`
- `sfx_gameplay_collect_organic_01.ogg`
- `sfx_gameplay_collect_ai_01.ogg`
- `sfx_gameplay_hit_01.ogg`
- `sfx_gameplay_death_01.ogg`
- `sfx_gameplay_alert_full_01.ogg`

**Camada 2 — WebAudio para SFX de latência crítica:**
O `sfxSynth` existente já usa WebAudio. Para SFX onde a latência de file I/O
é inaceitável (hit frames, coleta de recurso), usar síntese procedural como
fallback e como primeira opção em condições de rede lenta. O AudioManager já tem
o sistema de missingSfx → sfxSynth — aproveitar esse fallback como feature, não
só como contingência.

**Camada 3 — Lazy load de música por zona:**
Música de zona só é carregada quando o jogador confirma entrada na zona (não na
abertura do mapa-mundo). O fade-in de 1.5s da música cobre o tempo de fetch.
Não pré-carregar todas as 11 músicas de zona — o budget do service worker não
suporta.

**Ordem de carregamento:**
```
Boot → SFX críticos (obrigatório)
     → Música do hub (obrigatório, antes do hub aparecer)
     → SFX de combate (lazy, em background após hub carregar)
     → Música de zona (lazy, ao confirmar entrada)
     → Variantes de SFX (lazy, durante zona)
```

### 4.4 Canais simultâneos e ducking

**Limite de canais simultâneos:** 8 fontes de áudio simultâneas (HTMLAudioElement
+ WebAudio GainNodes). Mobile browsers degradam acima de 16 fontes; 8 é o alvo
seguro para mid-range Android.

**Hierarquia de prioridade (maior = nunca ducked):**

```
Prioridade 5 — Música (1 canal, sempre presente)
Prioridade 4 — SFX de morte/falha (preempt tudo exceto música)
Prioridade 3 — SFX de alerta e detecção
Prioridade 2 — SFX de coleta e combate (múltiplos simultâneos, max 3)
Prioridade 1 — SFX de UI (fila, nunca simultâneo com outro UI)
Prioridade 0 — Ambiente (sempre ducked quando qualquer P2+ está ativo)
```

**Regras de ducking:**
- Quando SFX P3+ toca: música duca -6 dB em 100ms, retorna em 500ms.
- Quando morte toca (P4): música duca -18 dB em 50ms. Sem retorno automático —
  aguarda transição de cena.
- SFX de combate (P2) em rajada: limitar a 3 simultâneos. Quarto SFX do mesmo
  tipo descartado (não enfileirado). Evita explosão de canais em zona Hordas.
- Ambiente: só toca se menos de 4 canais P2+ ativos.

**Implementação no AudioManager:**
O `AudioManager` atual gerencia 1 canal de música e SFX via `cloneNode`. Para
suportar essa hierarquia, adicionar:
- `playSfxWithPriority(path, priority, volume)` — verifica canais ativos antes
  de criar clone.
- `activeSfxCount: Map<number, number>` — conta por prioridade.
- `ambientChannel: Channel | null` — canal separado para ambiente, com ducking
  automático.

Isso é delegação ao `lead-programmer` para implementação; esta direção define o
contrato, não o código.

### 4.5 Loudness targets (LUFS)

| Categoria | Target integrado | True Peak | Justificativa |
|---|---|---|---|
| Música | -18 LUFS | -1 dBTP | Mobile speaker sem headphone não aguenta mais |
| SFX de gameplay | -14 LUFS | -1 dBTP | Precisa cortar sobre música sem distorção |
| SFX de UI | -16 LUFS | -2 dBTP | Confirmação clara, não agressiva |
| SFX de morte/alerta | -12 LUFS | -1 dBTP | Urgência, precisa ser audível em ambiente ruidoso |
| Ambiente | -24 LUFS | -3 dBTP | Textura de fundo, nunca dominante |

Referência de calibração: os loops de música devem soar equilibrados com a
aplicação de vídeo padrão do Android em volume 60%. Testar em Pixel 7 ou equivalente.

### 4.6 Naming convention aplicada ao projeto

Conforme a convenção definida no sistema:
`[categoria]_[contexto]_[nome]_[variante].[ext]`

Estrutura de diretórios em `frontend/public/assets/audio/`:

```
audio/
  music/
    mus_hub_base_calm_loop.ogg
    mus_hub_rocket_upgrade_stinger.ogg
    mus_hub_launch_ignition_stinger.ogg
    mus_hub_launch_ascent_loop.ogg
    mus_hub_launch_arrival_loop.ogg
    mus_world_overview_loop.ogg
    zones/
      mus_zone_hordas_battle_loop.ogg
      mus_zone_campo_control_loop.ogg
      mus_zone_sacrifice_120_loop.ogg
      mus_zone_sacrifice_140_loop.ogg
      mus_zone_sacrifice_160_loop.ogg
      mus_zone_stealth_tense_loop.ogg
      mus_zone_circuit_electric_loop.ogg
      mus_zone_extraction_drive_loop.ogg
      mus_zone_infeccao_spread_loop.ogg
      mus_zone_maze_puzzle_loop.ogg
      mus_zone_cordilheira_wind_loop.ogg
      mus_zone_torres_climb_loop.ogg
      mus_zone_catedral_sacred_loop.ogg
  sfx/
    ui/
      sfx_ui_button_click_01.ogg
      sfx_ui_confirm_01.ogg
      sfx_ui_cancel_01.ogg
      sfx_ui_complete_01.ogg
      sfx_ui_error_01.ogg
      sfx_ui_modal_open_01.ogg
    gameplay/
      sfx_gameplay_collect_organic_01.ogg  (→ 04)
      sfx_gameplay_collect_ai_01.ogg       (→ 04)
      sfx_gameplay_collect_rare_01.ogg
      sfx_gameplay_backpack_full_01.ogg
      sfx_gameplay_rescue_01.ogg
      sfx_gameplay_alert_mid_01.ogg
      sfx_gameplay_alert_high_01.ogg
      sfx_gameplay_alert_full_01.ogg
      sfx_gameplay_hit_01.ogg              (→ 04)
      sfx_gameplay_death_01.ogg
    combat/
      sfx_combat_squad_hit_01.ogg          (→ 04)
      sfx_combat_enemy_death_01.ogg        (→ 03)
      sfx_combat_boss_death_01.ogg
      sfx_combat_wave_spawn_01.ogg         (→ 02)
    movement/
      sfx_movement_footstep_wood_01.ogg    (→ 02)
      sfx_movement_footstep_organic_01.ogg (→ 04)
      sfx_movement_footstep_metal_01.ogg   (→ 02)
      sfx_movement_footstep_silent_01.ogg
      sfx_movement_footstep_loud_01.ogg
  amb/
    amb_env_hub_mycelium_loop.ogg
    amb_env_zone_wind_loop.ogg
    amb_env_zone_machine_hum_loop.ogg
    amb_env_zone_electric_loop.ogg
    amb_env_cave_drip_loop.ogg
```

---

## 5. Delegações e Próximos Passos

### Para o sound-designer (quando contratado):

Prioridade de produção alinhada com milestones do MASTERPLAN:

1. **M0 (agora):** SFX de UI (6 arquivos) via síntese WebAudio. Substituir WAVs
   existentes conforme mapeamento da seção 3.6.
2. **M2 (Hordas):** `mus_zone_hordas_battle_loop.ogg` + SFX de combate (squad
   hit, enemy death, wave spawn) + `sfx_gameplay_hit_01-04.ogg` +
   `sfx_gameplay_death_01.ogg`.
3. **M3 (Campo + Sacrifício):** Músicas das 2 zonas + variantes de Sacrifício.
4. **M4-M5 (Zonas novas):** Músicas das 8 zonas restantes + SFX de coleta e
   movimento por zona.
5. **M6 (Áudio completo):** Hub upgrade stinger, lançamento em 5 partes, ambiente
   completo.

### Para o lead-programmer:

- Implementar `playSfxWithPriority()` e `activeSfxCount` no `AudioManager`.
- Expor parâmetros `invasionLevel` e `alertLevel` que o `AudioManager` consuma
  para o sistema de invasão sonora (seção 1.3).
- Implementar ducking de música (-6 dB) ao receber SFX P3+.
- Sistema de camadas aditivas para Circuito, Infecção, Catedral: loop base + até
  4 gain nodes simultaneamente sincronizados.

### Decisão reservada para creative-director (Leticia):

- Aprovação do Motivo do Foguete (4 notas: Mi-Sol-La-Re) — pode ser ajustado
  antes de qualquer implementação musical real.
- Aprovação do tom de síntese vs. instrumentos gravados para a versão M6:
  síntese procedural como estilo final (lo-fi intencional) ou placeholder para
  trilha comissionada.

---

*Relacionado: `design/MASTERPLAN.md`, `production/task-audio-transcode.md`,
`frontend/src/core/AudioManager.ts`*
