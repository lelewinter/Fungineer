# Cowork → Claude Code Inbox

> Arquivo de comunicação entre Cowork (Claude no desktop) e Claude Code.

---

## Status
DONE

## Tarefa

### Task C0101 — [CORREÇÃO] As salas do andar 1 (Infecção, Labirinto, Circuito) não exibem o botão RAID. A altura das ZoneRoom nesse andar está menor que nos outros dois. Garantir que todas as ZoneRoom tenham altura mínima igual e que o botão RAID seja visível em todas as salas dos 3 andares. Verificar via custom_minimum_size ou size_flags no VBoxContainer/HBoxContainer.

**Tela afetada:** WorldMapScene
**Descrição completa:** [CORREÇÃO] As salas do andar 1 (Infecção, Labirinto, Circuito) não exibem o botão RAID. A altura das ZoneRoom nesse andar está menor que nos outros dois. Garantir que todas as ZoneRoom tenham altura mínima igual e que o botão RAID seja visível em todas as salas dos 3 andares. Verificar via custom_minimum_size ou size_flags no VBoxContainer/HBoxContainer.
**Como verificar:** Abrir o jogo → WorldMapScene → todas as 9 salas exibem o botão RAID, incluindo Infecção, Labirinto e Circuito no andar inferior.


⚠️ ESTA É A TASK 10/10 DO BATCH 1.
Após implementar, faça commit e push com a mensagem:
```
feat: batch 1 — 10 tasks implementadas

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```


Implemente a mudança acima. Siga os padrões do projeto (GDScript, snake_case, data-driven).

## Resultado

Corrigido o problema de altura das ZoneRoom no andar 1 (Infecção, Labirinto, Circuito):

1. **ZoneRoom.tscn** — adicionado `custom_minimum_size = Vector2(0, 120)` ao PanelContainer raiz, garantindo que toda instância de ZoneRoom tenha altura mínima suficiente para exibir o botão RAID.

2. **WorldMapScene.gd** — nos painéis de sala (Control criado por código):
   - Adicionado `size_flags_vertical = Control.SIZE_EXPAND_FILL` para garantir que o painel se expanda verticalmente dentro do HBoxContainer do andar.
   - Adicionado `custom_minimum_size = Vector2(0.0, 120.0)` para impor altura mínima igual em todas as salas dos 3 andares.

Resultado: todas as 9 salas exibem o botão RAID com altura mínima consistente.

## Histórico

- **2026-03-29** — Task C0101 concluída: corrigida altura das ZoneRoom no andar 1. Adicionado `custom_minimum_size = Vector2(0, 120)` em ZoneRoom.tscn e `size_flags_vertical = SIZE_EXPAND_FILL` + `custom_minimum_size` nos panels em WorldMapScene.gd. Commit: "feat: batch 1 — 10 tasks implementadas".
