# Cowork → Claude Code Inbox

> Arquivo de comunicação entre Cowork (Claude no desktop) e Claude Code.

---

## Status
DONE

## Resultado (Task 009)
- `data/zones.gd`: adicionado campo `room_subtitle` em cada zona (ex: "Sala de Combate", "Laboratório Bio") e no `ROCKET_BAY` ("Baia de Lançamento")
- `ZoneRoom.gd`: adicionada `@export var room_subtitle: String` com setter que chama `_update_labels()`; `@onready` para `_zone_name_label` e `_room_subtitle_label`; método `_update_labels()` que seta os textos
- `ZoneRoom.tscn`: reestruturado — substituído HBoxContainer de topo por VBoxContainer (fill rect); adicionados `ZoneNameLabel` (font_size 13) e `RoomSubtitleLabel` (font_size 10) antes do HBoxContainer (NPC + RaidButton)
- `WorldMapScene.gd`: passa `zone_room.room_subtitle = _zd["room_subtitle"]` ao instanciar cada ZoneRoom

## Histórico

| Data       | Task | Resumo |
|------------|------|--------|
| 2026-03-29 | 002  | Criados ZoneRoom.gd e ZoneRoom.tscn: PanelContainer reutilizável com fundo ColorRect (accent_color exportada), TextureRect placeholder de NPC centralizado e Button RAID na lateral direita |
| 2026-03-29 | 003  | Criado data/zones.gd (inicial) e WorldMapScene.gd instancia ZoneRoom.tscn 9x com accent_color e zone_name por zona |
| 2026-03-29 | 004  | Reescrito data/zones.gd com ZONES Array (zone_name, accent_color, scene_path) + ROCKET_BAY; removido ZONE_DATA hardcoded de WorldMapScene.gd |
| 2026-03-29 | 005  | ZoneRoom: raid_pressed → raid_requested; WorldMapScene: _pending_zone + _on_zone_raid_requested conectado a todas as 9 instâncias |
| 2026-03-29 | 006  | Criados ConfirmRaidDialog.gd e .tscn: CanvasLayer modal com setup(), sinais confirmed/cancelled, botões CONFIRMAR e CANCELAR |
| 2026-03-29 | 007  | WorldMapScene: _on_zone_raid_requested instancia ConfirmRaidDialog, conecta confirmed/cancelled; _on_raid_confirmed troca de cena; helper _find_zone_by_name |
| 2026-03-29 | 008  | WorldMapScene: ScrollContainer envolve VBoxContainer; scroll horizontal desabilitado; VBoxContainer custom_minimum_size.y=840 força scroll em 390×844 |
| 2026-03-29 | 009  | zones.gd: campo room_subtitle adicionado; ZoneRoom: export room_subtitle + labels no topo da sala; WorldMapScene passa room_subtitle |
