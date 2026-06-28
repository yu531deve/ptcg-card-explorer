import type { CardKind, SortKey } from '../types';
import type { EnergyName } from './energy';

// Japanese display labels for internal English enum values.
export const KIND_LABEL: Record<CardKind, string> = {
  'Pokémon': 'ポケモン',
  Trainer: 'トレーナーズ',
  Energy: 'エネルギー',
  Unknown: '不明',
};

export const ENERGY_LABEL: Record<EnergyName, string> = {
  Grass: '草',
  Fire: '炎',
  Water: '水',
  Lightning: '雷',
  Psychic: '超',
  Fighting: '闘',
  Darkness: '悪',
  Metal: '鋼',
  Colorless: '無色',
  Dragon: '竜',
  Unknown: '不明',
};

export const SORT_LABEL: Record<SortKey, string> = {
  cardId: 'ID',
  name: '名前',
  hp: 'HP',
  retreat: 'にげる',
  damage: 'ダメージ',
  collectionNo: 'コレクション番号',
};

export function kindLabel(kind: CardKind): string {
  return KIND_LABEL[kind] ?? kind;
}

export function energyLabel(energy: EnergyName): string {
  return ENERGY_LABEL[energy] ?? energy;
}
