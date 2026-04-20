# Hub Scene — Status de Implementação

## Visão Geral
Hub é a tela principal do Fungineer — uma vista isométrica estilo Fallout Shelter com 6 andares, 15 salas, 12 NPCs, foguete central, e 6 zonas jogáveis.

## ✅ Implementado (3 Sprints)

### Sprint 1: Estrutura Base
- **HubData.gd**: Dados estruturados (11 NPCs, 15 rooms, 6 zones, mapeamento)
- **HubScene.gd**: Orquestração principal, detecção de cliques, gerenciamento de estado
- **HubRenderer.gd**: Renderização procedural do grid 6×7
- **HubNPCManager.gd**: Posicionamento e animação de bobbing (ciclo 0.6s)
- **HubRocket.gd**: Visualização básica do foguete
- **HubState.gd estendido**: Signals hub-specific, getters para dados

### Sprint 2: Renderização Detalhada
- **15 tipos de sala** com interiores únicos:
  - Surface: gradiente + silhueta de cidade
  - Surface-exit: céu poluído + ruínas + enxame animado
  - Tech: monitores vermelhos piscando
  - Storage: prateleiras com itens
  - Medical: camas + cruz verde
  - Lab: béqueres coloridos
  - Common: mesa + luminária
  - Kitchen: fogão com queimadores
  - Workshop: bancada + ferramentas
  - Archive: prateleiras com livros
  - Server: racks com luzes neon (pulsando)
  - Office: desk + monitor
  - Bedroom: cama rosa
  - Transit: porta
  - Tunnels: rails (warm/cool)

- **Iluminação dinâmica**: Overlay colorido por tipo de luz (15 tipos)
- **Zona badges**: Círculos pulsantes (animação Engine.get_physics_frames())
- **Efeitos animados**:
  - Monitores piscam
  - Sparks no workshop
  - Rack lights pulsam
  - Zone badges animadas

### Sprint 3: Componentes de UI
- **HubCharacterCard**: Popover com nome, profissão, confiança, missão
- **HubZoomPanel**: 4 abas (BRIEFING, NPC, HISTÓRICO, ITENS) + portal visual
- **HubRocketPanel**: Blueprint com peças e progresso
- **Integração**: Cliques em salas abrem painéis apropriados

## 📋 Próximos Passos (Sprint 4+)

### Sprint 4: Polish & Variants
- [ ] Sistema de variantes (warm, balanced, blueprint)
- [ ] Animações refinadas (NPCs wandering, zoom smooth)
- [ ] SFX/music integration
- [ ] Dialog system (missões por NPC)
- [ ] Variações de cor do foguete por estado

### Sprint 5: Features Avançadas
- [ ] Squad selection para Hordas
- [ ] Run history timeline
- [ ] Item inspection system
- [ ] NPC relation tree
- [ ] Rocket progress tracking visual

## 🏗️ Arquitetura

### Padrões
- **Signal-driven**: HubState emite signals, componentes se inscrevem
- **Procedural rendering**: Node2D._draw() para tudo (sem sprites)
- **Dynamic UI**: CanvasLayer com construção GDScript (sem .tscn)
- **Area2D hitboxes**: Detecção de cliques em salas

### Estrutura de Arquivos
```
src/scenes/hub/
├── HubScene.tscn          # Skeleton minimal
├── HubScene.gd            # Orquestração
├── HubData.gd             # Dados (NPCs, rooms, zones)
├── HubRenderer.gd         # Renderização grid
├── HubNPCManager.gd       # NPCs + animações
├── HubRocket.gd           # Foguete visual
└── README.md              # Este arquivo

src/ui/hub/
├── HubCharacterCard.gd    # NPC popover
├── HubZoomPanel.gd        # Zone entry panel
└── HubRocketPanel.gd      # Rocket blueprint
```

## 🎮 Fluxo de Interação

1. **Hub Render** → Grid 6×7 com iluminação dinâmica
2. **Clique em sala vazia** → Nada
3. **Clique em sala com NPC** → HubCharacterCard popover
4. **Clique em zona** → HubZoomPanel (BRIEFING, NPC, HISTÓRICO, ITENS)
5. **Clique foguete** → HubRocketPanel blueprint
6. **Iniciar zona** → Transição para run

## 📊 Dados

### NPCs (11 + Doutor)
- Doutor (100% trust) — Liderança
- Marcus (72%) — Engenheiro
- Amara (58%) — Médica
- Yuki (81%) — Hacker
- Elena (64%) — Ex-Militar
- Bae (44%) — Documentarista
- Priya (36%) — Rival
- Tomas (87%) — Mecânico
- Lena (28%) — Criança
- Richard (52%) — Ex-Exec
- Viktor (40%) — Cínico

### Salas (15 total)
- Superfície, Saída (Hordas)
- Vigia, Armamentos, Enfermaria (Infecção)
- Lab (Sacrifício), Sala Comum, Cozinha
- Workshop, Arquivo (Extração), Server (Circuito)
- Gestão, Quarto, Corredor
- Túnel Stealth, Túnel Hordas

### Zonas (6 portais)
- Hordas (Squad) → Túnel Hordas + Saída
- Stealth → Túnel Stealth
- Infecção → Enfermaria
- Circuito → Server
- Extração → Arquivo
- Sacrifício → Lab

## 🎨 Visual Style

- **BG**: Preto queimado (#0e0a07)
- **Ink**: Bege quente (#F4E4C8)
- **Warm Light**: Âmbar (#E8943A)
- **Cool Light**: Neon verde (#00FF88)
- **Grid**: Linhas cinzas 0.15
- **Fontes**: Inter (UI), Special Elite (títulos), JetBrains Mono (mono)

## 🐛 Conhecidos Limitações

- RocketPanel não renderiza peças em anéis (placeholder)
- Portal visual não implementado (placeholder)
- Diálogos não integrados
- Variant system não implementado
- NPCs não se movem entre salas

## 📝 Notas de Desenvolvimento

- Sem dependencies externas (ColorRect, tudo procedural)
- Animações usam `Engine.get_physics_frames()` para sincronização
- Hitboxes via Area2D.input_event
- CanvasLayer para layering (background, UI, zoom panels)
- Signals para desacoplamento de componentes

---

**Próximo milestone**: Sprint 4 (animações, polish, variants)  
**Status**: 75% funcional (core loop completo, faltam refinamentos)
