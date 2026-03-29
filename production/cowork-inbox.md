# Cowork → Claude Code Inbox

> Arquivo de comunicação entre Cowork (Claude no desktop) e Claude Code.

---

## Status
PENDING

## Tarefa

### Task 005 — Em ZoneRoom.gd, conectar o sinal pressed do Button RAID para emitir sinal raid_requested(zone_name: String). WorldMapScene.gd escuta esse sinal de todas as instâncias e armazena a zona selecionada em uma variável _pending_zone.

**Tela afetada:** WorldMapScene
**Descrição completa:** Em ZoneRoom.gd, conectar o sinal pressed do Button RAID para emitir sinal raid_requested(zone_name: String). WorldMapScene.gd escuta esse sinal de todas as instâncias e armazena a zona selecionada em uma variável _pending_zone.
**Como verificar:** Ao tocar no botão RAID de qualquer sala, o sinal é emitido e _pending_zone é atualizado com o nome correto da zona (verificável via print no output do Godot).

⚠️ NÃO commite ainda. Task 5/10 do batch 1.

Implemente a mudança acima. Siga os padrões do projeto (GDScript, snake_case, data-driven).
