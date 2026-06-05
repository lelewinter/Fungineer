---
tags: [fungineer, art-direction, audit]
date: 2026-06-05
tipo: art-direction
status: Referência de Produção
---

# Fungineer — Auditoria de Consistência Visual

**Data**: 2026-06-05
**Autor**: Art Director
**Premissa fundamental**: O norte de arte é o sprite do Dr. Myco / bunker (pixel art,
fungal, escuro, cogumelos vibrantes, luz de lanterna). Tudo que existe hoje é placeholder
procedural. Esta auditoria governa o que o jogo FINAL deve respeitar — e onde os accents
por zona podem ameaçar essa identidade.

---

## 1. Diagnóstico: as 11 zonas leem como UM jogo?

### 1.1 O problema estrutural

O design atual define accents por zona sem estabelecer uma camada base compartilhada
obrigatória. Resultado: cada zona tem uma identidade cromática legítima para ela
mesma, mas o conjunto de 11 zonas pode ler como 11 jogos diferentes. Isso é o
risco central de identidade visual do projeto (ver seção 4).

A tabela abaixo mostra os accents cadastrados em `frontend/src/state/Zones.ts` e
o diagnóstico de tensão com o mood fungal escuro:

| Zona | Accent hex (aprox) | Tom | Tensão com o mood |
|---|---|---|---|
| Hordas | #61D178 verde-vibrante | Bioluminescente | BAIXA — verde fungo é canônico |
| Stealth | #00AA44 verde-neon frio | Digital/IA | MEDIA — neon frio sem calor de lanterna |
| Circuito | #00CEDD ciano elétrico | Tecnológico | ALTA — cor mais fria, mais "tela" |
| Extração | #CC6600 laranja industrial | Industrial | BAIXA — laranja é a cor de lanterna base |
| Campo | #1A6FCC azul corporativo | Neutro/IA | ALTA — azul saturado sem base quente |
| Infecção | #228B22 verde-floresta | Orgânico | BAIXA — verde fungal canônico |
| Labirinto | #4A90A4 aço-azulado | Industrial frio | MEDIA — aço tem presença no bunker mas falta calor |
| Sacrifício | #7B2FBE roxo esporo | Fungal/ritual | BAIXA — roxo esporo está na paleta canônica |
| Cordilheira | #6B6159 terra/cinza | Humano decaído | BAIXA — tom de ruína é coerente |
| Torres | #2E4D85 azul-noite | Corporativo alto | MEDIA — azul muito limpo, sem textura fungal |
| Catedral | #C7AD6B dourado-âmbar | Sacro/quente | BAIXA — quente, mas sem elemento orgânico |

**Zonas de alto risco de fragmentação**: Circuito e Campo têm accents que,
aplicados a 100% nos assets, vão ler como jogos diferentes. Azul corporativo
puro e ciano elétrico puro não têm âncora no vocabulário fungal.

---

### 1.2 A regra: Paleta Base Compartilhada + Accent Restrito por Zona

Todo asset de qualquer zona deve respeitar esta hierarquia:

```
CAMADA 1 — CONSTANTE (80% da área visual de qualquer asset)
Paleta de base fungal escura — obrigatória em todas as 11 zonas

CAMADA 2 — ZONA (15% da área visual)
Accent da zona — aplicado em pontos focais, elementos interativos,
iluminação ambiente, UI desta zona

CAMADA 3 — ESTADO (5% da área visual)
Cor de estado funcional (dano, coleta, alerta) — sistema compartilhado,
não pertence à identidade da zona
```

#### Paleta Base Compartilhada (obrigatória, todas as zonas)

| Papel | Hex | Uso |
|---|---|---|
| Fundo primário | #1A1008 | Espaço mais escuro: paredes, chão sem iluminação |
| Fundo secundário | #2A1F14 | Superfícies de background, concreto/terra |
| Midtone quente | #3D2B1F | Estruturas, mobiliário, objetos neutros |
| Lanterna âmbar | #E8943A | Fonte de luz primária diegética em TODA zona |
| Musgo/sombra orgânica | #2D3B1E | Superfícies com crescimento, cantos orgânicos |
| Pixel escuro de detalhe | #0D0806 | Outline de pixel art, máximo contraste |

**Regra do âmbar de lanterna**: toda cena de zona deve ter pelo menos UMA
fonte de luz visível no tom #E8943A ou adjacente (range #D4831E a #F5A449).
Isso é o que ancora qualquer cena — por mais fria que seja a zona — no
universo do Dr. Myco. Pode ser uma lanterna no canto, chamas em distância,
bioluminescência quente de cogumelo. Nunca ausente.

#### Accent por Zona: proporção e aplicação correta

O accent de uma zona entra SOMENTE em:
- Elementos interativos (zonas de captura, fios, nós de infecção, etc.)
- Iluminação de efeito (glow, bioluminescência, neon de IA)
- UI diegética desta zona (cones de visão, timers visuais)
- Bordas e indicadores de HUD desta zona

O accent NUNCA entra em:
- Fundo/chão (a não ser como reflexo sutil — máximo 20% opacity)
- Estruturas arquitectónicas (paredes, teto, pilares)
- Personagens (exceto efeito de estado passageiro)
- Outlines de pixel art (sempre #0D0806 ou #1A1008)

#### Ajuste de accents para coesão (proposta)

Para as zonas de alta tensão, o accent não muda de cor — mas deve ganhar uma
versão "contaminada" com 15% de marrom-âmbar misturado:

| Zona | Accent atual | Accent fungal-ajustado |
|---|---|---|
| Circuito | #00CEDD | Usar em áreas funcionais (fios ativos). Adicionar glow amarelado #E8943A nos fios ao ativar — o circuito "aquece" ao ser conduzido |
| Campo | #1A6FCC | Zonas capturadas ganham anel azul, mas a área interna da zona tem bioluminescência musgo #6BCB77 misturada — a captura é biológica, não digital |
| Torres | #2E4D85 | Aplicar somente em reflexos de janela e luzes de drone. Fundo do topo das torres deve ter névoa escura #1A1008, não céu azul limpo |

---

## 2. Especificação de Asset Placeholder → Final

### 2.1 Grid e resolução

**Resolução base de referência (tela mobile pequena)**:
- Canvas lógico: 480 × 854 px (portrait, 16:9 invertido)
- Escala de pixel art: 1 pixel de arte = 2px na tela (escala 2×)
- Grid canônico de pixel: **4px** (menor detalhe legível = 4×4px lógico, 8×8px na tela)

**Por que 4px como menor unidade**: em tela de 360px de largura física
(dispositivo pequeno comum), a escala 2× coloca o pixel de arte a ~1.5mm
de tamanho físico — mínimo de legibilidade para detalhes fungais (pontilhados
de esporo, bordas de cogumelo).

### 2.2 Categorias de asset e especificações

#### Personagens (char)

| Parâmetro | Spec |
|---|---|
| Altura Dr. Myco | 32px de arte (64px na tela em escala 2×) |
| Altura inimigos pequenos | 16px de arte (32px na tela) |
| Altura inimigos médios | 24px de arte (48px na tela) |
| Altura boss | 48px de arte (96px na tela) |
| Canvas de sprite | múltiplo de 16px (para alignment no grid) |
| Formato | PNG com alpha, sem anti-aliasing |
| Perfil de cor | sRGB |
| Paleta máxima | 16 cores por sprite (excluindo transparente) |
| Outlines | 1px de arte, cor #0D0806 obrigatória |
| Cores de identificação | 1 cor-âncora única por personagem (imutável entre zonas) |

**Convenção de nomeação**:
`char_[nome]_[estado]_[frame].png`
Exemplos:
- `char_drmyco_idle_01.png`
- `char_drmyco_walk_02.png`
- `char_enemy_runner_death_01.png`

#### Inimigos (enemy)

Mesmo grid que personagens. Silhueta deve ser única e legível como
thumbnail de 32×32px.

`enemy_[zona]_[tipo]_[estado]_[frame].png`
- `enemy_hordas_runner_idle_01.png`
- `enemy_stealth_drone_patrol_01.png`

#### Backgrounds de zona (env)

| Parâmetro | Spec |
|---|---|
| Resolução | 480 × 854px (portrait completo) |
| Pixel art em escala | 240 × 427px de arte (upscale 2× no engine) |
| Formato | PNG, sem compressão lossy |
| Camadas separadas | bg_far, bg_mid, fg_near (3 arquivos por cena) |
| Paleta | Base compartilhada + máximo 4 cores de accent |
| Grain/textura | aplicado em pós-processamento (shader CRT existente), NÃO baked no asset |

`env_[zona]_[camada]_[variante].png`
- `env_hordas_bg_far_01.png`
- `env_hub_bg_mid_foguete_01.png`
- `env_stealth_fg_near_01.png`

#### UI e HUD (ui)

| Parâmetro | Spec |
|---|---|
| Botões (estado normal) | 96 × 40px na tela (48 × 20px de arte) |
| Ícones de recurso | 32 × 32px na tela (16 × 16px de arte) |
| Barras de HP/progresso | 128px de comprimento na tela (64px de arte) |
| Formato | PNG com alpha |
| Paleta de UI | Apenas da paleta base (sem accent de zona, exceto indicadores de zona) |

`ui_[categoria]_[nome]_[estado].png`
- `ui_btn_primary_default.png`
- `ui_icon_resource_biomassa.png`
- `ui_bar_hp_fill.png`
- `ui_zone_hordas_indicator.png`

#### VFX e partículas (vfx)

| Parâmetro | Spec |
|---|---|
| Spritesheet de partícula | 8 × 8px por frame de arte |
| Frames por animação | 4 a 8 frames |
| Formato | PNG spritesheet horizontal |
| Espaçamento entre frames | 0px (packed tight) |

`vfx_[tipo]_[variante]_[tamanho].png`
- `vfx_spore_float_small.png`
- `vfx_spark_hit_medium.png`
- `vfx_mushroom_glow_pulse.png`

#### Assets de hub (hub)

Salas do hub seguem o mesmo grid de background de zona.
As salas têm proporção 3:2 (480 × 320px na tela = 240 × 160px de arte).
A Baia do Foguete é exceção: 480 × 640px (dois andares).

`hub_[sala]_[camada]_[estado].png`
- `hub_rocket_bg_far_stage02.png` (estágio 2 de construção do foguete)
- `hub_hordas_entry_bg_mid.png`

### 2.3 Requisitos de legibilidade em tela mobile pequena

**Teste de silhueta**: todo sprite de personagem/inimigo deve ser legível
como silhueta pura (fill de preto sem detalhes internos) em 32px de altura
na tela. Se a silhueta não identifica o tipo de entidade, o design falhou.

**Regra do contraste mínimo**: elementos interativos devem ter contraste
mínimo de 4.5:1 contra o fundo imediato (WCAG AA — não por acessibilidade
formal, mas porque touch targets em mobile precisam ser encontrados em
menos de 300ms).

**Regra do polegar**: nenhum elemento interativo menor que 44 × 44px na tela
física (em unidades CSS / pontos de display). Assets de UI devem ser
dimensionados para esta hitbox mesmo que o gráfico visível seja menor.

**Anti-aliasing**: PROIBIDO em assets de pixel art. O upscale de 2× é
nearest-neighbor. Anti-aliasing quebra a leitura de pixel e parece
inconsistente com o norte Dr. Myco.

---

## 3. Checklist de Consistência Visual (por asset novo)

Todo asset novo — placeholder ou final — deve passar por este checklist
antes de ser integrado ao build.

### 3.1 Identidade fungal (obrigatório para todos)

- [ ] O asset usa pelo menos 2 cores da Paleta Base Compartilhada (seção 1.2)
- [ ] Há presença de textura orgânica OR elemento angular de pixel art que
      comunica "feito à mão / improvisado" (não é geometricamente perfeito)
- [ ] Se há fonte de luz, ela tem uma versão quente (#E8943A range) presente
      no mesmo asset ou na composição de cena em que será usado
- [ ] Nenhuma cor pura de saturação máxima aparece em área maior que 10%
      do asset (cores hipersaturadas sem mistura rompem o mood escuro)

### 3.2 Paleta e cor

- [ ] O accent de zona está presente em no máximo 15% da área do asset
- [ ] As cores de outline são #0D0806 ou #1A1008 (sem outline colorido,
      exceto em elementos de estado: dano, cura, alerta)
- [ ] A paleta completa do asset não excede 16 cores (excluindo transparência)
- [ ] Nenhuma cor de saturation > 90 (HSL) fora de elementos VFX
      intencionalmente brilhantes (bioluminescência, neon de IA)

### 3.3 Grid e resolução

- [ ] Todos os pixels se alinham ao grid de 4px (nenhum detalhe de 1 ou 2px
      isolado exceto contornos)
- [ ] O canvas é múltiplo de 16px em ambas as dimensões
- [ ] Não há anti-aliasing em nenhuma borda (verificar zoom 400% no editor)
- [ ] A escala de exportação é 1:1 de arte (o upscale 2× é feito pelo engine)

### 3.4 Legibilidade mobile

- [ ] A silhueta do asset é legível a 32px de altura em tela (personagens/inimigos)
- [ ] Elementos interativos têm área de toque mínima de 44 × 44px na tela
- [ ] O contraste entre elemento principal e fundo imediato é ≥ 4.5:1

### 3.5 Nomenclatura e pipeline

- [ ] Segue o padrão `[categoria]_[nome]_[variante]_[frame].[ext]`
- [ ] Está no diretório correto: `frontend/public/assets/`
- [ ] Formato é PNG (assets estáticos) ou PNG spritesheet (animações)
- [ ] Não excede 2MB por arquivo (limite prático de carregamento mobile)

### 3.6 Coesão com a zona (assets de zona específica)

- [ ] O asset foi comparado visualmente com pelo menos 1 asset existente
      da mesma zona (para verificar consistência de escala e paleta interna)
- [ ] O accent de zona aplicado é o valor canônico em `Zones.ts` e não uma
      variante inventada no momento
- [ ] O asset funcionaria (paleta e leitura) se o accent fosse removido?
      Se não, a dependência do accent é excessiva — redesenhar

---

## 4. Maior risco de identidade visual hoje

### Risco principal: fragmentação por accent sem base visual travada

**O que é**: O projeto tem 11 accents canônicos e uma paleta de base descrita
em texto (MASTERPLAN seção 2), mas não tem nenhum asset "âncora" do jogo final
implementado ainda. Tudo é placeholder procedural. Isso significa que o primeiro
asset de pixel art real que for integrado — seja o Dr. Myco, seja um background
de zona — vai ser o padrão visual de fato do jogo. Se esse asset não respeitar
exatamente a hierarquia base + accent, ele vai estabelecer um precedente errado
que todos os assets subsequentes vão tentar seguir.

**Por que é o maior risco agora**: durante M0-M3 (fase atual), o código produz
formas coloridas com os accents de zona aplicados em 100% da cor de fundo, porque
é mais fácil para o sistema procedural. Quando a pixel art real chegar (Track B/C),
vai haver pressão para "fazer combinar com o que já está na tela" — o que significa
fazer pixel art combinar com blocos de cor sólida. Isso inverte a hierarquia correta.

**Manifestação concreta hoje**: Zones.ts já tem accent colors que são usadas
em fundos e UI. Se esses accents forem aplicados sem a camada base, o Circuito
vai ser uma tela de ciano, o Campo vai ser azul corporativo, e o jogo vai ler
como UI kit, não como mundo fungal. Os accents foram desenhados para ser SOTAQUE,
não FUNDO.

**Solução preventiva (antes de qualquer pixel art final)**:

1. Criar um "asset de referência zero" — uma única cena de 480×854px com o
   bunker/Dr. Myco na paleta canônica completa, mesmo que seja importado ou
   comissionado antes de tudo mais. Esse asset é a pedra de toque. Todo asset
   novo é comparado CONTRA ELE, não contra outros placeholders.

2. Travar o fundo de todas as zonas em `#1A1008` agora, mesmo no procedural —
   o accent vai para as luzes e elementos interativos. Isso estabelece o hábito
   visual correto antes da pixel art chegar.

3. Quando Track B (CC0) e Track C (custom) chegarem, o primeiro asset a integrar
   deve ser o Dr. Myco ou o bunker — não um asset de zona periférica. O personagem
   principal define o padrão; as zonas seguem ele.

### Risco secundário: zones "surface" sem vocabulário fungal

As zonas de superfície (Cordilheira, Torres, Catedral) são externas e à luz do
dia ou à noite urbana. O vocabulário fungal do bunker (escuro, lanterna, musgo)
não aparece naturalmente nesses ambientes. Se tratadas como "cenários realistas"
ao invés de "mundo fungal visto de fora", vão quebrar a coesão. A regra do
âmbar de lanterna (seção 1.2) é especialmente importante nessas três zonas —
a lanterna do Dr. Myco carregada pelo squad é o elemento visual que ancora
o bunker nessas cenas. O sprite do squad deve ser visível com sua lanterna
em todas as zonas de superfície.

---

## Premissas documentadas desta auditoria

- "11 zonas" conforme README.md (fonte de verdade): Hordas, Campo, Sacrifício,
  Stealth, Circuito, Extração, Infecção, Labirinto, Cordilheira, Torres, Catedral.
  O MASTERPLAN lista 8 zonas em seção 3, mas o README lista 11 — o README foi
  tratado como mais atualizado.
- Os valores hex dos accents foram derivados de `frontend/src/state/Zones.ts`
  via conversão dos valores RGB normalizados ali definidos.
- A paleta base compartilhada foi sintetizada do MASTERPLAN seção 2 e do
  `design/art/hub-rooms-art-direction.md` seção "Paleta geral do bunker".
  Nenhum valor foi inventado — todos têm fonte no material existente.
- O grid de 4px é derivado da resolução de 480px de canvas e escala 2×,
  calculando o menor detalhe legível em tela mobile 360px de largura física.
- Onde o art-direction.md (Orbs) conflita com o MASTERPLAN (Fungineer),
  o MASTERPLAN é fonte de verdade — o art-direction.md parece ser documento
  de projeto anterior ou paralelo com nome diferente.

---

*Relacionado: `design/art-direction.md`, `design/MASTERPLAN.md`,
`frontend/src/state/Zones.ts`, `design/art/hub-rooms-art-direction.md`*
