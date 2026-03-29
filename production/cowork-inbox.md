# Cowork → Claude Code Inbox

> Arquivo de comunicação entre Cowork (Claude no desktop) e Claude Code.

---

## Status
PENDING

## Tarefa

### Task 007 — Em WorldMapScene.gd, ao receber raid_requested, instanciar ConfirmRaidDialog.tscn como filho da cena, chamar setup() com dados de _pending_zone vindos de zones.gd. Conectar sinal confirmed para chamar get_tree().change_scene_to_file() com o scene_path da zona. Conectar sinal cancelled para remover o dialog e limpar _pending_zone.

**Tela afetada:** WorldMapScene
**Descrição completa:** Em WorldMapScene.gd, ao receber raid_requested, instanciar ConfirmRaidDialog.tscn como filho da cena, chamar setup() com dados de _pending_zone vindos de zones.gd. Conectar sinal confirmed para chamar get_tree().change_scene_to_file() com o scene_path da zona. Conectar sinal cancelled para remover o dialog e limpar _pending_zone.
**Como verificar:** Tocar RAID abre o painel de confirmação com nome correto. Confirmar muda de cena. Cancelar fecha o painel e volta ao mapa.

⚠️ NÃO commite ainda. Task 7/10 do batch 1.

Implemente a mudança acima. Siga os padrões do projeto (GDScript, snake_case, data-driven).
