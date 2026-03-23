# O Doutor — Character Design Document

**Version**: 1.0
**Date**: 2026-03-21
**Status**: Draft — Brainstorm Aprovado

---

## 1. Overview

O Doutor é o protagonista controlado pelo jogador em todas as zonas. PhD em Botânica, lidera os últimos humanos por convicção irracional de que um foguete artesanal vai salvar a humanidade — o único que acredita no plano desde o início.

---

## 2. Player Fantasy

- Você é o cientista mais improvável do apocalipse — sem habilidades certas, sem recursos certos, sem crédito
- Cada run bem-sucedida prova que teimosia e botânica são, surpreendentemente, úteis em campo de batalha

---

## 3. Personalidade

### Tom geral
- Energético, entusiasmado, sincero sobre coisas objetivamente absurdas
- Humor vem do contraste entre a energia dele e o absurdo da situação — não de piadas intencionais

### Exemplos de voz
> "ENCONTREI! Olha isso! Se a gente conectar AQUI com AQUILO — espera, preciso de uma caneta—"

> "Esse drone tem o mesmo padrão de movimento de um fungo Ophiocordyceps. Sei exatamente o que fazer."

> "O foguete VAI funcionar. Sim, eu sei que é feito de latas e esperança. Isso é irrelevante."

### Relação com os outros personagens
- **Cínico Experiente**: ignora o ceticismo com entusiasmo genuíno
- **Cientista Rival**: discorda tecnicamente, respeita a competência
- **Adolescente Hacker**: trata como igual intelectual (para irritação do adolescente)
- **Ex-Militar**: aceita a estrutura dela mas nunca segue à risca
- **Criança Prodígio**: o único que não a trata como criança

### PhD em Botânica
- Usa analogias de fungos, plantas e fotossíntese para mecânicas de combate, stealth e engenharia
- Sempre com convicção total, nunca com ironia

---

## 4. Visual

### Referências Visuais Aprovadas

- **Ref. A — Cientista Maluco Cartoon (mobile)**: Exagero expressivo total. Modelo de energia e expressividade — humor vem do rosto.
- **Ref. B — Chibi Mad Scientist**: Cabelo branco cacheado explosivo, grin com dentes, jaleco longo, clipboard com equações. Proporções chibi com personalidade adulta.
- **Ref. C — Anime Scientist**: Jaleco azul-gelo/menta longo, óculos retangulares modernos, postura confiante-dinâmica. "Cool que não percebe que é cool."
- **Ref. D — Professora de Herbologia**: Plantas como identidade visual — terra nos dedos, ervas nos bolsos, integradas ao personagem.

**Síntese**: Cientista chibi (B) com energia de cartoon (A) + jaleco longo sujo de terra (C) + plantas como identidade (D).

### Forma Base
- **Silhueta**: oval/círculo — orgânico vs angular das IAs
- **Destaque principal**: cabelo branco selvagem e cacheado, visível à distância
- **Destaque secundário**: óculos redondos enormes
- **Detalhe narrativo**: planta brotando do bolso do peito — sempre visível, cresce com o jogo

### O Jaleco
Jaleco de **campo**, não de laboratório — comprido, amarrotado, cheio de bolsos. Manchas:
- Terra marrom nos cotovelos e punhos
- Verde musgo nas lapelas
- Queimadura laranja no lado esquerdo
- Remendos de cores diferentes

### As Plantas (parte do visual base, não item de missão)
- Bolso do peito: muda pequena brotando
- Bolso lateral esquerdo: folhas de erva saindo pela borda
- Bolso direito: bulbo de raiz + tubo de ensaio com líquido verde
- Cabelo: uma folha presa que ele não percebeu

### Paleta

| Elemento | Cor | Nota |
|---|---|---|
| Jaleco base | Branco-creme (#F0EAD6) | Nunca branco puro |
| Manchas de terra | Marrom-terra (#7A4A1E) | Cotovelos, punhos |
| Manchas de planta | Verde musgo (#5C7A3E) | Lapelas, bolsos |
| Queimadura | Laranja escuro (#C4622D) | Lado esquerdo, pequena |
| Remendo | Bege-tijolo (#B8956A) | Ombro direito |
| Cabelo | Branco-acinzentado (#E8E8E0) | Selvagem, explosivo |
| Pele | Bege-rosado (#F5CBA7) | Moreno claro |
| Óculos | Dourado envelhecido (#C8A84B) | Dois aros circulares enormes |
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
- **Idle**: cabeça levemente inclinada; olhos piscam ligeiramente assíncronos
- **Movimento**: corpo inclinado para frente — entusiasmo na corrida
- **Coleta**: gesto de "ACHEI!" — braço sobe, muda no bolso balança
- **Parado (Stealth)**: imóvel — muda no bolso continua crescendo suavemente
- **Detectado (Stealth)**: pausa dramática 0.2s, olhos arregalam, sprint
- **Retorno ao hub**: entra pela escotilha segurando o coletado; planta visivelmente maior que na saída

---

## 5. Detailed Rules

### 5.1 Input
- **Único input**: arrastar o dedo — o Doutor segue o dedo
- Sem botões de ação, sem habilidades manuais
- Válido em todas as zonas sem exceção

### 5.2 Stats Base (Baseline de Balanceamento)

| Stat | Valor | Notas |
|---|---|---|
| HP | 100 | Referência para balancear aliados |
| Velocidade máxima | 200 px/s | Referência de movimento |
| Raio de coleta | 40px | Coleta ao se aproximar |
| Raio de som (stealth) | Proporcional à velocidade | Ver zone-stealth.md |

### 5.3 Passiva
**Nenhuma.** O Doutor é o ponto zero de equilíbrio — habilidades passivas pertencem aos aliados.

### 5.4 Comportamento por Zona

| Zona | Diferença |
|---|---|
| **Hordas** | Lidera a formação; aliados orbitam ao redor |
| **Stealth** | Solo — sem squad. Stats idênticos. A tensão vem do ambiente. |
| **Outras zonas** | Stats sempre os mesmos — design da zona cria a experiência |

---

## 6. Formulas

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
| Doutor morre com aliados vivos | Run falha — jogador é o Doutor, não o squad |
| Squad selecionado para Zona Stealth | Seleção de squad desabilitada para esta zona |
| HP do Doutor chega a 0 em perseguição (Stealth) | Game over imediato — sem graça de último segundo |

---

## 8. Dependencies

| Sistema | Relação |
|---|---|
| **Todas as zonas** | O Doutor é o personagem jogável em todas |
| **Sistema de Squad** | O Doutor é sempre o líder; aliados orbitam ao redor |
| **Hub** | O Doutor interage com NPCs e recebe missões |
| **Sistema de Confiança** | A confiança dos personagens é com o Doutor especificamente |
| **Foguete** | O Doutor é a âncora narrativa do plano do foguete |

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
- [ ] Silhueta distinguível de aliados e inimigos em 375px de largura
- [ ] Na Zona Stealth, opção de levar squad desabilitada com feedback claro
- [ ] Morte do Doutor sempre termina a run, independente de aliados vivos
- [ ] Animação de coleta de recurso legível em tela mobile sem ser intrusiva

---

*Relacionado: `design/gdd/hub-and-characters.md`, `design/gdd/mvp-game-brief.md`, `design/gdd/zone-stealth.md`*
