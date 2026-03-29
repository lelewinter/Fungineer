# Cowork → Claude Code Inbox

> Arquivo de comunicação entre Cowork (Claude no desktop) e Claude Code.

---

## Status
PENDING

## Resultado (Task 002)
Criados `src/scenes/ZoneRoom.gd` e `src/scenes/ZoneRoom.tscn`.
- Raiz: PanelContainer com script ZoneRoom (class_name ZoneRoom)
- `@export var accent_color: Color` — atualiza ColorRect de fundo (alpha 0.30) via setter
- `@export var zone_name: String` — passado no sinal `raid_pressed`
- `ColorRect` cobre toda a área do painel (mouse_filter IGNORE para não bloquear input)
- `HBoxContainer` sobreposto: `CenterContainer` (expand fill) com `TextureRect` 48×48 como placeholder de NPC; `Button "RAID"` alinhado verticalmente ao centro na lateral direita
- Sinal `raid_pressed(zone_name)` emitido ao pressionar o botão

## Histórico

| Data       | Task | Resumo |
|------------|------|--------|
| 2026-03-29 | 002  | Criados ZoneRoom.gd e ZoneRoom.tscn: PanelContainer reutilizável com fundo ColorRect (accent_color exportada), TextureRect placeholder de NPC centralizado e Button RAID na lateral direita |

---

## Tarefa

### Task 003 — Em WorldMapScene.gd, instanciar ZoneRoom.tscn 9 vezes via código, passando zone_name e accent_color para cada instância conforme constantes definidas em res://data/zones.gd. As cores de accent seguem: Hordas=#CC2200, Sacrifício=#7B2FBE, Extração=#CC6600, Campo=#1A6FCC, Foguete=#CC3300, Stealth=#00AA44, Infecção=#228B22, Labirinto=#4A90A4, Circuito=#00CED1.

**Tela afetada:** WorldMapScene
**Descrição completa:** Em WorldMapScene.gd, instanciar ZoneRoom.tscn 9 vezes via código, passando zone_name e accent_color para cada instância conforme constantes definidas em res://data/zones.gd. As cores de accent seguem: Hordas=#CC2200, Sacrifício=#7B2FBE, Extração=#CC6600, Campo=#1A6FCC, Foguete=#CC3300, Stealth=#00AA44, Infecção=#228B22, Labirinto=#4A90A4, Circuito=#00CED1.
**Como verificar:** As 9 salas aparecem com cores de accent distintas correspondendo a cada zona.

⚠️ NÃO commite ainda. Task 3/10 do batch 1.

Implemente a mudança acima. Siga os padrões do projeto (GDScript, snake_case, data-driven).
