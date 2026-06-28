import type { CardKind } from '../types';

const TRAINER_TYPES = new Set(['Item', 'Supporter', 'Pokémon Tool', 'Stadium']);
const JP_TRAINER_TYPES = new Set(['グッズ', 'サポート', 'ポケモンのどうぐ', 'ポケモンの道具', 'スタジアム']);
const JP_ENERGY_TYPES = new Set(['基本エネルギー', '特殊エネルギー']);
const JP_POKEMON_STAGES = new Set(['基本ポケモン', '1進化ポケモン', '2進化ポケモン']);

export function deriveKind(stageOrType: string): CardKind {
  const value = stageOrType.trim();
  if (/Pokémon$/.test(value) || JP_POKEMON_STAGES.has(value)) return 'Pokémon';
  if (/Energy$/.test(value) || JP_ENERGY_TYPES.has(value)) return 'Energy';
  if (TRAINER_TYPES.has(value) || JP_TRAINER_TYPES.has(value)) return 'Trainer';
  return 'Unknown';
}
