# Zona Stealth — Design de Mapa e Layout

**Version**: 1.1
**Date**: 2026-03-22
**Status**: Draft — Tema Atualizado

---

## Tema: O Escritório Corporativo Tech do Futuro

> "Não é uma rua. É o QG da IA — limpo, climatizado, e completamente hostil."

A Zona Stealth é o interior de um **grande complexo corporativo de tecnologia** — o equivalente a uma Google, DeepMind, ou OpenAI do mundo pós-apocalipse, agora completamente operado por IAs sem nenhum humano. O jogador entra para **roubar informação / conhecimento**: drives de dados, segredos de pesquisa, blueprints de sistemas de IA que o Doutor pode usar no foguete.

O contraste com o bunker é total e intencional:

| Hub (Bunker) | Zona Stealth (Escritório) |
|---|---|
| Quente, laranja, improvisado | Frio, branco, projetado |
| Fios expostos, gambiarras | Cabos embutidos, sem emendas |
| Bagunçado, pessoal | Asséptico, impessoal |
| Humano | Não-humano |

**O recurso coletado muda**: em vez de "Componentes de IA" físicos, o jogador coleta **Pacotes de Dados** — drives, servidores portáteis, arquivos físicos de pesquisa. A narrativa muda de "roubar peças" para "roubar conhecimento".

---

## Referências Visuais

**Referência de layout**: Arena top-down com paredes baixas, cantos e corredores *(Brawl Stars-style)*
**Referência de atmosfera**: Escritório tech ultramoderno — Google Campus, Apple Park, data centers de ficção científica

---

## Princípio de Design do Mapa

O mapa da Zona Stealth é construído sobre **linha de visão como recurso**. Cada elemento arquitetônico existe para uma de três funções:

1. **Bloquear** — parede/divisória que impede cone de visão de drones/câmeras
2. **Expor** — área aberta onde o jogador é vulnerável e precisa atravessar rapidamente
3. **Esconder** — alcova, sombra ou canto onde o jogador pode parar com segurança

O jogador lê o mapa intuitivamente: **lugares escuros são seguros, lugares iluminados são perigosos**. No contexto do escritório, isso se traduz em: corredores de serviço e salas sem uso são escuros e seguros; open spaces e corredores principais são iluminados e perigosos.

### Regra de Isolamento de Terminal

Todo terminal é posicionado no centro de uma **ilha de exposição**: área circular de ≥150px de raio sem sombra. A sombra mais próxima é a posição do jogador antes de partir para o terminal — não durante.

### Regra de Guardião de Terminal

Todo terminal tem um `TerminalGuardian` posicionado entre a sombra mais próxima e o terminal:
- O cone do guardião cobre o caminho natural de aproximação (saída da sombra → terminal)
- Para chegar ao terminal o jogador deve: (a) distrair o guardião com raio de som, ou (b) usar Sincronização Cinética com um drone que passe pelo ângulo morto do guardião, ou (c) aguardar uma janela criada por patrulhas convergentes

### Regra de Patrulhas Convergentes

Cada cluster de terminais (zona do mapa) deve ter ≥2 rotas de drone que se cruzam na área. A janela simultânea onde ambos estão no ponto mais distante dura ≤3s — exige leitura de dois ritmos.

---

## Linguagem dos Elementos do Mapa

### Paredes e Barreiras — Linguagem do Escritório

No escritório tech, as divisórias substituem paredes de concreto — mas o comportamento é o mesmo. Três tipos:

**Parede sólida** (bloqueia tudo): Paredes externas de concreto revestido ou vidro opaco fosco. Altura total. O jogador atrás está 100% invisível para cones de visão e câmeras. Visual: superfície branca polida com barra de LED no rodapé.

**Divisória de escritório / vidro fosco** (bloqueia visão, não som): Painéis de vidro jateado, prateleiras de livros técnicos, biombos de escritório. Altura de meio-corpo. Bloqueia cones de visão mas não o raio de som — correr atrás de uma divisória ainda atrai patrulhas. Visual: translúcido, silhueta do jogador vagamente visível do outro lado.

**Mobiliário destrutível** (temporária): Mesas de escritório, servidores em rack, cadeiras empilhadas. Drones em perseguição atravessam/derrubam ao passar — a cobertura some. Visual: materiais modernos, colapsa de forma dramática com animação de queda.

---

### Zonas de Sombra — Os Esconderijos do Escritório

Num escritório de IA perfeito, quase tudo é iluminado — as zonas escuras são raras e valiosas. Toda área de sombra tem **chão de cor mais escura com reflexo azul-frio apagado**. O contraste com o branco luminoso do open space é imediato.

**Tipos de esconderijo no contexto do escritório**:

**Corredor de serviço** *(equivalente ao beco)*: Passagem técnica nos fundos, entre a fachada de vidro e a estrutura do prédio. Sem câmeras — foi projetado para manutenção, não para funcionários. Barulho ecoa (raio de som +20%) por ser um espaço fechado e liso.

**Sala de servidor** *(esconderijo premium)*: Cubo escuro cheio de racks de servidor com luzes piscando em laranja e verde. Sem câmeras internas (irônico — a IA confia em sua própria sala). O barulho dos fans mascara os passos do jogador (raio de som −30% enquanto dentro). O pacote de dados mais valioso da run fica aqui.

**Ângulo morto de câmera** *(canto em L)*: O canto de 90° entre duas paredes — qualquer câmera tem um ponto cego no ângulo traseiro. Idêntico ao canto em L de rua, mas aqui o visual é parede branca + piso de madeira clara com sombra discreta.

**Sala de reunião** *(alcova)*: Sala com paredes de vidro fosco e porta fechada. Entrar requer parar 1s para abrir a porta (som de clique audível — raio de som pulso +60px instantâneo). Dentro: silêncio total, invisível para câmeras externas.

**Embaixo da mesa** *(cobertura horizontal)*: Grandes mesas de conferência permitem que o jogador passe por baixo. Câmeras aéreas não cobrem sob a mesa. Patrulhas terrestres cobrem — precisa de timing.

**Closet / copa** *(esconderijo pequeno)*: Espaço mínimo mas 100% seguro. Serve para esperar uma perseguição passar. Só cabe o jogador — sem mobilidade.

---

### Áreas Abertas — Os Chokepoints do Escritório

**Open space principal** *(chokepoint máximo)*: O coração do andar — dezenas de mesas organizadas em grid, teto alto com painéis de LED intensos. Sem cobertura. 3–4 câmeras em ângulos sobrepostos. O pacote de dados de tier médio fica em uma mesa no meio. Entrar aqui exige tempo, paciência, e leitura dos padrões de câmera.

**Recepção / lobby** *(entrada monitorada)*: Balcão de recepção com drone-recepcionista de serviço (estático, mas com campo visual 180°). Espaço vazio, chão espelhado que reflete as luzes. A entrada do elevador fica aqui — obrigatório passar pelo menos uma vez.

**Corredor principal** *(chokepoint linear)*: Corredor largo e longo com câmeras em ambas as extremidades e patrulha andando no centro. Divisórias de vidro dos dois lados — visível de dentro das salas. A travessia exige sincronizar com a patrulha E esperar as duas câmeras virarem ao mesmo tempo.

---

## Gramática do Mapa — Como os Elementos se Combinam

A referência de Brawl Stars mostra o princípio: o mapa é feito de **células** com padrão reconhecível. Cada célula tem uma função clara.

```
Padrão base de célula:
┌─────────────────────┐
│  SOMBRA   │  ABERTO │  ← Sempre há uma rota segura alternativa
│  (segura) │(câmera) │    ao lado de cada área perigosa
└─────────────────────┘
```

**Regra dos três caminhos**: Em qualquer ponto do mapa, o jogador sempre tem 3 rotas visíveis:
- Rota A: segura, mais longa (vai pelos becos)
- Rota B: risco médio, média distância (timing de câmera)
- Rota C: perigosa, mais curta (área aberta, câmeras ativas)

Isso cria a decisão recorrente de stealth: **segurança vs eficiência de tempo**.

---

## Layout do Mapa MVP — "O Andar 14"

> Nome interno do mapa: **Andar 14** — um andar do complexo corporativo da IA.
> A narrativa implícita: há dezenas de andares acima e abaixo. Este é só um deles.

O mapa é **maior que a tela** — câmera segue o jogador com scroll. Tamanho aproximado: 3× a tela na horizontal, 4× na vertical.

```
╔═══════════════════════════════════════╗
║  [EXIT — Escada de Emergência]        ║  ← Saída no topo
║                                       ║
║  ┌──────────┐   ╔═══════════╗         ║
║  │CORREDOR  │   ║ SALA DE   ║  📷     ║
║  │SERVIÇO   │   ║ SERVIDOR  ║         ║
║  │(escuro)  │   ║ (escuro)  ║         ║
║  └────┬─────┘   ╚═════╦═════╝         ║
║       │               ║               ║
║  ╔════╧═══════════════╩════╗          ║
║  ║    OPEN SPACE PRINCIPAL  ║  📷📷   ║
║  ║   (luminoso, perigoso)   ║         ║
║  ║     ← pacotes de dados   ║         ║
║  ╚════╦═══════════════╦════╝          ║
║       │               │               ║
║  ┌────┴────┐    ┌──────┴──┐           ║
║  │SALA DE  │    │SALA DE  │  📷       ║
║  │REUNIÃO  │    │REUNIÃO  │           ║
║  └─────────┘    └─────────┘           ║
║                                       ║
║  ╔═══════════════════════════╗        ║
║  ║  RECEPÇÃO / LOBBY         ║  📷   ║
║  ║  (drone-recepcionista)    ║        ║
║  ╚═══════════════════════════╝        ║
║                                       ║
║  [ENTRADA — Porta dos Fundos]         ║
╚═══════════════════════════════════════╝

(escuro) = Zona de Sombra / Esconderijo
📷 = Câmera de Segurança
```

**Zonas do mapa por intensidade**:

| Zona | Posição | Cobertura | Câmeras | Patrulhas | Pacotes de Dados |
|---|---|---|---|---|---|
| Porta dos fundos | Sul | Alta (corredor serviço) | 0 | 1 patrulha lenta | 1 (fácil) |
| Salas de reunião | Centro-sul | Média (vidro fosco) | 1 | 1 patrulha | 1–2 (médios) |
| Open space | Centro | Baixa (mesas) | 3 coordenadas | 1 patrulha rápida | 2–3 (principais) |
| Sala de servidor | Centro-norte | Alta (sala escura) | 0 | 0 | 1 (mais valioso) |
| Escada/saída | Norte | Média | 1 | 1 patrulha | 1 (opcional) |

A dificuldade cresce do sul (entrada pelos fundos) ao norte (sala de servidor + saída). O jogador pode optar por coletar apenas os pacotes fáceis e sair cedo, ou arriscar o open space para chegar à sala de servidor.

---

## Inimigos da Zona Stealth — Segurança Corporativa da IA

Os inimigos do escritório são **robôs de segurança corporativa** — diferente dos inimigos sucata da Zona Hordas, estes são polidos, novos, e assustadoramente funcionais. Comunicam poder por elegância, não por tamanho.

**Paleta visual dos inimigos de stealth**: branco-perola, cinza-platina, detalhes em neon azul-ciano. O oposto dos robôs enferrujados das Hordas — estes são produtos de prateleira, não sucata de guerra.

---

### Drone de Patrulha — "Segurança"
Esfera branca polida do tamanho de uma cabeça humana, flutuando a 1,5m do chão. Projeta cone de visão neon azul-ciano na frente. Anda em rota predefinida. Quando detecta: emite alarme sonoro e chama reforços.

**Visual de estado**: Cone azul (patrulha) → cone amarelo pulsando (investigando) → cone vermelho (alerta).

---

### Sentinela de Corredor — "Guarda"
Robô bípede alto e fino, terno branco, câmera no lugar da cabeça que gira lentamente. Anda devagar mas tem campo visual de 270°. Não faz rota complexa — apenas anda pelo corredor de uma extremidade à outra. O ângulo morto de 90° fica atrás dele.

---

### Câmera Fixa — "Olho"
Não se move. Cone de visão fixo, mas pode ter rotação lenta (variante giratória). Visual: cápsula discreta presa à parede ou ao teto, com lente vermelha. Quando ativa, a lente brilha; quando num ângulo sem o jogador, a lente fica opaca.

---

### Guardião de Terminal — "Sentinela"
Drone hovering estático — diamante laranja-âmbar pulsante, tamanho de um punho. Não tem
rota, não rotaciona. Cone de visão fixo apontado para o terminal que guarda. Olho branco
central pisca indicando que está ativo. Um por terminal — o player aprende a reconhecer a
cor laranja como "guarda objetivo". Quando detecta: dispara alarme (não persegue).

---

### Drone-Recepcionista — "Atendente" *(único na recepção)*
Estático atrás do balcão. Campo visual de 180° — não se move, mas vê metade da sala. Não persegue (não tem pernas) — chama reforços ao detectar. Único inimigo que pode ser "distraído" por o jogador fazer barulho do lado oposto do balcão (vira para investigar, abrindo passagem pelo lado cego).

---

## Patrulhas — Rotas e Comportamento

As patrulhas têm **rotas geométricas simples e previsíveis** que o jogador consegue memorizar em 1–2 observações.

**Rota linear A↔B**: Sentinela anda de uma extremidade do corredor à outra e volta. Janela de passagem é quando está no ponto B, de costas.

**Rota em L**: Drone vira em uma esquina. Cria ângulo morto permanente no canto interno — o jogador aprende a usar esse ponto.

**Rota em quadrado**: Loop fechado ao redor do open space. Mais complexo — exige entender o timing do loop inteiro.

**Estático com rotação**: Câmera ou sentinela parado, girando 360° lentamente. A janela de passagem é o ângulo morto entre duas varreduras.

---

## Elementos Interativos — Ferramentas de Distração no Escritório

*O raio de som como isca é a única ferramenta ativa do jogador (ver zone-stealth.md). O mapa inclui elementos que potencializam essa mecânica no contexto do escritório:*

**Cadeira de escritório no corredor**: Objeto físico que o jogador derruba ao correr por ele. Faz barulho alto (raio de som +40% por 0,5s). Risco passivo para o jogador descuidado; ferramenta intencional para criar distração no lado oposto. Visual: cadeira ergonômica branca no corredor — detalhe de "alguém saiu correndo e largou aqui".

**Servidor de processamento barulhento**: Rack de servidor ligado num canto da sala, emitindo ventilação constante. Patrulhas próximas têm radar de som reduzido em 60px ao redor (o ventilador mascara os passos). Visual: rack preto com luzes verdes e laranja piscando, grade de ventilação com vapor.

**Terminal de acesso da IA**: Painel touch na parede — o Adolescente Hacker hackeia esses terminais remotamente (missão especial). O jogador sem o Hacker pode **parar completamente por 3s** para tentar um hack manual: redireciona uma câmera por 8s mas emite bip audível (raio de som +80px pulso instantâneo ao concluir). Visual: tela retangular na parede, interface neon verde com símbolos de código.

**Impressora / Ploter industrial**: Máquina barulhenta que liga automaticamente em ciclos de 20–25s. Quando está imprimindo: emite som contínuo que mascara movimento rápido (raio de som dividido por 2 na área próxima). O jogador pode esperar o ciclo ou usá-lo para correr. Visual: máquina grande branca com papel saindo e luz laranja piscando quando ativa.

---

## Princípios de Leitura Visual Rápida

Para que o jogador leia o mapa em frações de segundo (essencial no mobile):

**Regra de contraste**: Área de sombra (segura) = escura. Área iluminada (perigosa) = clara. Sem exceções — nunca inverter essa lógica.

**Cone visível sempre**: O cone de visão de cada drone/câmera é visível o tempo todo, mesmo antes de detectar o jogador. O jogador sempre sabe onde está o perigo antes de entrar nele.

**Rota do inimigo telegrafada**: Patrulhas deixam uma **trilha fantasma** no chão mostrando os últimos 2s de movimento — o jogador entende a rota assistindo por 4–6s antes de atravessar.

**Silhueta única por tipo de inimigo**:
- Drone de visão: esfera flutuante com cone de luz frontal
- Câmera de segurança: caixa fixada na parede com lente giratória
- Patrulha terrestre: robô bípede com olhos de câmera laterais

---

## Acceptance Criteria — Layout

- [ ] O jogador nunca fica preso sem rota de escape visível
- [ ] Toda área aberta tem pelo menos uma zona de sombra a ≤ 80px de distância *(rotas de fuga; terminais são exceção deliberada)*
- [ ] As 3 rotas (segura/média/perigosa) são visualmente identificáveis no início da run
- [ ] O open space principal é legível como "zona de alto risco, alta recompensa" ao primeiro olhar
- [ ] Um playtest sem instruções consegue completar uma run em ≤ 4 tentativas
- [ ] Nenhum terminal é coletável sem pelo menos 1 ação tática ativa (distração, sinc, ou timing de 2 patrulhas)
- [ ] Nenhum terminal está a ≤150px de uma zona de sombra
- [ ] Cada terminal tem um TerminalGuardian (diamante laranja) visível antes de entrar na zona quente
- [ ] As rotas de patrulha convergentes ao redor dos terminais têm janela simultânea legível em ≤8s de observação

---

*Relacionado: `design/gdd/zone-stealth.md`, `design/art-direction.md`*
