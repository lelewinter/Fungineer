# Task Queue — Fungineer

> Arquivo escrito pelo Claude mobile. O orquestrador lê daqui e despacha pro Claude Code.
> Formato fixo — não altere os separadores `---TASK---`.

## Metadados

Batch atual: 0
Tasks completadas neste batch: 0
Último commit: nunca

---

## Tasks

<!--
STATUS possíveis: PENDING | IN_PROGRESS | DONE | VERIFY_NEEDED | CORRECTION | VERIFIED | REJECTED
-->

<!-- Exemplo de task — apague antes de usar:

---TASK---
ID: 001
Status: IN_PROGRESS
Tela: WorldMapScene
Descrição: Adicionar ícone de estrela dourada no canto superior direito de cada zona desbloqueada.
Como verificar: Abrir o jogo → tela do mapa → verificar se zonas desbloqueadas têm estrela dourada visível.
---END---

-->
---TASK---
ID: 001
Status: IN_PROGRESS
Tela: WorldMapScene
Descrição: Substituir o layout atual de WorldMapScene por uma cena side-view com estrutura de 3 andares de 3 salas cada. Usar Control como raiz, com VBoxContainer para os andares e HBoxContainer para as salas dentro de cada andar. A ordem das zonas segue: Andar 3 (topo): Hordas, Sacrifício, Extração. Andar 2: Campo, Foguete, Stealth. Andar 1 (base): Infecção, Labirinto, Circuito.
Como verificar: Ao abrir WorldMapScene no jogo, aparecem 9 salas distribuídas em 3 andares visíveis na tela, sem sobreposição.
---END---
---TASK---
ID: 002
Status: PENDING
Tela: WorldMapScene
Descrição: Criar cena reutilizável ZoneRoom.tscn com: PanelContainer como raiz, ColorRect para fundo com cor do accent da zona, NinePatchRect ou TextureRect para placeholder do NPC centralizado na sala, e Button posicionado na lateral direita da sala com texto "RAID". A cor do accent e o nome da zona são passados via propriedades exportadas em ZoneRoom.gd.
Como verificar: ZoneRoom.tscn instanciada isoladamente exibe fundo colorido, placeholder de NPC e botão RAID na lateral direita.
---END---
---TASK---
ID: 003
Status: PENDING
Tela: WorldMapScene
Descrição: Em WorldMapScene.gd, instanciar ZoneRoom.tscn 9 vezes via código, passando zone_name e accent_color para cada instância conforme constantes definidas em res://data/zones.gd. As cores de accent seguem: Hordas=#CC2200, Sacrifício=#7B2FBE, Extração=#CC6600, Campo=#1A6FCC, Foguete=#CC3300, Stealth=#00AA44, Infecção=#228B22, Labirinto=#4A90A4, Circuito=#00CED1.
Como verificar: As 9 salas aparecem com cores de accent distintas correspondendo a cada zona.
---END---
---TASK---
ID: 004
Status: PENDING
Tela: WorldMapScene
Descrição: Criar res://data/zones.gd com constante ZONES sendo um Array de Dicionários. Cada dicionário contém: zone_name (String), accent_color (Color), e scene_path (String) apontando para a cena de raid correspondente. Nenhum valor hardcoded em WorldMapScene.gd.
Como verificar: WorldMapScene carrega e exibe as 9 salas lendo apenas de zones.gd, sem literais de cor ou nome no script da cena.
---END---
---TASK---
ID: 005
Status: PENDING
Tela: WorldMapScene
Descrição: Em ZoneRoom.gd, conectar o sinal pressed do Button RAID para emitir sinal raid_requested(zone_name: String). WorldMapScene.gd escuta esse sinal de todas as instâncias e armazena a zona selecionada em uma variável _pending_zone.
Como verificar: Ao tocar no botão RAID de qualquer sala, o sinal é emitido e _pending_zone é atualizado com o nome correto da zona (verificável via print no output do Godot).
---END---
---TASK---
ID: 006
Status: PENDING
Tela: ConfirmRaidDialog
Descrição: Criar cena ConfirmRaidDialog.tscn como CanvasLayer com PanelContainer centralizado. Conteúdo: Label com nome da zona, Label com descrição curta da zona, Button "CONFIRMAR" e Button "CANCELAR". Aceita dados via método setup(zone_name: String, zone_description: String). Emite sinais confirmed e cancelled.
Como verificar: ConfirmRaidDialog instanciado e chamado com setup() exibe nome e descrição da zona, com dois botões funcionais.
---END---
---TASK---
ID: 007
Status: PENDING
Tela: WorldMapScene
Descrição: Em WorldMapScene.gd, ao receber raid_requested, instanciar ConfirmRaidDialog.tscn como filho da cena, chamar setup() com dados de _pending_zone vindos de zones.gd. Conectar sinal confirmed para chamar get_tree().change_scene_to_file() com o scene_path da zona. Conectar sinal cancelled para remover o dialog e limpar _pending_zone.
Como verificar: Tocar RAID abre o painel de confirmação com nome correto. Confirmar muda de cena. Cancelar fecha o painel e volta ao mapa.
---END---
---TASK---
ID: 008
Status: PENDING
Tela: WorldMapScene
Descrição: Adicionar ScrollContainer envolvendo o VBoxContainer dos andares em WorldMapScene, com scroll horizontal desabilitado e scroll vertical habilitado. Garantir que o conteúdo total dos 3 andares ultrapasse a altura da tela em resolução 390x844 (base mobile), forçando scroll visível.
Como verificar: Em resolução mobile, é possível rolar verticalmente para ver todos os 3 andares sem conteúdo cortado.
---END---
---TASK---
ID: 009
Status: PENDING
Tela: WorldMapScene
Descrição: Adicionar Label de nome da zona e Label de subtítulo da sala (ex: "Entrada", "Sala Comum") em ZoneRoom.tscn, posicionados no topo da sala. Os valores vêm das propriedades exportadas zone_name e room_subtitle em ZoneRoom.gd. Adicionar room_subtitle como campo no dicionário de cada zona em zones.gd.
Como verificar: Cada sala exibe no topo o subtítulo da sala e o nome da zona com a tipografia correta, sem sobreposição com o NPC placeholder.
---END---
---TASK---
ID: 010
Status: PENDING
Tela: WorldMapScene
Descrição: Criar fundo geral de WorldMapScene com TextureRect ou ColorRect representando estrutura de bunker/instalação industrial (cor escura, #0D0D0D), com linhas divisórias entre andares usando HSeparator. Aplicar theme_override nos PanelContainer das salas para bordas com a cor do accent da zona.
Como verificar: O mapa exibe visual de instalação escura com salas tendo borda na cor do accent, sem fundo branco ou padrão do Godot.
---END---