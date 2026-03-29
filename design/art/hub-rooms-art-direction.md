---
tags: [fungineer, arte, art-direction]
date: 2026-03-22
tipo: art-direction
---

# Hub — Direção de Arte: Salas do Bunker
## Do Protótipo ao Jogo Finalizado

**Versão**: 1.0
**Data**: 2026-03-22
**Status**: Referência de Produção
**Autor**: Art Direction pass — baseado em `design/art-direction.md` + `design/gdd/hub-world-map.md`

---

## Princípios Gerais de Leitura Visual

Antes de entrar em cada sala individualmente, estes princípios se aplicam a **todas as salas**:

### 1. Estrutura Contínua do Bunker

O bunker é um organismo único, não uma coleção de cards. As paredes são de **concreto armado revestido com tijolos industriais**, com tubulações correndo horizontalmente entre as salas (visíveis no teto de cada cômodo). Os pilares entre salas têm espessura real — não são apenas bordas de UI, são estrutura. A espessura dos pilares no corte transversal é de aproximadamente **1/8 da largura de uma sala** — grossa o suficiente para ser física, fina o suficiente para não bloquear a visão.

**Linguagem de pilares por andar**:
- Andar 1 (mais raso): pilares de concreto com treliça metálica exposta — senso de urgência construtiva
- Andar 2 (câmara do foguete): arcos de pedra industrial adaptados — mais permanentes
- Andares 3-4 (profundos): paredes de tijolos com infiltração de umidade — mais orgânicos, mais vividos

### 2. Profundidade de Plano em Toda Sala

Cada sala deve ter **3 planos visuais legíveis**:

| Plano | Profundidade | O que vai lá | Movimento |
|-------|-------------|--------------|-----------|
| **Background** | ~60% do fundo | Paredes, pipes, janelas internas, murais | Quase estático — apenas efeitos de luz pulsando |
| **Midground** | Camada principal | Mobiliário principal, personagem, equipamentos centrais | NPCs animam aqui |
| **Foreground** | Borda frontal da sala | Objetos cortados na frente (caixas, equipamentos), sombras | Partículas de pó/fumaça flutuam aqui |

O foreground cria a ilusão de profundidade em 2D — **sempre incluir pelo menos 1 objeto cortado no canto frontal** de cada sala.

### 3. Iluminação como Assinatura

Cada sala tem **1 fonte de luz primária** (o que define a temperatura da sala) e **1-2 fontes secundárias** (preenchimento e rim light). A luz primária é diegética — você vê a lanterna, o monitor, o fogo. A sombra é dura mas não total (bunker = luz difusa de concreto reflectindo).

**Paleta geral do bunker** (nunca sair dessa):
- Paredes: `#2A1F14` (marrom-concreto muito escuro)
- Estrutura metálica: `#3D3028` (metal oxidado)
- Luz quente: `#E8943A` (lanterna/âmbar — salas habitadas)
- Luz fria: `#4A5A8C` (azul-índigo — salas tecnológicas)
- Luz de emergência: `#CC2200` (vermelho — salas de risco)

---

## 🚀 SALA CENTRAL: Baia do Foguete
**[Prioridade máxima — referência visual de todo o bunker]**

### Função no Jogo
Centro narrativo e visual do hub. O foguete é o medidor de progresso principal. Ocupa **2 andares de altura** — a câmara mais alta do bunker.

### Silhueta Única
Uma câmara de pé-direito duplo com andaimes dos dois lados e o foguete em montagem no centro. A silhueta do foguete em construção é imediatamente reconhecível mesmo em tamanho de thumbnail mobile.

### Layout Visual (Corte Transversal)

```
    ┌────────────────────────────────────────┐
    │  [teto em arco / abóbada industrial]   │ ← vigas cruzadas de metal
    │                                        │
    │   ═══                    ═══           │ ← andaime esquerdo
    │   ║║║   ┌─────────────┐  ║║║           │
    │   ║║║   │             │  ║║║           │ ← midground: foguete
    │   ║║║   │   FOGUETE   │  ║║║           │
    │   ║║║   │  (em forma) │  ║║║           │
    │   ▓▓▓   └──────┬──────┘  ▓▓▓           │
    │                │                       │ ← base: plataforma elevada
    │   [Doutor]   BASE     [Ferramentas]    │
    │                                        │
    └────────────────────────────────────────┘
```

### Objetos Principais

**Background**:
- Paredes de pedra/concreto com rede de tubulações verticais subindo junto com o foguete
- Janelas internas gradeadas que dão visão para os corredores adjacentes
- Cartazes de diagrama do foguete pregados na parede (planta técnica, estilo blueprint retro)

**Midground**:
- O **foguete em si**: começa como uma pilha de sucata reconhecível (barris soldados, cone de metal improvisado) e evolui para uma forma aeronáutica real. A textura é de metal rebite + soldas irregulares
- Andaimes de tubos de metal nos dois lados, com pranchas de madeira horizontal (onde o Doutor caminha)
- **O Doutor**: NPC permanente desta sala, sempre visível ajustando algo no foguete com uma chave de boca enorme

**Foreground**:
- Maçarico de solda apoiado contra o andaime (canto frontal esquerdo, cortado)
- Balde de ferramentas no chão da plataforma
- Fios de extensão elétrica improvisados correndo pelo chão

### Iluminação
- **Primária**: Focos de luz direcionados de baixo para cima (uplights improvisados com lâmpadas incandescentes em gaiola metálica), temperatura `#E8943A` → `#FFB347`. Esta luz de baixo cria sombras dramáticas no foguete que mudam conforme ele cresce.
- **Secundária**: Luz fria azul-elétrica do maçarico quando em uso (`#4FC3F7`), pulsando
- **Rim**: Luz difusa âmbar dos corredores dos andares adjacentes, vazando pelas janelas internas

### Animações Ambientais
1. **Faíscas de solda**: Spray de faíscas alaranjadas caindo do andaime superior a cada 3-4s (partículas de vida curta)
2. **Fumaça do maçarico**: Pluma de fumaça cinza-azulada subindo lentamente
3. **Doutor animado**: Ciclo de idle: bate com a chave → risca a prancheta → olha para cima no foguete → recomeça
4. **Foguete brilhando**: Light flicker suave na superfície metálica do foguete (reflexo das faíscas)
5. **Poeira de construção**: Partículas de pó flutuando no foreground, iluminadas pelos focos

### Progressão Visual do Foguete

| Estágio | Visual |
|---------|--------|
| 0% | Base de metal soldada, sem forma reconhecível — parece lixo empilhado |
| 25% | Corpo cilíndrico identificável, andaimes em ambos os lados |
| 50% | Cone aerodinâmico aparece no topo, bicos de propulsão visíveis embaixo |
| 75% | Pintura de proteção térmica (cinza-prateado), janela de visor aparece |
| 100% | Foguete completo ultrapassando o teto — ponta visível no andar superior |

---

## 🚪 Entrada [HORDAS]
**[Porta para o exterior — zona de combate]**

### Função no Jogo
Saída para a Zona Hordas. Visualmente comunica "daqui você vai lutar". Sala de preparação e triagem de sobreviventes.

### Silhueta Única
Uma porta reforçada de bunker (redonda, estilo submarino/vault) parcialmente aberta à esquerda, com luz vermelha de alerta pulsando acima dela. Inconfundível — toda porta Fallout Shelter comunica "saída para o perigo".

### Layout Visual

```
┌──────────────────────────────────┐
│  [CCTV monitors — wall right]    │ ← background
│                                  │
│  ●══ [PORTA VAULT]     [Mesa]    │ ← midground
│  ←←← Túnel escuro               │
│       [Ex-Militar de costas]     │
│                                  │
│  [Caixas no chão]  [Armas rack]  │
└──────────────────────────────────┘
```

### Objetos Principais

**Background**:
- Parede de monitores de TV antigos empilhados (3x2 grid), cada um mostrando feed estático ou câmera de vigilância do túnel
- Mapa desenhado à mão pregado no centro da parede, com zonas marcadas em vermelho

**Midground**:
- **Porta Vault** no canto esquerdo: circular, de aço, com manivela de fechamento — está **meio aberta**, revelando o túnel escuro com tijolos e trilho de carrinho de mina
- Bancada de madeira pesada com rádio de comunicação, binóculo e munições espalhadas
- **Ex-Militar**: NPC de costas observando os monitores, postura rígida militar

**Foreground**:
- Rack de armas na parede frontal (espingardas, porretes — silhuetas sem decoração excessiva)
- Caixas de madeira empilhadas no canto direito, cortadas pelo foreground

### Iluminação
- **Primária**: Luz vermelha de emergência no teto (`#CC2200`), piscando lentamente (1 ciclo por 3s) — comunica "risco próximo"
- **Secundária**: Luz fria dos monitores de CCTV (`#7ACDFF` com scan lines) iluminando o rosto da Ex-Militar por reflexo
- **Túnel**: Escuridão profunda atrás da porta vault, com apenas uma lanterna enferrujada visível ao fundo

### Animações Ambientais
1. **Luz de alerta**: Pulso vermelho suave no teto (não strobe — apenas intensidade variando)
2. **Monitores CCTV**: Static flicker individual em cada monitor (timing diferente por tela)
3. **Ex-Militar**: Idle: vira a cabeça lentamente de monitor para monitor → anota algo → repete
4. **Sombras do túnel**: Leve oscilação das sombras no buraco da porta vault (como se houvesse vento lá dentro)

---

## ⚡ Gerador [EXTRAÇÃO]
**[Coração energético do bunker — zona de corrida de extração]**

### Função no Jogo
Fonte de energia do bunker. Conectado visualmente com a zona de Extração — onde recursos são corridos para coletar.

### Silhueta Única
Um gerador diesel industrial enorme dominando o centro da sala, com tubulações saindo pelos quatro lados. O silhueta é inconfundível: carcaça metálica alta + escape vertical com fumaça.

### Layout Visual

```
┌───────────────────────────────────┐
│  [Pipes network — ceiling]        │ ← background
│  [Gauge meters on wall]           │
│                                   │
│       ┌──────────┐                │
│       │ GERADOR  │   [Painel]     │ ← midground
│       │ (diesel) │                │
│       │   ~~~~   │  [Mecânico]    │
│       └──────────┘                │
│  [Piso com vazamentos de óleo]    │
│  [Tonel de combustível] fgr→      │
└───────────────────────────────────┘
```

### Objetos Principais

**Background**:
- Rede de tubulações de cobre e aço saindo do gerador para todas as direções, entrando no teto e nas paredes
- Painel de medidores analógicos na parede: pressão, temperatura, nível de combustível (agulhas visivelmente oscilando)
- Cabo elétrico grosso saindo pela parede direita (indo para o resto do bunker)

**Midground**:
- **Gerador industrial**: Grande, metálico, com grades de ventilação na lateral. Cor base: verde industrial desbotado com marcas de ferrugem. Tubo de escape saindo pelo teto com fumaça
- Painel de controle improvisado: interruptores, botões de cor, LEDs piscando
- **Mecânico Otimista**: Macacão azul manchado de graxa, chave inglesa na mão, sempre sorrindo enquanto trabalha

**Foreground**:
- Tonel de combustível de 200L no canto frontal (estamparia desgastada)
- Poça de óleo no chão refletindo a luz âmbar do gerador

### Iluminação
- **Primária**: Luz âmbar-quente pulsando com o ritmo do motor do gerador (`#E8943A`), levemente mais forte a cada ciclo de pistão
- **Secundária**: Brilho verde dos LEDs do painel de controle (`#2ECC40`)
- **Acento**: Faísca ocasional saindo de um dos conectores elétricos improvisados

### Animações Ambientais
1. **Ritmo do motor**: A luz primária pulsa levemente em ritmo de 80 BPM (motor diesel) — sutil mas perceptível
2. **Fumaça do escape**: Pluma de fumaça cinza saindo do tubo de escape no teto
3. **Agulhas dos medidores**: Oscilam suavemente entre 60-80% do marcador
4. **Mecânico**: Bate na lateral do gerador com a chave → gerador dá um tranco → Mecânico ri e bate de novo

---

## 📡 Comunicações [STEALTH]
**[Central de espionagem — porta para a zona stealth]**

### Função no Jogo
Monitoramento da cidade das IAs. Saída para a Zona Stealth. Contraste intencional com a Entrada [Hordas]: mesmo conceito de "saída", visual completamente diferente.

### Silhueta Única
Sala de servidores com múltiplas telas verticais mostrando mapas de cidade em wireframe neon. Silhueta de racks de servidor bilaterais com luz neon verde pulsando entre eles.

### Layout Visual

```
┌────────────────────────────────────┐
│  [Server racks bilateral]          │ ← background
│  ▓▓▓          ▓▓▓                  │
│  ▓▓▓          ▓▓▓                  │
│   ↕  [TELAS]   ↕                   │ ← midground
│   └──[MAPA]──┘                     │
│      [Hacker]                      │
│  [Cabo fiber  ][Lixo junk food]    │
│               [Lata energético]    │
└────────────────────────────────────┘
```

### Objetos Principais

**Background**:
- Racks de servidor bilaterais (dois, flanqueando a sala) com LEDs piscando em sequência
- Cabos de fibra óptica em feixes saindo pelo piso (para a saída da zona stealth)

**Midground**:
- **Parede de monitores** (3-4 telas em L ou arco): mostrando mapa wireframe neon verde da cidade das IAs, câmeras de vigilância, código correndo
- Mesa bagunçada com teclado iluminado, latas de energético, embalagens de fast food
- **Adolescente Hacker**: capuz com logo de caveira, curvado para frente intensamente, dedos voando no teclado

**Foreground**:
- Feixes de cabo gross no chão, cortados pelo foreground
- Lata de energético vazia caindo (partícula de pó de detritos ao redor)

### Iluminação
- **Primária**: Brilho neon verde das telas (`#00FF88`), frio e digital — ilumina o rosto do Hacker de baixo para cima como horror trope, mas aqui é apenas nerd intenso
- **Secundária**: LEDs azul dos racks de servidor (`#00D4FF`), piscando em sequência binária
- **Sem luz quente**: esta é a sala mais fria do bunker — sem âmbar, sem fogo, apenas eletrônica

### Animações Ambientais
1. **Código correndo**: Texto verde descendo nas telas (estilo Matrix, mas mais denso)
2. **Mapa da cidade pulsando**: Wireframe da cidade tem pulsos de varredura periódicos (radar sweep)
3. **LEDs dos racks**: Sequência de blink diferente em cada rack — padrão caótico mas rítmico
4. **Hacker digitando**: Animação de digitação rápida → pausa → olha para uma tela específica → digita de novo

---

## 🧪 Depósito [INFECÇÃO]
**[Sala contaminada — origem da Zona Infecção]**

### Função no Jogo
Depósito de materiais biológicos/orgânicos coletados. Visualmente é a sala mais perturbadora do bunker — a infecção biológica tem presença aqui mesmo no hub.

### Silhueta Única
Prateleiras de depósito normais com crescimento orgânico verde-bioluminescente nas bordas. Contêineres selados com conteúdo que pulsa. A contradição entre "depósito arrumado" e "coisa viva crescendo" é a silhueta desta sala.

### Layout Visual

```
┌──────────────────────────────────┐
│  [Prateleiras de metal] x3       │ ← background
│  [Potes/contêineres selados]     │
│                                  │
│  [Biomassa brilhante nos cantos] │ ← midground
│  [Caixas empilhadas]             │
│  [Personagem com máscara]        │
│                                  │
│  [Piso com vazamento orgânico]   │
│  [Caixote caído / fgr]           │
└──────────────────────────────────┘
```

### Objetos Principais

**Background**:
- Prateleiras de metal industrial carregadas com contêineres de tamanhos variados — alguns claramente soldados fechados, alguns com etiquetas manuscritas
- Nas bordas superiores das prateleiras: **crescimento biológico verde-musgo**, como se algo estivesse crescendo de dentro dos contêineres

**Midground**:
- Contêineres transparentes com **biomassa adaptativa** visível dentro (material orgânico verde-bioluminescente, com textura de fungo/célula)
- Caixas de madeira empilhadas de forma mais cuidadosa que as outras salas (depósito tem organização)
- NPC com **máscara de gás improvisada** (máscara de soldador + filtros de papelão duct-taped) examinando um contêiner

**Foreground**:
- Piso com vazamento de líquido verde viscoso formando poça pequena
- Caixote de madeira virado de lado

### Iluminação
- **Primária**: Bioluminescência verde-musgo dos contêineres (`#5A9E3A`), emitindo luz própria pulsante
- **Secundária**: Luz fria fluorescente do teto (tubo fluorescente piscando levemente — um deles quase morto)
- **Acento**: Brilho interno de alguns contêineres especialmente densos (`#7FFF00` pontual)

### Animações Ambientais
1. **Pulsação da biomassa**: Conteúdo dos contêineres se expande e contrai suavemente (como respiração)
2. **Fluorescente piscando**: Um dos tubos de luz do teto pisca irregularmente (cria senso de manutenção negligenciada)
3. **NPC com máscara**: Segura contêiner na luz → anota prancheta → coloca contêiner de volta com cuidado
4. **Crescimento orgânico**: Uma tendril fina de biomassa cresce visualmente no canto do background (muito lento — só perceptível ao observar por ~10s)

---

## ⚗️ Pesquisa [CIRCUITO]
**[Laboratório de engenharia reversa — peças do foguete e do Circuito]**

### Função no Jogo
Onde as peças do foguete são pesquisadas e planejadas. Hub para a Zona Circuito. A sala mais "científica" do bunker.

### Silhueta Única
Mesa de laboratório iluminada com componentes eletrônicos espalhados, quadros de equação nas paredes, e holofote de bancada criando um cone de luz preciso. A silhueta é de concentração intelectual.

### Layout Visual

```
┌──────────────────────────────────┐
│  [Paredes cobertas de post-its]  │ ← background
│  [Equações / diagramas]          │
│                                  │
│  [Estante de livros/componentes] │
│  [BANCADA principal iluminada]   │ ← midground
│  [Cientista / Doutor aqui]       │
│                                  │
│  [Lixo de protótipos descartados]│
│  [PCB/placa no foreground]       │
└──────────────────────────────────┘
```

### Objetos Principais

**Background**:
- Paredes literalmente cobertas de post-its coloridos, folhas A4 com equações, diagramas de circuito
- Quadro branco improvisado (madeira pintada de branco) com fórmulas e fluxogramas desenhados
- Prateleira com livros técnicos, alguns substituídos por caixas de componentes eletrônicos

**Midground**:
- **Bancada de laboratório** com holofote direcionado: placa de circuito em análise, lupa improvisada, ferro de solda, osciloscópio vintage
- Componentes eletrônicos organizados em bandejas de ovos (gambiarra clássica para armazenar peças)
- **Cientista Rival**: jaleco branco com rabiscos de caneta, óculos grossa, postura de quem está **muito perto** de descobrir algo

**Foreground**:
- PCB (placa de circuito) descartada no canto frontal (protótipo que falhou)
- Plástico bolha e restos de embalagem no chão

### Iluminação
- **Primária**: Holofote de bancada branco-frio (`#E8F4FD`), direcionado — cria sombras duras na bancada e no rosto da Cientista
- **Secundária**: Luz âmbar fraca do corredor / outras salas vazando pela janela interna
- **Acento**: LEDs azuis do osciloscópio (`#0080FF` com waveform)

### Animações Ambientais
1. **Osciloscópio**: Waveform pulsando na tela verde do osciloscópio
2. **Cientista**: Pega componente → examina na lupa → faz anotação → descarta → pega outro
3. **Post-its**: Um post-it cai da parede lentamente (sem física realista — apenas desliza)
4. **Ferro de solda**: Fio de fumaça fino subindo constantemente

---

## 🕯️ Sacrifício [SACRIFÍCIO]
**[A sala mais ominosa — zona de tomada de decisão]**

### Função no Jogo
Zona de sacrifício e escolha estratégica. Visualmente deve ser a sala que mais contrasta com o resto do bunker — nenhuma tecnologia, apenas ritual improvisado.

### Silhueta Única
Sala circular (ou com parede de fundo em arco) com chão de pedra, velas dispostas em padrão geométrico, e uma mesa central com objetos de "oferenda" (recursos do jogo dispostos em bandeja). A luz de velas cria sombras dançantes que fazem a sala parecer viva de forma inquietante.

### Layout Visual

```
┌──────────────────────────────────┐
│  [Parede de pedra com símbolos]  │ ← background
│  [Sombras dançando na parede]    │
│                                  │
│   🕯   [MESA CENTRAL]  🕯        │
│       [Recursos em bandeja]      │ ← midground
│   🕯        🕯         🕯        │
│      [Personagem de joelhos]     │
│                                  │
│  [Piso de pedra / círculo]       │
│  [Vela caída / foreground]       │
└──────────────────────────────────┘
```

### Objetos Principais

**Background**:
- Parede de pedra bruta com **símbolos gravados** — não são claramente arcanos nem tecnológicos, são uma linguagem intermediária (como se alguém tentasse comunicar algo para uma IA usando símbolos antigos)
- Manchas de fuligem no teto acima das velas
- Rachadura na parede com raízes de planta invadindo (nature reclaiming)

**Midground**:
- **Mesa circular de pedra** (ou tronco cortado largo) no centro — superfície irregular, não polida
- Na mesa: Sucata Metálica e Componentes de IA dispostos em padrão circular, como oferenda
- **Círculo de velas** ao redor da mesa (7-9 velas em diferentes alturas)
- NPC de joelhos com cabeça inclinada (personagem indeterminado — a identidade aqui é ambígua por design)

**Foreground**:
- Vela caída derramando cera no chão (poça solidificada)
- Ossos de animal pequeno no canto (não grotesco — apenas ominoso)

### Iluminação
- **Primária**: Luz de velas — múltiplas fontes de `#FF8C00` a `#FFCC44`, todas com flicker independente
- **Sem luz elétrica nesta sala** — nenhuma lâmpada, nenhum LED, nenhum monitor
- As sombras na parede do background são **grandes e dançantes** — a sala parece ter o dobro do tamanho real

### Animações Ambientais
1. **Chamas das velas**: Cada vela com frequência de flicker diferente — nunca todas juntas. Cria movimento orgânico constante
2. **Sombras na parede**: Animação de sombra gigante dançando no background — extrapolada das chamas
3. **Fumaça das velas**: Fios de fumaça fina saindo de cada vela, curvando-se levemente
4. **NPC**: Leve oscilação do corpo (respiração profunda, meditação ou reza) — nenhum movimento grande

---

## Conexões entre Salas: Corredores e Pilares

Os elementos de transição entre salas são tão importantes quanto as salas em si.

### Tipologia de Conexões

**Corredor horizontal** (entre salas do mesmo andar):
- Abertura arqueada, sem porta — apenas moldura de concreto
- Tubo de luz fluorescente no teto do corredor (contribui para a luz de preenchimento das salas adjacentes)
- Fios elétricos correndo pelo teto visíveis

**Escada** (entre andares):
- Escada de metal industrial aparafusada na parede
- Corrimão de cano de ferro
- Luz de emergência vermelha pequena ao lado de cada lance

**Pilar entre salas**:
- Concreto revestido com tubulações verticais (água, elétrica, dados)
- Marcas de ferrugem nas junções
- Ocasionalmente: recado/aviso colado com duct tape

### O Foguete como Âncora Visual

Quando o jogador fizer zoom out para ver o bunker inteiro, o foguete deve ser visível **através dos pisos** — a câmara central tem janelas internas em cada andar, permitindo que a silhueta vertical do foguete seja sempre perceptível mesmo de andares adjacentes. Isso é o elemento de orientação mais importante do hub.

---

## Especificações de Asset para Implementação

### Tamanhos de Sala (Mobile 1080x1920)

| Sala | Largura | Altura | Proporção |
|------|---------|--------|-----------|
| Sala padrão | 480px | 320px | 3:2 |
| Baia do Foguete | 480px | 640px | 3:4 (2 andares) |
| Corredor | 120px | 320px | — |

### Camadas por Sala (Godot CanvasLayer)

```
Sala_[Nome]/
├── Background/         ← CanvasLayer z=0, static sprites
├── BackgroundFX/       ← CanvasLayer z=1, looping animations
├── Furniture/          ← CanvasLayer z=2, static props
├── Characters/         ← CanvasLayer z=3, animated NPCs
├── ForegroundProps/    ← CanvasLayer z=4, static foreground
└── ForegroundFX/       ← CanvasLayer z=5, particles (dust, smoke)
```

### Paleta por Sala (Temperatura de Cor)

| Sala | Temperatura | Hex primário | Sensação |
|------|------------|--------------|---------|
| Baia do Foguete | Quente | `#E8943A` | Esperança, construção |
| Entrada [Hordas] | Emergência | `#CC2200` | Perigo iminente |
| Gerador [Extração] | Quente-industrial | `#E8943A` + `#2ECC40` | Energia, trabalho |
| Comunicações [Stealth] | Frio-digital | `#00FF88` | Tensão, espionagem |
| Depósito [Infecção] | Bio-verde | `#5A9E3A` | Orgânico, inquietante |
| Pesquisa [Circuito] | Frio-científico | `#E8F4FD` | Concentração, descoberta |
| Sacrifício | Âmbar-vela | `#FF8C00` | Ritual, ominoso |

---

## Checklist de Aprovação Visual (por sala)

Antes de uma sala ser aprovada como "game ready", ela deve passar por estes critérios:

- [ ] **Reconhecimento sem texto**: Mostrar a sala sem labels para 3 pessoas — todas identificam a função
- [ ] **3 planos visíveis**: Background, midground e foreground são distinguíveis na thumbnail 480x320
- [ ] **Fonte de luz diegética**: A origem da luz está visível na cena (não é luz "de lugar nenhum")
- [ ] **1 animação ambiente**: Pelo menos uma animação looping presente (não estática)
- [ ] **Profundidade no foreground**: Pelo menos 1 objeto cortado pelo frame frontal
- [ ] **Conexão estrutural**: A parede/pilar da sala tem continuidade visual com as salas adjacentes
- [ ] **NPC integrado**: O NPC da sala tem espaço próprio que parece pertencer a ele
- [ ] **Paleta correta**: A sala usa exclusivamente cores da tabela acima (nenhuma cor fora da paleta do bunker)

---

*Relacionado: `design/art-direction.md`, `design/gdd/hub-world-map.md`, `design/gdd/hub-and-characters.md`*
*Versão de implementação: ver `src/ui/` e cenas em `assets/scenes/hub/`*
