/** Zone data for WorldMapScene. Port of /data/zones.gd. */

import { Color, type RGBA } from '../core/Color';

export interface ZoneData {
  zone_name: string;
  accent_color: RGBA;
  scene: string; // logical run scene id (was scene_path in Godot)
  resource: string;
  subtitle: string;
  room_subtitle: string;
}

export const ZONES: ZoneData[] = [
  { zone_name: 'HORDAS',     accent_color: Color.rgb(0.800, 0.133, 0.000), scene: 'main',       resource: 'Sucata Metalica',   subtitle: 'Zona de combate',     room_subtitle: 'Sala de Combate' },
  { zone_name: 'STEALTH',    accent_color: Color.rgb(0.000, 0.667, 0.267), scene: 'stealth',    resource: 'Comp. de IA',       subtitle: 'Zona de infiltracao', room_subtitle: 'Sala de Infiltração' },
  { zone_name: 'CIRCUITO',   accent_color: Color.rgb(0.000, 0.808, 0.820), scene: 'circuit',    resource: 'Nucleo Logico',     subtitle: 'Zona de puzzle',      room_subtitle: 'Sala de Puzzles' },
  { zone_name: 'EXTRAÇÃO',   accent_color: Color.rgb(0.800, 0.400, 0.000), scene: 'extraction', resource: 'Combustivel Volatil', subtitle: 'Zona de velocidade', room_subtitle: 'Sala de Suprimentos' },
  { zone_name: 'CAMPO',      accent_color: Color.rgb(0.102, 0.435, 0.800), scene: 'field',      resource: 'Sinais de Controle', subtitle: 'Zona de controle',  room_subtitle: 'Sala de Controle' },
  { zone_name: 'INFECÇÃO',   accent_color: Color.rgb(0.133, 0.545, 0.133), scene: 'infection',  resource: 'Biomassa Adapt.',   subtitle: 'Zona de propagacao',  room_subtitle: 'Laboratório Bio' },
  { zone_name: 'LABIRINTO',  accent_color: Color.rgb(0.290, 0.565, 0.643), scene: 'maze',       resource: 'Frag. Estruturais', subtitle: 'Zona de navegacao',   room_subtitle: 'Corredor Técnico' },
  { zone_name: 'SACRIFÍCIO', accent_color: Color.rgb(0.482, 0.184, 0.745), scene: 'sacrifice',  resource: 'Sucata + Comp. IA', subtitle: 'Zona de decisao',     room_subtitle: 'Câmara de Detenção' },
];

export const ROCKET_BAY: ZoneData = {
  zone_name: 'BAIA DO FOGUETE',
  accent_color: Color.rgb(0.800, 0.200, 0.000),
  scene: '',
  resource: '',
  subtitle: '',
  room_subtitle: 'Baia de Lançamento',
};
