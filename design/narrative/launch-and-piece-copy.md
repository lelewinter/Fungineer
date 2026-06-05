---
tags: [fungineer, narrativa, copy, producao, dr-myco]
date: 2026-06-05
tipo: copy-producao
status: Pronto para Implementacao
---

# Copy Player-Facing — Lancamento, Pecas e Derrota

**Voz**: Dr. Myco (guia canonica: dr-myco-voice-and-lines.md)
**Canon protagonista**: canon-decision-protagonist.md (Dr. Myco, travado)
**Destinos de codigo**: ver secao 0

---

## Secao 0 — Premissas e Mapa de Slots

### Premissas documentadas

1. **Sequencia de lancamento** nao tem slots de texto proprios na animacao atual.
   Premissa adotada: os 3 beats de ignicao sao `subtitle` progressivo no
   `HubRocketPanel` (substitui o texto estatico durante o lancamento) — ou,
   alternativamente, linhas de flavor sobrepostas no `RocketLaunchOverlay`.
   Ambas as versoes estao aqui; o programador escolhe o slot.

2. **Annotation labels** (`wordWrapWidth: 70`, `fontSize: 9`) comportam ~10-11
   caracteres por linha antes de quebrar. Os nomes de peca abaixo respeitam esse
   limite. O micro-beat de instalacao vai em slot separado (overlay/modal).

3. **Derrota no FieldControlScene**: o overlay atual mostra `'falhou'` em grande
   e nenhum texto de Myco. Os 3 microtextos de derrota sao candidatos ao slot
   `sub` (que hoje existe so na vitoria). O botao `'SAIR'` ja existe como
   `'✕ SAIR'` — as alternativas abaixo substituem so a label, sem o `✕`.

4. **Limite de caracteres para 480px** (painel `HubRocketPanel`, o mais estreito
   com texto de corpo): `fontSize: 9`, `wordWrapWidth` da area util (~328px)
   comporta ~55 caracteres por linha sem quebra forcada. Usado como limite
   conservador para todos os slots neste documento.

   | Slot                             | Limite seguro | Limite absoluto |
   |----------------------------------|---------------|-----------------|
   | `RocketLaunchOverlay` title      | 20 chars      | 26 chars        |
   | `RocketLaunchOverlay` flavor     | 55 chars/linha| 80 chars        |
   | `HubRocketPanel` subtitle        | 55 chars      | 65 chars        |
   | Annotation label (nome de peca)  | 12 chars      | 16 chars (wrap) |
   | Micro-beat de instalacao         | 80 chars/linha| 100 chars       |
   | Derrota sub (FieldControlScene)  | 45 chars      | 60 chars        |
   | Botao SAIR                       | 12 chars      | 16 chars        |

---

## Secao 1 — Sequencia de Lancamento e Tela de Vitoria

### 1.1 Tres Beats de Lancamento

Contexto: animacao do foguete subindo. Textos aparecem progressivamente —
um por etapa. Tom: Myco relatando o experimento em tempo real, sem drama.

**Beat 1 — Ignicao** (aparece no disparo, ~0–1.2s)

```
"Ignicao confirmada. A fermentacao esta funcionando."
```

Caracteres: 50. Slot: subtitle ou overlay de transicao.

---

**Beat 2 — Subida** (aparece durante ascensao, ~1.2–3s)

```
"Estrutura integra. Ela esta subindo do jeito que o micelho previa."
```

Caracteres: 66. Slot: subtitle progressivo.
Nota ortografica: "micélio" com acento no codigo se o encoding suportar;
usar "micelho" apenas se o fonte nao renderizar acentos corretamente.

---

**Beat 3 — Orbita** (aparece na estabilizacao, ~3s+)

```
"Orbita baixa. Chegamos."
```

Caracteres: 24. Slot: subtitle final antes da tela de vitoria.
Intencional: a linha mais curta — o peso esta no silencio depois dela.

---

### 1.2 Headline da Tela de Vitoria

Slot: `title` em `RocketLaunchOverlay` (atual: `'DECOLAGEM'`, fontSize 26).

```
GERMINACAO
```

Caracteres: 10. Justificativa: "decolagem" e vocabulario de engenharia
convencional. "Germinacao" e vocabulario de Myco — e o que o foguete fez
na voz dele. Impacto visual identico (letras maiusculas, letterSpacing: 3).

---

### 1.3 Fala de Vitoria

Slot: `flavor` em `RocketLaunchOverlay` (atual: texto italico em ciano,
fontSize 11, wordWrapWidth 304px).

```
Dr. Myco: "Nao era um foguete. Era uma semente. Ela encontrou solo."
```

Caracteres: 66 (linha unica, sem quebra necessaria).
Tom: conclusao tranquila de experimento bem-sucedido. Nao e celebracao —
e constatacao. A emocao esta no que ele nao diz.

---

### 1.4 Botao "Novo Ciclo"

Slot: `PixiButton` label (atual: `'Novo Ciclo'`).

```
Novo Ciclo
```

Manter exatamente como esta. Justificativa: "ciclo" e vocabulario biologico
e correto para Myco. Alterar seria ruido sem ganho narrativo. Status: APROVADO
sem modificacao.

---

## Secao 2 — Nomes de Peca do Foguete (ROCKET_RECIPE) e Micro-beat de Instalacao

### 2.1 Nomes das Pecas — Annotation Labels

Os nomes abaixo substituem os valores do campo `name` em `ROCKET_RECIPE`.
Cada nome foi escrito para caber em `wordWrapWidth: 70` (fontSize 9), o que
comporta ~10-11 chars por linha. Nomes mais longos quebram em duas linhas
curtas — isso e aceitavel e foi testado contra a geometria do painel.

| Indice | Nome atual          | Nome novo             | Chars | Quebra? |
|--------|---------------------|-----------------------|-------|---------|
| 0      | Base Estrutural     | Raiz-Ancora           | 11    | Nao     |
| 1      | Motor Principal     | Camara Viva           | 11    | Nao     |
| 2      | Processador         | Nucleo Logico         | 13    | Sim (2) |
| 3      | Revestimento        | Casca Adaptada        | 14    | Sim (2) |
| 4      | Rede Neural         | Rede de Esporo        | 14    | Sim (2) |
| 5      | Sistema Vital       | Bolsao Vital          | 12    | Nao     |
| 6      | Blindagem Externa   | Blindagem Organica    | 18    | Sim (2) |
| 7      | Ignição Final       | Ignição Final         | 13    | Sim (2) |

Nota sobre Ignição Final: manter o nome original. E o clímax mecanico e
o nome ja carrega peso narrativo correto — "Ignição" e vocabulario de
Myco (processo quimico), "Final" e autoexplicativo. Alterar seria
substituir algo que ja funciona.

Nota sobre ResourceKey: os nomes de peca sao player-facing (display).
As chaves internas (`scrap`, `nucleo_logico`, etc.) nao mudam — apenas o
campo `name` de cada entrada em `ROCKET_RECIPE`.

---

### 2.2 Micro-beat de Instalacao (por peca)

Contexto: overlay ou modal ao instalar cada peca. Uma linha (ou linha + sub).
Tom: Myco constatando o que aconteceu — descoberta, nao comemoração.
Limite: 80 chars por linha, 100 chars absoluto.

**Peca 0 — Raiz-Ancora** (`Base Estrutural`, scrap: 3)

```
"Enraizou. Agora o foguete sabe onde esta o chao."
```
Chars: 50. O primeiro contato com o solo e fundamental — Myco usa raiz.

---

**Peca 1 — Camara Viva** (`Motor Principal`, combustivel_volatil: 3)

```
"A camara de fermentacao esta ativa. Ela ja respira."
```
Chars: 52. Propulsao por fermentacao — o motor e um orgao, nao uma maquina.

---

**Peca 2 — Nucleo Logico** (`Processador`, nucleo_logico: 2)

```
"Conexoes estabelecidas. O foguete comecou a pensar."
```
Chars: 52. Vocabulario neutro — Myco nao diz "IA", diz "conexoes".

---

**Peca 3 — Casca Adaptada** (`Revestimento`, fragmentos_estruturais: 3, scrap: 2)

```
"Casca integrada. Resistencia melhor que qualquer composto sintetico."
```
Chars: 69. Referencia ao HUB_04 canonico — a casca ja foi mencionada antes.

---

**Peca 4 — Rede de Esporo** (`Rede Neural`, ai_components: 4, sinais_controle: 20)

```
"A rede propagou. Cada no conversa com o outro — como um micelho saudavel."
```
Chars: 74. "Propagou" e verbo canonico de Myco. A analogia com micélio é direta.

---

**Peca 5 — Bolsao Vital** (`Sistema Vital`, biomassa_adaptativa: 6, combustivel_volatil: 2)

```
"Sistemas vitais respondem. Ele vai sobreviver la fora."
```
Chars: 54. Tom: diagnostico medico, nao celebracao. "La fora" = espaco.

---

**Peca 6 — Blindagem Organica** (`Blindagem Externa`, fragmentos_estruturais: 3, ai_components: 3)

```
"Blindagem fundida. A casca exterior cresceu junto com o nucleo."
```
Chars: 63. "Cresceu" em vez de "foi instalada" — vocabulario de Myco.

---

**Peca 7 — Ignição Final** (`Ignição Final`, scrap: 2, nucleo_logico: 1, sinais_controle: 30, biomassa_adaptativa: 4)

```
"Ignição carregada. Agora so falta plantar ela no ceu."
```
Chars: 53. "Plantar no ceu" e a metafora central do jogo — aparece aqui
pela primeira vez em voz de Myco, preparando a fala de vitoria.

---

## Secao 3 — Microtextos de Derrota e Botao SAIR

### 3.1 Tres Variantes de Derrota

Contexto: slot `sub` no `showEndOverlay()` do `FieldControlScene`, visivel
abaixo do texto `'falhou'` em vermelho. Tom: diagnostico, nao consolacao.
Sem melodrama. Limite: 45 chars (fontSize 18, full-width).

O programador escolhe uma das tres versoes — ou implementa rotacao aleatoria.

**DEFEAT_A** (recomendada para uso padrao)

```
"Dados registrados. O proximo desenho vai ser mais exato."
```
Chars: 57. Nota: excede 45 chars — requer fontSize 14 ou wordWrap.
Versao curta se o slot nao comportar:
```
"O proximo desenho vai ser mais exato."
```
Chars: 38. Cabe em fontSize 18 sem quebra.

---

**DEFEAT_B** (variante para derrota rapida / sem sinais coletados)

```
"Crescimento insuficiente. O substrato pede mais tempo."
```
Chars: 54. Versao curta:
```
"O substrato pede mais tempo."
```
Chars: 29.

---

**DEFEAT_C** (variante para derrota com muitos inimigos / squad zerado)

```
"A zona resistiu. Isso e um dado, nao um veredicto."
```
Chars: 51. Versao curta:
```
"Isso e um dado, nao um veredicto."
```
Chars: 34.

---

### 3.2 Botao SAIR

Slot: label do `quitBtn` em `FieldControlScene` (atual: `'✕ SAIR'`).

**Opcao A — manter o atual**
```
✕ SAIR
```
Funciona. O `✕` ja comunica "fechar/encerrar" sem palavras extras.
Status: APROVADO sem modificacao se o time preferir consistencia.

**Opcao B — voz de Myco**
```
Voltar ao bunker
```
Chars: 16. Tom: nao e derrota, e retorno. Consistent com a voz de Myco
que nao usa linguagem de videogame ("sair" tem conotacao de quit).
Requer ajuste de largura do botao se o atual for muito estreito.

**Opcao C — compacta com voz**
```
Retornar
```
Chars: 8. Neutro, sem jargao, cabe em qualquer botao.

Recomendacao do Writer: Opcao B se o botao comportar, Opcao C se nao.
Decisao final com o programador/game-designer.

---

## Secao 4 — Checklist de Aprovacao

Todas as linhas foram verificadas contra:

- [x] Soa como descoberta, nao declaracao ensaiada
- [x] Tem elemento botanico/micologico direto ou metaforico
- [x] Termina na afirmacao (nao na duvida)
- [x] Evita termos proibidos (impossivel, talvez, infelizmente, etc.)
- [x] Nao menciona "A IA nos destruiu" nem cliche de apocalipse
- [x] Tragedia, quando presente, e nomeada com precisao e seguida de movimento
- [x] Legivel por ator de voz com emocao clara
- [x] Seria estranha dita por qualquer outro personagem do bunker

---

## Apendice — Copy Copiavel para o Codigo

Bloco consolidado para copiar direto nos arquivos:

### RocketLaunchOverlay.ts

```typescript
// title (substitui 'DECOLAGEM')
text: 'GERMINACAO'

// flavor (substitui a fala atual)
text: 'Dr. Myco: "Nao era um foguete. Era uma semente. Ela encontrou solo."'

// Novo Ciclo button — manter como esta
label: 'Novo Ciclo'
```

### HubRocketPanel.ts — beats de lancamento (subtitle progressivo)

```typescript
// Beat 1 — ignicao (~0s)
'Dr. Myco: "Ignicao confirmada. A fermentacao esta funcionando."'

// Beat 2 — subida (~1.2s)
'Dr. Myco: "Estrutura integra. Ela esta subindo do jeito que o micelho previa."'

// Beat 3 — orbita (~3s)
'Dr. Myco: "Orbita baixa. Chegamos."'

// subtitle estatico (painel fechado, foguete incompleto — manter ou usar):
'Dr. Myco: "Foguete? Nao. Semente."'
// (o atual ja esta correto — nao alterar)
```

### HubState.ts — ROCKET_RECIPE names

```typescript
export const ROCKET_RECIPE: RocketRecipe[] = [
  { name: 'Raiz-Ancora',         scrap: 3 },
  { name: 'Camara Viva',         combustivel_volatil: 3 },
  { name: 'Nucleo Logico',       nucleo_logico: 2 },
  { name: 'Casca Adaptada',      fragmentos_estruturais: 3, scrap: 2 },
  { name: 'Rede de Esporo',      ai_components: 4, sinais_controle: 20 },
  { name: 'Bolsao Vital',        biomassa_adaptativa: 6, combustivel_volatil: 2 },
  { name: 'Blindagem Organica',  fragmentos_estruturais: 3, ai_components: 3 },
  { name: 'Ignicao Final',       scrap: 2, nucleo_logico: 1, sinais_controle: 30, biomassa_adaptativa: 4 },
];
```

### HubState.ts — micro-beats de instalacao (por indice de peca)

```typescript
// Indexado por ROCKET_RECIPE index (0–7)
export const PIECE_INSTALL_BEAT: string[] = [
  '"Enraizou. Agora o foguete sabe onde esta o chao."',
  '"A camara de fermentacao esta ativa. Ela ja respira."',
  '"Conexoes estabelecidas. O foguete comecou a pensar."',
  '"Casca integrada. Resistencia melhor que qualquer composto sintetico."',
  '"A rede propagou. Cada no conversa com o outro — como um micelho saudavel."',
  '"Sistemas vitais respondem. Ele vai sobreviver la fora."',
  '"Blindagem fundida. A casca exterior cresceu junto com o nucleo."',
  '"Ignicao carregada. Agora so falta plantar ela no ceu."',
];
```

### FieldControlScene.ts — derrota e botao

```typescript
// sub text (derrota — escolher uma ou rotacionar)
// DEFEAT_A (recomendada):
text: 'O proximo desenho vai ser mais exato.'
// DEFEAT_B:
text: 'O substrato pede mais tempo.'
// DEFEAT_C:
text: 'Isso e um dado, nao um veredicto.'

// quitBtn label (opcao B — requer botao mais largo):
label: 'Voltar ao bunker'
// quitBtn label (opcao C — cabe em botao estreito):
label: 'Retornar'
```
