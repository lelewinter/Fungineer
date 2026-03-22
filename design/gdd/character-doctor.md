# O Doutor — Character Design Document

**Version**: 1.0
**Date**: 2026-03-21
**Status**: Draft — Brainstorm Aprovado

---

## 1. Overview

O Doutor é o protagonista de Orbs — o personagem controlado pelo jogador em todas
as zonas. PhD em Botânica, lidera os últimos humanos não por autoridade, mas por
pura convicção irracional de que um foguete artesanal vai salvar a humanidade do
apocalipse das IAs. É o único que acredita no plano desde o início.

---

## 2. Player Fantasy

Você é o cientista mais improvável e mais determinado do apocalipse. Não tem as
habilidades certas, não tem os recursos certos, e ninguém acredita em você — exceto
você mesmo. Cada run bem-sucedida é uma prova de que teimosia e botânica são,
surpreendentemente, úteis em campo de batalha.

---

## 3. Personalidade

### Tom geral
Energético, entusiasmado, genuinamente sério sobre coisas objetivamente absurdas.
Não é cômica porque ele tenta ser engraçado — é cômica porque ele é completamente
sincero. O humor vem do contraste entre a energia dele e o absurdo da situação.

### Exemplos de voz
> "ENCONTREI! Olha isso! Se a gente conectar AQUI com AQUILO — espera, preciso
> de uma caneta—"

> "Esse drone tem o mesmo padrão de movimento de um fungo Ophiocordyceps. Sei
> exatamente o que fazer."

> "O foguete VAI funcionar. Sim, eu sei que é feito de latas e esperança.
> Isso é irrelevante."

### Relação com os outros personagens
- Com o **Cínico Experiente**: ignora o ceticismo com entusiasmo genuíno
- Com a **Cientista Rival**: discorda tecnicamente mas respeita a competência
- Com o **Adolescente Hacker**: trata como igual intelectual (para irritação do adolescente)
- Com a **Ex-Militar**: aceita a estrutura dela mas nunca segue à risca
- Com a **Criança Prodígio**: o único que não a trata como criança

### PhD em Botânica
A formação em botânica é uma piada recorrente — ele usa analogias de fungos,
plantas e fotossíntese para explicar mecânicas de combate, stealth e engenharia.
Nunca com ironia. Sempre convicto.

> "A Zona Stealth funciona como um bosque à noite. Movimento lento, sem barulho.
> Os caçadores — IA ou coruja — respondem a estímulos. Básico."

---

## 4. Visual

### Referências Visuais Aprovadas

Quatro referências definem o visual do Doutor:

**Ref. A — Cientista Maluco Cartoon (mobile)**: Exagero expressivo total. Olho enorme com lupa, sorriso histérico de orelha a orelha, cabelo louco, jaleco. O nível de energia e expressividade que o Doutor deve ter. O humor vem do rosto, não da situação.

**Ref. B — Chibi Mad Scientist (sketch)**: Cabelo branco cacheado e explosivo, grin com dentes mostrando, jaleco longo sobre roupas casuais, segurando clipboard com equações garatujadas. Proporções chibi com personalidade adulta — esse é o equilíbrio certo para mobile.

**Ref. C — Anime Scientist (doctor cool)**: Jaleco azul-gelo/menta mais longo, óculos retangulares modernos, postura confiante-dinâmica. Elemento de "cool que não percebe que é cool" — o Doutor não sabe que é impressionante.

**Ref. D — Professora de Herbologia (Hogwarts Legacy)**: O elemento botânico. Plantas, flores e folhas como parte do visual da pessoa — não como acessório, como identidade. Terra nos dedos. Ervas saindo de bolsos. A sensação de que as plantas fazem parte dele tanto quanto o jaleco.

**A síntese**: Cientista chibi (B) com energia de cartoon (A) + jaleco longo sujo de terra (C) + plantas como identidade visual (D).

---

### Forma Base
- **Silhueta**: oval/círculo como forma dominante — orgânico vs o angular das IAs
- **Destaque principal**: cabelo branco selvagem e cacheado, explodindo para os lados — visível à distância
- **Destaque secundário**: óculos redondos enormes — os dois círculos que identificam o personagem
- **Detalhe narrativo**: planta brotando do bolso do peito do jaleco — sempre visível, cresce com o jogo

### O Jaleco
Não é jaleco de laboratório — é jaleco de **campo**. Comprido, amarrotado, cheio de bolsos. Manchas de:
- Terra marrom nos cotovelos e punhos (ele se apoia no chão para examinar amostras)
- Verde musgo nas lapelas (extratos de planta)
- Uma queimadura laranja no lado esquerdo (experimento que não deu certo)
- Rementos de cores diferentes — consertou ele mesmo

### As Plantas
O Doutor literalmente carrega plantas. São parte do visual base, não item de missão:
- **Bolso do peito**: muda pequena brotando (crescida no bunker, vai com ele em campo)
- **Bolso lateral esquerdo**: folhas de alguma erva saindo pela borda
- **Bolso direito**: bulbo de raiz visível + algum tubo de ensaio com líquido verde
- **Cabelo**: uma folha pequena presa no cabelo que ele não percebeu

### Paleta

| Elemento | Cor | Nota |
|---|---|---|
| Jaleco base | Branco-creme (#F0EAD6) | Nunca branco puro — sempre sujo |
| Manchas de terra | Marrom-terra (#7A4A1E) | Cotovelos, punhos |
| Manchas de planta | Verde musgo (#5C7A3E) | Lapelas, bolsos |
| Queimadura | Laranja escuro (#C4622D) | Lado esquerdo, pequena |
| Remendo | Bege-tijolo (#B8956A) | Ombro direito |
| Cabelo | Branco-acinzentado (#E8E8E0) | Selvagem, explosivo |
| Pele | Bege-rosado (#F5CBA7) | Moreno claro |
| Óculos | Dourado envelhecido (#C8A84B) | Duas aros circulares enormes |
| Plantas | Verde vivo (#4CAF50) com variações | Contraste com jaleco sujo |

### Referência de Silhueta (top-down, 64px)
```
      ~~~∿∿~~~       ← cabelo explodindo
     ( O   O )       ← óculos enormes
    (  _smile_ )     ← rosto oval, sorriso
   /| jaleco  |\
  / | [🌱][🌿]|  \   ← muda + folhas nos bolsos
 /  |_________|  \
    |   |   |      ← manchas de terra
    ⌣         ⌣    ← pernas
```

### Animações-chave
- **Idle**: cabeça levemente inclinada, como se estivesse pensando — olhos piscam de forma ligeiramente assíncrona
- **Movimento**: corpo levemente inclinado para frente — entusiasmo na corrida
- **Coleta de recurso**: gesto de "ACHEI!" — braço sobe, muda no bolso balança
- **Parado (Stealth)**: absolutamente imóvel — mas a muda no bolso continua crescendo suavemente (detalhe sutil)
- **Detectado (Stealth)**: pausa dramática de 0.2s, olhos arregalam, depois sprint
- **Retorno ao hub**: entra pela escotilha segurando o que coletou — e a planta no bolso está visivelmente maior do que quando saiu

---

## 5. Detailed Rules

### 5.1 Input
- **Único input**: arrastar o dedo na tela — o Doutor segue o dedo
- Sem botões de ação, sem habilidades ativadas manualmente
- Válido em todas as zonas sem exceção

### 5.2 Stats Base (Baseline de Balanceamento)
| Stat | Valor | Notas |
|---|---|---|
| HP | 100 | Referência para balancear aliados |
| Velocidade máxima | 200 px/s | Referência de movimento |
| Raio de coleta | 40px | Coleta automática ao se aproximar |
| Raio de som (stealth) | Proporcional à velocidade | Ver zone-stealth.md |

### 5.3 Passiva
**Nenhuma.** O Doutor é o ponto zero de equilíbrio. As habilidades passivas
pertencem aos aliados. Isso facilita calibrar o sistema inteiro.

### 5.4 Comportamento por Zona
| Zona | Diferença |
|---|---|
| **Hordas** | Lidera a formação; aliados orbitam ao redor |
| **Stealth** | Solo — sem squad. Stats idênticos. A tensão vem do ambiente. |
| **Outras zonas** | Stats sempre os mesmos — design da zona cria a experiência |

---

## 6. Formulas

O Doutor é o baseline — suas fórmulas são referência para os aliados:

```
HP_aliado = HP_doutor × fator_aliado
  Guardian:  200 HP = 100 × 2.0
  Striker:   120 HP = 100 × 1.2
  Medic:      80 HP = 100 × 0.8

velocidade_aliado = velocidade_doutor × fator_vel
  (a definir por aliado no balanceamento)
```

---

## 7. Edge Cases

| Situação | Comportamento |
|---|---|
| Doutor morre com aliados vivos | Run falha — o jogador é o Doutor, não o squad |
| Doutor tenta ir em run com squad na Zona Stealth | Zona Stealth é sempre solo — seleção de squad desabilitada para esta zona |
| HP do Doutor chega a 0 em perseguição (Stealth) | Game over imediato — sem graça de último segundo |

---

## 8. Dependencies

| Sistema | Relação |
|---|---|
| **Todas as zonas** | O Doutor é o personagem jogável em todas |
| **Sistema de Squad** | O Doutor é sempre o líder; aliados orbitam ao redor |
| **Hub** | O Doutor é quem interage com NPCs e recebe missões |
| **Sistema de Confiança** | A confiança dos personagens é com o Doutor especificamente |
| **Foguete** | O Doutor é o único que acredita no foguete desde o início — âncora narrativa |

---

## Tuning Knobs

| Parâmetro | Valor Base | Range Seguro | Efeito |
|---|---|---|---|
| `hp_doutor` | 100 | 80–120 | Baseline de HP de todo o sistema |
| `velocidade_max` | 200 px/s | 160–240 px/s | Baseline de velocidade |
| `raio_coleta` | 40px | 30–60px | Quão fácil é pegar recursos |

---

## Acceptance Criteria

- [ ] O Doutor responde ao toque sem delay perceptível (< 1 frame de latência)
- [ ] A silhueta do Doutor é distinguível dos aliados e inimigos em 375px de largura
- [ ] Na Zona Stealth, a opção de levar squad está desabilitada com feedback claro
- [ ] Morte do Doutor sempre termina a run, independente de aliados vivos
- [ ] Animação de coleta de recurso é legível em tela mobile sem ser intrusiva

---

*Relacionado: `design/gdd/hub-and-characters.md`, `design/gdd/mvp-game-brief.md`, `design/gdd/zone-stealth.md`*
