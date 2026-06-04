/** Zone data for WorldMapScene. Port of /data/zones.gd. */

import { Color, type RGBA } from '../core/Color';

export interface ZoneData {
  zone_name: string;
  accent_color: RGBA;
  scene: string; // logical run scene id (was scene_path in Godot)
  resource: string;
  subtitle: string;
  room_subtitle: string;
  art?: string;   // res:// path to zone hero image
  music?: string; // res:// path to zone music
}

export const ZONES: ZoneData[] = [
  { zone_name: 'HORDAS',     accent_color: Color.rgb(0.800, 0.133, 0.000), scene: 'main',       resource: 'Sucata Metalica',     subtitle: 'colheita de microesqueleto',     room_subtitle: 'Sala de Combate',      art: 'res://assets/art/zones/zone_hordas.png',     music: 'res://assets/audio/music/zones/field_theme_1.wav' },
  { zone_name: 'STEALTH',    accent_color: Color.rgb(0.000, 0.667, 0.267), scene: 'stealth',    resource: 'Comp. de IA',         subtitle: 'extração de catalisadores',      room_subtitle: 'Sala de Infiltração',  art: 'res://assets/art/zones/zone_stealth.png',    music: 'res://assets/audio/music/zones/night_theme_1.wav' },
  { zone_name: 'CIRCUITO',   accent_color: Color.rgb(0.000, 0.808, 0.820), scene: 'circuit',    resource: 'Nucleo Logico',       subtitle: 'decodificação de geometria',     room_subtitle: 'Sala de Puzzles',      art: 'res://assets/art/zones/zone_circuito.png',   music: 'res://assets/audio/music/zones/dungeon_theme_1.wav' },
  { zone_name: 'EXTRAÇÃO',   accent_color: Color.rgb(0.800, 0.400, 0.000), scene: 'extraction', resource: 'Combustivel Volatil', subtitle: 'destilaria em chamas',           room_subtitle: 'Sala de Suprimentos',  art: 'res://assets/art/zones/zone_extracao.png',   music: 'res://assets/audio/music/zones/field_theme_2.wav' },
  { zone_name: 'CAMPO',      accent_color: Color.rgb(0.102, 0.435, 0.800), scene: 'field',      resource: 'Sinais de Controle',  subtitle: 'captura de padrão nervoso',      room_subtitle: 'Sala de Controle',     art: 'res://assets/art/zones/zone_campo.png',      music: 'res://assets/audio/music/zones/field_theme_1.wav' },
  { zone_name: 'INFECÇÃO',   accent_color: Color.rgb(0.133, 0.545, 0.133), scene: 'infection',  resource: 'Biomassa Adapt.',     subtitle: 'colheita de biopolímero vivo',   room_subtitle: 'Laboratório Bio',      art: 'res://assets/art/zones/zone_infeccao.png',   music: 'res://assets/audio/music/zones/night_theme_2.wav' },
  { zone_name: 'LABIRINTO',  accent_color: Color.rgb(0.290, 0.565, 0.643), scene: 'maze',       resource: 'Frag. Estruturais',   subtitle: 'mineração de cerâmica ablativa', room_subtitle: 'Corredor Técnico',     art: 'res://assets/art/zones/zone_labirinto.png',  music: 'res://assets/audio/music/zones/dungeon_theme_2.wav' },
  { zone_name: 'SACRIFÍCIO',  accent_color: Color.rgb(0.482, 0.184, 0.745), scene: 'sacrifice',   resource: 'Sucata + Comp. IA',   subtitle: 'laboratório de risco máximo',    room_subtitle: 'Câmara de Detenção',   art: 'res://assets/art/zones/zone_sacrificio.png',  music: 'res://assets/audio/music/zones/dungeon_theme_1.wav' },
  { zone_name: 'CORDILHEIRA', accent_color: Color.rgb(0.420, 0.380, 0.350), scene: 'cordilheira', resource: 'Memorias Coletivas',  subtitle: 'Zona sem IA',         room_subtitle: 'Favela Silenciosa',    art: 'res://assets/art/zones/zone_cordilheira.png', music: 'res://assets/audio/music/zones/night_theme_2.wav' },
  { zone_name: 'TORRES',      accent_color: Color.rgb(0.180, 0.300, 0.520), scene: 'torres',      resource: 'Cristais de Memoria', subtitle: 'Zona vertical',       room_subtitle: 'Arranha-céus',         art: 'res://assets/art/zones/zone_torres.png',      music: 'res://assets/audio/music/zones/night_theme_1.wav' },
  { zone_name: 'CATEDRAL',    accent_color: Color.rgb(0.780, 0.680, 0.420), scene: 'catedral',    resource: 'Reliquias',           subtitle: 'Zona litúrgica',      room_subtitle: 'Catedral',             art: 'res://assets/art/zones/zone_catedral.png',    music: 'res://assets/audio/music/zones/dungeon_theme_2.wav' },
];

export const ROCKET_BAY: ZoneData = {
  zone_name: 'BAIA DO FOGUETE',
  accent_color: Color.rgb(0.800, 0.200, 0.000),
  scene: '',
  resource: '',
  subtitle: '',
  room_subtitle: 'Baia de Lançamento',
};
