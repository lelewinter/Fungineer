---
tags: [fungineer, creative-direction, pillars]
date: 2026-06-05
tipo: creative-direction
status: TRAVADO (locked) — autoridade criativa
autor: Creative Director
---

# Fungineer — Pilares Criativos (Travados)

**Fonte de verdade criativa.** Quando design, narrativa, arte ou áudio
conflitarem, este documento decide. Tudo aqui é falsificável: cada pilar tem um
teste de passa/não-passa que resolve uma decisão concreta.

Baseado em: `design/MASTERPLAN.md`, `README.md`, `design/gdd/game-concept.md`,
`design/narrative/narrative-arc.md`, e amostra de GDDs de zona (Infecção,
Circuito, Cordilheira, Catedral).

> **Premissa assumida (subagente não-interativo):** onde os documentos-fonte se
> contradizem, este artefato faz uma ruling direcional e a marca como
> **[RULING]**. Itens [RULING] precisam de ratificação da Leticia — ver §
> "3 decisões a travar".

---

## 0. A fantasia central, em uma frase

> **Você é a engenhoca viva que a máquina nunca modelou.** Em cada zona, mover é
> a única ação — e o que mover *significa* muda tudo. O progresso é um foguete
> improvável crescendo na tela, construído com sucata, esporos e fé, por gente
> que talvez seja o problema que está tentando escapar.

Promessa emocional: **esperança desesperada** — leveza absurda na superfície,
peso real por baixo.

---

## 1. Os 5 Pilares (não-negociáveis)

### Pilar 1 — MOVER É A ÚNICA AÇÃO
O único input em qualquer zona é mover o personagem. Não existe botão de ataque,
habilidade ativada, nem interação direta. Posicionamento *é* o jogo. Esta é a
identidade do produto — o "and also" do pitch.

- **Aplica a:** design (toda mecânica deriva de posição), UI (zero botões de
  ação na HUD de zona), arte (telegrafar perigo por leitura espacial, não por
  prompts de botão), áudio (feedback de movimento, não de input de ação).
- **Teste passa/não-passa:** "Esta zona precisa de um botão/toque que não seja
  mover?" → **Se sim, a mecânica está errada. Reprojetar como posição.**
- **Tensão que cria:** proíbe soluções fáceis de combat/stealth/puzzle que todo
  designer alcança por reflexo. Força reinvenção a cada zona.

### Pilar 2 — CADA ZONA É UM GÊNERO INTEIRO
O mesmo input recria um gênero clássico completo e reconhecível por zona
(Pac-Man, Snake, Sokoban, Frogger, Boulder Dash, Agar.io, Q*bert, Donkey Kong…).
Variedade radical é o ponto, não um bug de inconsistência. A surpresa do "o que
mover significa aqui" substitui o tutorial.

- **Aplica a:** design (cada zona deve ser legível em <10s sem texto), arte
  (linguagem visual da zona comunica o gênero), narrativa (a ficção da zona
  *justifica* o gênero — ver Pilar 4).
- **Teste passa/não-passa:** "Devemos uniformizar as zonas para consistência de
  feel?" → **Não. Unificamos o *vocabulário de juice* (FX/luz/câmera), nunca a
  mecânica.** "Um jogador novo entende o objetivo desta zona sem tutorial em até
  duas tentativas?" → Se não, a leitura espacial falhou.
- **Tensão que cria:** custo de produção cresce por zona (cada zona é quase um
  jogo). Obriga escolhas de escopo — ver Pilar 5 e o risco de coesão.

### Pilar 3 — A NATUREZA É TECNOLOGIA, NÃO MAGIA
A resposta humana à máquina é orgânica e improvisada: micélio, esporos,
fermentação, sucata, casca, gente. O contraste estético é a tese do jogo —
**quente/orgânico/vivo (nós) vs. frio/metálico/otimizado (eles)**. O foguete
biológico não é decoração: é o argumento visual de que vida bagunçada vence
eficiência limpa.

- **Aplica a:** arte (paleta canônica do MASTERPLAN: âmbar quente + fungal
  vibrante para nós; cinza-metálico + ciano elétrico + vermelho-alerta para a
  IA), áudio (orgânico/synth-quente para o jogador; tons sintéticos frios para a
  IA), design (recursos e upgrades são biológicos/sucata, nunca "tech loot"
  genérico).
- **Teste passa/não-passa:** "Este recurso/upgrade/efeito parece tecnologia de
  IA limpa (azul brilhante, holograma, sci-fi genérico)?" → **Se sim, recolorir
  e re-tematizar como orgânico/sucata.** Exceção: quando o jogador *subverte* a
  máquina (ex.: Catedral usando os sinos de ARGOS), o efeito pode ser frio — e
  isso é deliberado e raro.
- **Tensão que cria:** zonas de IA precisam ser frias e hostis (Pilar 2 pede
  fidelidade ao gênero) mas o jogo precisa permanecer "fungal e quente"
  (north star de arte). A regra de ouro: **o ambiente é deles (frio); o
  personagem e o que ele deixa para trás é nosso (quente).**

### Pilar 4 — A FICÇÃO JUSTIFICA A MECÂNICA (consonância ludonarrativa)
Nenhuma zona é "gênero clássico com skin". A ficção da zona *explica por que*
mover significa o que significa, e o tom da zona reforça o tema. Infecção: você
*é* o vírus, então mover propaga. Circuito: você *é* o elétron ausente, então
mover conduz. Cordilheira: a IA abandonou o lugar, então o silêncio (ausência de
inimigo) *é* a mecânica. A mecânica e a história são a mesma coisa.

- **Aplica a:** narrativa (cada zona precisa de uma frase que ligue ficção→input),
  design (se a justificativa ficcional não existe, a mecânica é arbitrária e
  fraca), arte/áudio (o mood vende a ficção que vende a mecânica).
- **Teste passa/não-passa:** "Consigo completar a frase 'Você é/está ___, então
  mover significa ___' para esta zona?" → **Se não, a zona ainda não está
  desenhada — só temática-pintada.**
- **Tensão que cria:** colide com o anti-pilar antigo "NÃO é narrativa pesada"
  (game-concept) vs. a profundidade dos GDDs/arco. Resolvido em §2 (risco de
  coesão) e §3 (decisão 1).

### Pilar 5 — A RUN É CURTA E É UMA APOSTA
Sessões de 5–15 min, runs de <2 min, sem checkpoint dentro da run, fail = perde
o que coletou na run. A base é santuário (sem perda permanente lá). A decisão de
*sair cedo vs. arriscar mais* é tão importante quanto sobreviver. Esperança
desesperada vive aqui: a base nunca te pune por existir, mas cada saída é fé.

- **Aplica a:** design (toda zona cabe em 2 min ou corta conteúdo; mochila com
  limite força a decisão de saída), produção (escopo de zona limitado por essa
  caixa de tempo), narrativa (lore entra em fragmentos curtos e ignoráveis,
  nunca em cutscene longa que quebra o ritmo).
- **Teste passa/não-passa:** "Esta zona passa de 2 min em jogo normal?" →
  **Corta conteúdo até caber.** "Adicionamos checkpoint dentro da run?" → **Não.**
  "Adicionamos evento de perda permanente na base?" → **Não.**
- **Tensão que cria:** o arco narrativo de 3 atos (denso, filosófico) precisa
  caber em fragmentos de <15 s sem virar cutscene. Força disciplina narrativa.

### Anti-Pilares (todo "não" protege um "sim")
- **NÃO** é combate manual — nenhum ataque ativado, em zona nenhuma (protege P1).
- **NÃO** é base-builder de gestão — a base é recompensa visual/social (protege
  P5 e o foco de tensão na zona).
- **NÃO** condena nem absolve a IA — sem resposta certa; o jogador conclui
  (protege o tom adulto da ficção).
- **NÃO** tem runs longas — >2 min vira corte de conteúdo (protege P5).
- **NÃO** é sci-fi genérico — sem holograma azul, sem "tech loot" limpo do lado
  humano (protege P3).
- **NÃO** uniformiza zonas por consistência — juice é compartilhado, mecânica
  não (protege P2).

---

## 2. Auditoria de coesão — onde a fantasia enfraquece

Avaliei as 11 zonas + loop do foguete contra a fantasia "só-movimento + natureza
vs. máquina". Pontos de atrito, do menor ao maior:

### Atritos menores (gerenciáveis)
- **Foguete biológico vs. recursos metálicos.** Hordas dropa "sucata metálica";
  Circuito dropa "Núcleo Lógico" (processador). Um foguete "100% biológico"
  (MASTERPLAN) que consome metal e processadores de IA é uma contradição de
  flavor. *Veredito:* não é fatal — re-enquadrar como "biotecnologia que
  *canibaliza* a máquina": o foguete é micélio que cresce *em volta* da sucata
  roubada. O orgânico domestica o metal. Mantém Pilar 3 intacto. Documentar no
  `resource-system.md`.
- **Zonas que subvertem a IA (Catedral) vs. tese "natureza vs. máquina".** Usar
  os sinos de ARGOS a favor é, na verdade, o tema mais rico do jogo (a natureza/
  o humano *engana* a otimização). Não é atrito — é o coração do Final C.
  Proteger.
- **Cordilheira "sem combate automático" vs. Pilar 1.** Ela mantém só-movimento
  (estabilidade de cômodo, Selvagens atacam parado) — então respeita P1. O risco
  é virar "Hordas com skin triste". O próprio GDD já marca o anti-padrão.
  Aceitável com vigilância.

### O MAIOR risco de coesão
**Existem dois jogos diferentes brigando pela mesma identidade — e o conflito
está nos próprios documentos-fonte, não só na execução.**

1. **Quem é o protagonista e do que é o jogo.**
   - MASTERPLAN/README: **"Dr. Myco, micologista"**, foguete **100% biológico**,
     **tese anti-tech explícita** ("eles têm aço e código, nós temos raízes e
     fé"), tom = **"absurdo otimista, esperança desesperada"**.
   - game-concept/narrative-arc: **"Dr. Paulo Vitor Santos"**, o homem que
     **aprovou a IA que acabou com o mundo** (arco de culpa, não de fé
     anti-tech), num cenário urbano brasileiro ("Mar-do-Sul", "Projeto Olímpio")
     com sistemas CORE/ARGOS/CLEAN/NERVE/FLOW, **três finais filosóficos**, e
     beats pesados (847 mortes/mês, corpos não-processados na favela).
   - O game-concept ainda crava um anti-pilar **"NÃO é narrativa pesada"** —
     enquanto o `narrative-arc.md` é exatamente narrativa pesada.

   Isto é o maior risco porque **a fantasia central depende de saber quem o
   jogador É.** "Micologista de fé que prova que a natureza vence a máquina" e
   "tecnocrata culpado que escapa do mundo perfeito que ele construiu sem nós"
   produzem paletas, diálogos, finais, áudio e até nomes de recursos diferentes.
   Hoje, arte/áudio/narrativa estão recebendo dois nortes incompatíveis. Sem
   travar isto, cada departamento vai puxar para um lado e o jogo vai sentir
   incoerente mesmo que cada peça seja boa.

2. **Sintoma secundário do mesmo risco:** o nome do herói diverge ("Dr. Myco"
   vs. "Dr. Paulo Vitor Santos"), a contagem de zonas diverge (8 no MASTERPLAN,
   11 no README/código), e a engine diverge (Godot no game-concept, PixiJS no
   README/código). Os dois últimos são fáceis (README/código é o estado real —
   11 zonas, PixiJS; a engine é call do technical-director). O nome e a ficção
   são a decisão criativa de fundo.

### Veredito direcional [RULING]
**Unificar em torno de "Dr. Myco como persona pública, culpa como verdade
privada" — um único personagem que carrega as duas leituras.** Em vez de
escolher entre o micologista esperançoso e o tecnocrata culpado, fundir:

- **Camada de superfície (Ato 1, marketing, primeira impressão):** Dr. Myco, o
  micologista absurdamente otimista construindo um foguete de cogumelo. Leve,
  vendável, é o "and also" do pitch. É o que o jogador vê primeiro.
- **Camada profunda (Atos 2–3, fragmentos opcionais):** a fé anti-tech dele é
  *reação à própria culpa* — ele acreditou demais em algum sistema antes (a
  ponte natural com o arco de Paulo). "A natureza é nossa tecnologia" deixa de
  ser slogan ingênuo e vira **penitência**: a única tecnologia que ele confia
  agora é a que apodrece, erra e vive.

Isto preserva o tom "esperança desesperada" do MASTERPLAN *e* o peso do
`narrative-arc.md` sem contradição: a leveza é verdadeira na superfície, o peso é
verdadeiro embaixo. Resolve também o falso anti-pilar "narrativa pesada" →
re-enunciar como **"narrativa pesada é opcional e fragmentada, nunca obrigatória
nem em cutscene"** (a história está lá para quem cava, ignorável para quem só
quer mover — alinhado a Hollow Knight: "atmosfera over explanation").

*Por que não escolher um só dos dois jogos:* descartar o micologista mata o
hook fungal vendável e o north star de arte já travado; descartar a culpa mata os
três finais e o tema adulto que dá ao jogo profundidade competitiva. A fusão é
mais barata que reescrever qualquer um dos lados — alinha sem jogar trabalho
fora.

**Saberemos que acertamos se:** um jogador casual descreve o jogo como "o
cientista dos cogumelos que foge das máquinas" *e* um jogador que terminou os 3
finais descreve como "sobre o que a gente faz ao descobrir que talvez a gente
seja o problema" — e ambos estão certos sobre o mesmo jogo.

---

## 3. As 3 decisões criativas a travar a seguir

### Decisão 1 — Identidade canônica do protagonista e da ficção [a ratificar]
Travar a fusão "Dr. Myco (superfície) + culpa (profundidade)" do §2, OU escolher
um dos dois jogos puros. Define nome canônico (Dr. Myco vs. Paulo vs. ambos como
o mesmo homem), se o cenário urbano brasileiro (Mar-do-Sul/Olímpio) e os sistemas
de IA (CORE/ARGOS/…) são canônicos, e o status real do anti-pilar "narrativa
pesada". **Bloqueia:** narrativa (todo diálogo e os 3 finais), arte (paleta e
mood do herói/bunker), áudio (tom). É o desbloqueador de tudo. Recomendação:
ratificar a fusão.

### Decisão 2 — A regra do contraste quente/frio nas zonas de IA
Travar a "regra de ouro" do Pilar 3 como spec acionável para arte e áudio: **o
ambiente da zona de IA é frio/metálico (fiel ao gênero, Pilar 2), mas o
personagem e tudo que ele propaga/deixa é quente/fungal (Pilar 3).** Inclui a
exceção deliberada das zonas de subversão (Catedral). **Bloqueia:** art-director
(como pintar 11 zonas sem o jogo virar genericamente sci-fi ou genericamente
fungal) e audio-director (síntese fria vs. quente). Sem isto, o M4/M5 (feel das
zonas) corre o risco de cada zona escolher seu próprio tom.

### Decisão 3 — Como o foguete biológico reconcilia recursos não-biológicos
Travar o re-enquadramento "micélio que canibaliza a máquina" (foguete orgânico
cresce em volta da sucata/núcleos roubados) e cascatear para `resource-system.md`
e para a UI de crescimento do foguete no hub. **Bloqueia:** design (nomes e
fantasia dos recursos por zona), arte (como o foguete cresce visualmente — M1/M8
é a âncora de progresso). Sem isto, "foguete 100% biológico" continua mentindo
sobre metade dos recursos que o jogador coleta.

---

## 4. Aesthetics MDA travadas (ordem de prioridade)
1. **Challenge** — maestria de posicionamento (entrega Competence; alinha P1/P2).
2. **Discovery** — "o que mover significa aqui?" por zona (alinha P2/P4).
3. **Fantasy** — o cientista improvável e o foguete vivo (alinha P3).
4. **Submission** — ritmo de runs curtas (alinha P5).

Narrative entra como **camada opcional sobre Discovery**, não como aesthetic
primária — coerente com o veredito do §2.

---

*Relacionado: `design/MASTERPLAN.md`, `README.md`, `design/gdd/game-concept.md`,
`design/narrative/narrative-arc.md`, `design/narrative/world-lore.md`,
`design/gdd/resource-system.md`. Próximo passo de cascata: abrir as 3 decisões
para ratificação e então notificar narrative/art/audio directors.*
