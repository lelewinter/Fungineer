# Playtest Checklist — Sprint 01

**Data**: 2026-03-21
**Versão**: 0.1.0-sprint01
**Objetivo**: Validar os 3 pilares do core loop

---

## Setup de cada sessão

- [ ] Abrir Godot 4.6, rodar Main.tscn
- [ ] Anotar: hora de início, dispositivo, modo (desktop/touch)
- [ ] Cronometrar duração real da run do início ao fim (Game Over ou Victory)

---

## Pilar 1 — Drag feel

| Teste | Esperado | Observado | OK? |
|---|---|---|---|
| Arrastar o dedo/mouse — personagens seguem com suavidade | Movimento fluido, sem travamento | | |
| Parar o drag — party desacelera, não congela abruptamente | Lerp natural até o destino | | |
| Movimento rápido para esquivar de projétil | Reação ≤ 100ms visualmente | | |
| Party não sai da arena | Clamped nas bordas | | |
| Desktop e touch produzem a mesma sensação | Comportamento idêntico | | |

**Notas de feel**:
_____________________________________

---

## Pilar 2 — Legibilidade da party

| Teste | Esperado | Observado | OK? |
|---|---|---|---|
| 2 personagens — dá pra distinguir Guardian de Striker? | Cores distintas (azul vs ciano) | | |
| HP bars são legíveis durante o combate? | Atualizam visivelmente em tempo real | | |
| Quando um personagem morre, fica claro visualmente? | Desaparece + HP bar fica cinza | | |
| Com 2 personagens em tela, os inimigos são legíveis? | Enemies não se confundem com party | | |
| Ataque automático é visível? | Algum feedback (flash, partícula) de dano | | |

**Notas de legibilidade**:
_____________________________________

---

## Pilar 3 — Impacto dos poderes

### Siege Mode

| Teste | Esperado | Observado | OK? |
|---|---|---|---|
| Ficar parado 1.5s: inimigos morrem mais rápido? | DPS claramente maior | | |
| Indicador "SIEGE MODE" aparece na HUD? | Label amarelo visível | | |
| Mover cancela Siege Mode instantaneamente? | Label desaparece ao mover | | |
| Decisão de ficar parado vs. mover é real? | Há tensão entre os dois | | |
| Matar uma wave com Siege Mode vs. sem: diferença notável? | Sim, claramente mais rápido | | |

**Notas de Siege Mode**:
_____________________________________

---

## Métricas de run

| Sessão | Duração | Resultado | Wave chegada | Boss chegou? |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |

**Duração média**: _____
**Target**: 90–150s
**Status**: PASS / FAIL

---

## Boss: Sentinel Core

| Teste | Esperado | Observado | OK? |
|---|---|---|---|
| Boss aparece ao completar as waves ou em 90s | Spawn no tempo certo | | |
| Dash do boss é legível? (sabe que vai dashar?) | Visual de intenção antes do dash | | |
| Janela de vulnerabilidade é clara? | Cor/estado muda visivelmente | | |
| Boss muda o feel da run? | Sente diferente de combate normal | | |
| Run não dura >150s mesmo com boss? | Boss morre ou mata party em tempo | | |

**Notas do boss**:
_____________________________________

---

## Problemas críticos (bloqueiam sprint 2)

Liste aqui qualquer problema que impeça de passar para o próximo sprint:

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

---

## Cortes recomendados antes de escalar conteúdo

Com base no playtest, riscar o que não funcionou e não deve ser expandido ainda:

- [ ] Siege Mode funciona → adicionar 2º poder no sprint 2
- [ ] Boss funciona → adicionar fase extra no sprint 2
- [ ] 2 chars legíveis → testar com 3-4 chars no sprint 2
- [ ] Drag feel aprovado → não mexer no DragController no sprint 2

**O que foi descartado** (explique por que):
_____________________________________

---

## Próximos passos sugeridos para Sprint 2

(Preencher após playtest)

- [ ] _______________________________________________
- [ ] _______________________________________________
- [ ] _______________________________________________
