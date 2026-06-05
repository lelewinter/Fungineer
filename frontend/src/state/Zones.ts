/**
 * Zones — O "catalogo de fases" do mapa-mundi.
 * --------------------------------------------
 * Em linguagem simples: cada entrada aqui descreve UMA zona/fase para onde o
 * jogador pode mandar a tripulacao numa missao (run) — o nome que aparece na
 * tela, a cor-tema, qual recurso ela rende, e qual "cena" (mini-jogo) carregar
 * quando a missao comeca. E so dados de apresentacao; nenhuma regra de jogo.
 *
 * Usado pela tela do mapa-mundi (WorldMapScene). Portado de `/data/zones.gd`
 * (a versao original em Godot). Os caminhos `res://...` apontam para a arte e a
 * musica de cada zona dentro dos assets do projeto.
 */

import { Color, type RGBA } from '../core/Color';

/** Tudo que descreve visualmente uma zona/fase do mapa. */
export interface ZoneData {
  zone_name: string;
  accent_color: RGBA;
  scene: string; // id logico da cena de run (era scene_path no Godot)
  resource: string;
  subtitle: string;
  room_subtitle: string;
  art?: string;   // caminho res:// da imagem principal da zona
  music?: string; // caminho res:// da musica da zona
}

export const ZONES: ZoneData[] = [
  { zone_name: 'HORDAS',     accent_color: Color.rgb(0.380, 0.820, 0.470), scene: 'main',       resource: 'Biomassa',            subtitle: 'Jardim da IA',        room_subtitle: 'Floresta Automatizada', art: 'res://assets/art/zones/zone_hordas.png',    music: 'res://assets/audio/music/battle.wav' },
  { zone_name: 'STEALTH',    accent_color: Color.rgb(0.000, 0.667, 0.267), scene: 'stealth',    resource: 'Fragmentos de IA',    subtitle: 'Rede de ARGOS',       room_subtitle: 'Grade de Vigilância',  art: 'res://assets/art/zones/zone_stealth.png',    music: 'res://assets/audio/music/zones/night_theme_1.wav' },
  { zone_name: 'CIRCUITO',   accent_color: Color.rgb(0.000, 0.808, 0.820), scene: 'circuit',    resource: 'Núcleo Lógico',       subtitle: 'Relés de NERVE',      room_subtitle: 'Conduto de Retransmissão', art: 'res://assets/art/zones/zone_circuito.png', music: 'res://assets/audio/music/zones/dungeon_theme_1.wav' },
  { zone_name: 'EXTRAÇÃO',   accent_color: Color.rgb(0.800, 0.400, 0.000), scene: 'extraction', resource: 'Combustível Volátil', subtitle: 'Arquivo Subterrâneo', room_subtitle: 'Sub-Base de Construção', art: 'res://assets/art/zones/zone_extracao.png',  music: 'res://assets/audio/music/zones/field_theme_2.wav' },
  { zone_name: 'CAMPO',      accent_color: Color.rgb(0.102, 0.435, 0.800), scene: 'field',      resource: 'Sinais de Controle',  subtitle: 'Praça das Águas',     room_subtitle: 'Relés de FLOW',        art: 'res://assets/art/zones/zone_campo.png',      music: 'res://assets/audio/music/zones/field_theme_1.wav' },
  { zone_name: 'INFECÇÃO',   accent_color: Color.rgb(0.133, 0.545, 0.133), scene: 'infection',  resource: 'Biomassa Adapt.',     subtitle: 'Núcleo de NERVE',     room_subtitle: 'Datacenter Principal', art: 'res://assets/art/zones/zone_infeccao.png',   music: 'res://assets/audio/music/zones/night_theme_2.wav' },
  { zone_name: 'LABIRINTO',  accent_color: Color.rgb(0.290, 0.565, 0.643), scene: 'maze',       resource: 'Frag. Estruturais',   subtitle: 'Hub FLOW',            room_subtitle: 'Centro de Distribuição 7', art: 'res://assets/art/zones/zone_labirinto.png', music: 'res://assets/audio/music/zones/dungeon_theme_2.wav' },
  { zone_name: 'SACRIFÍCIO',  accent_color: Color.rgb(0.482, 0.184, 0.745), scene: 'sacrifice',   resource: 'Sucata + Comp. IA',   subtitle: 'Câmaras de CORE',     room_subtitle: 'Vault de Alta Segurança', art: 'res://assets/art/zones/zone_sacrificio.png', music: 'res://assets/audio/music/zones/dungeon_theme_1.wav' },
  { zone_name: 'CORDILHEIRA', accent_color: Color.rgb(0.420, 0.380, 0.350), scene: 'cordilheira', resource: 'Memórias Coletivas',  subtitle: 'Favela Sem IA',       room_subtitle: 'Rua das Camélias',     art: 'res://assets/art/zones/zone_cordilheira.png', music: 'res://assets/audio/music/zones/night_theme_2.wav' },
  { zone_name: 'TORRES',      accent_color: Color.rgb(0.180, 0.300, 0.520), scene: 'torres',      resource: 'Cristais de Memória', subtitle: 'Distrito Olímpio Alto', room_subtitle: 'Torres Corporativas',  art: 'res://assets/art/zones/zone_torres.png',      music: 'res://assets/audio/music/zones/night_theme_1.wav' },
  { zone_name: 'CATEDRAL',    accent_color: Color.rgb(0.780, 0.680, 0.420), scene: 'catedral',    resource: 'Relíquias',           subtitle: 'Patrimônio Protegido', room_subtitle: 'Catedral Colonial',   art: 'res://assets/art/zones/zone_catedral.png',    music: 'res://assets/audio/music/zones/dungeon_theme_2.wav' },
];

/** Entrada especial: a baia do foguete. Nao e uma fase jogavel (scene vazia),
 *  mas reaproveita o mesmo formato para aparecer no mapa como destino. */
export const ROCKET_BAY: ZoneData = {
  zone_name: 'BAIA DO FOGUETE',
  accent_color: Color.rgb(0.800, 0.200, 0.000),
  scene: '',
  resource: '',
  subtitle: '',
  room_subtitle: 'Baia de Lançamento',
};
