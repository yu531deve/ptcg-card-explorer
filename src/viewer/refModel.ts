import { parseEnergySymbols, type EnergyName } from '../lib/energy';
import type { Card } from '../types';

// The card shape the ported reference UI works with.
export type RefAttack = { cost: string[]; name: string; damage: string; text: string };
export type RefCard = {
  id: number;
  gid: number;
  name: string;
  supertype: string;
  stage: string;
  type: string | null;
  hp: number | null;
  retreat: number | null;
  weakness: string;
  resist: string;
  flag: string | null;
  flagTags: string[];
  category: string;
  catTags: string[];
  expansion: string;
  hasAbility: boolean;
  ability: { name: string; text: string } | null;
  attacks: RefAttack[];
  flavor: string;
  num: string;
  dpe: number;
};

const KIND_SUPERTYPE: Record<string, string> = {
  'Pokémon': 'ポケモン',
  Trainer: 'トレーナーズ',
  Energy: 'エネルギー',
  Unknown: 'その他',
};

export function glyphFor(t: string | null | undefined): string {
  if (!t) return '◇';
  return t === '無' ? '●' : t;
}

// All flags a card carries, so filtering by テラ still finds テラ-ex cards.
function flagTagsFor(card: Card): string[] {
  const tags: string[] = [];
  if (card.flags.mega) tags.push('メガ');
  if (card.flags.ex) tags.push('ex');
  if (card.flags.aceSpec) tags.push('ACE SPEC');
  if (card.flags.tera) tags.push('テラ');
  return tags;
}

// Energy type column may be a JP glyph (炎) or an EN code ({R}); normalise both
// to the JP glyph used by the type facet/options.
const ENERGY_GLYPH: Record<EnergyName, string | null> = {
  Fire: '炎', Water: '水', Grass: '草', Lightning: '雷', Psychic: '超',
  Fighting: '闘', Darkness: '悪', Metal: '鋼', Dragon: '竜', Colorless: '無',
  Unknown: null,
};

function typeGlyph(raw: string): string | null {
  const token = parseEnergySymbols(raw)[0];
  if (!token) return null;
  return ENERGY_GLYPH[token.energy];
}

// Trainer/Energy subtype labels live in the stage/type column; map EN→JP so the
// category facet (semantic labels) matches regardless of source language.
const TRAINER_CAT: Record<string, string> = {
  'サポート': 'サポート', Supporter: 'サポート',
  'グッズ': 'グッズ', Item: 'グッズ',
  'ポケモンのどうぐ': 'ポケモンのどうぐ', 'ポケモンの道具': 'ポケモンのどうぐ', 'Pokémon Tool': 'ポケモンのどうぐ',
  'スタジアム': 'スタジアム', Stadium: 'スタジアム',
};
const ENERGY_CAT: Record<string, string> = {
  '基本エネルギー': '基本エネルギー', 'Basic Energy': '基本エネルギー',
  '特殊エネルギー': '特殊エネルギー', 'Special Energy': '特殊エネルギー',
};

// Semantic category tags the facet filters on (ex/mega + trainer/energy subtype),
// derived from flags and the stage/type column rather than the raw カテゴリ value.
function catTagsFor(card: Card): string[] {
  const tags: string[] = [];
  if (card.flags.mega) tags.push('メガポケモン');
  if (card.flags.ex) tags.push('ポケモンex');
  const sot = card.stageOrType.trim();
  if (TRAINER_CAT[sot]) tags.push(TRAINER_CAT[sot]);
  if (ENERGY_CAT[sot]) tags.push(ENERGY_CAT[sot]);
  return tags;
}

function stageLabel(card: Card): string {
  if (card.kind === 'Pokémon') {
    if (card.stage === 0) return 'たね';
    if (card.stage === 1) return '1進化';
    if (card.stage === 2) return '2進化';
    const slash = card.stageOrType.split('/');
    return slash[slash.length - 1] || card.stageOrType;
  }
  return card.stageOrType;
}

function costTokens(cost: string): string[] {
  return parseEnergySymbols(cost).map((t) => glyphFor(t.raw));
}

export function toRefCard(card: Card): RefCard {
  const abilities = card.moves.filter((m) => m.isAbility);
  const attacks = card.moves.filter((m) => !m.isAbility);
  const ability = abilities[0]
    ? { name: abilities[0].name.replace(/^\[特性\]/, ''), text: abilities[0].effect }
    : null;
  return {
    id: card.cardId,
    gid: card.cardId,
    name: card.name,
    supertype: KIND_SUPERTYPE[card.kind] ?? 'その他',
    stage: stageLabel(card),
    type: typeGlyph(card.type),
    hp: card.hp,
    retreat: card.retreat,
    weakness: card.weakness && card.weakness !== 'n/a' ? card.weakness : '',
    resist: card.resistance && card.resistance !== 'n/a' ? card.resistance : '',
    flag: flagTagsFor(card)[0] ?? null,
    flagTags: flagTagsFor(card),
    category: card.category && card.category !== 'n/a' ? card.category : card.stageOrType,
    catTags: catTagsFor(card),
    expansion: card.expansion,
    hasAbility: Boolean(card.hasAbility),
    ability,
    attacks: attacks.map((a) => ({
      cost: costTokens(a.cost),
      name: a.name,
      damage: a.damage && a.damage !== 'n/a' ? a.damage : '',
      text: a.effect && a.effect !== 'n/a' ? a.effect : '',
    })),
    flavor: '',
    num: card.collectionNo,
    dpe: card.bestDpe ?? 0,
  };
}

export type ThemeName = 'light' | 'dark';

export const THEMES: Record<ThemeName, Record<string, string>> = {
  light: {
    '--bg': '#fbfbfa',
    '--panel': '#ffffff',
    '--panel-2': '#f5f5f4',
    '--hover': '#eeede9',
    '--border': '#e7e6e3',
    '--border-2': '#d6d5d1',
    '--text': '#191917',
    '--text-2': '#65645f',
    '--text-3': '#9b9a93',
    '--shadow': '0 1px 2px rgba(20,20,18,.06),0 4px 12px rgba(20,20,18,.05)',
    '--shadow-lg': '0 12px 40px rgba(20,20,18,.16)',
  },
  dark: {
    '--bg': '#0d0d0f',
    '--panel': '#161618',
    '--panel-2': '#1d1d20',
    '--hover': '#27272c',
    '--border': '#2a2a2f',
    '--border-2': '#3b3b42',
    '--text': '#f2f1ef',
    '--text-2': '#a3a2a0',
    '--text-3': '#6f6e72',
    '--shadow': '0 1px 2px rgba(0,0,0,.4),0 6px 18px rgba(0,0,0,.35)',
    '--shadow-lg': '0 16px 48px rgba(0,0,0,.62)',
  },
};

export function hexToRgba(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function themeVars(theme: ThemeName, accent: string): Record<string, string> {
  return {
    ...THEMES[theme],
    '--accent': accent,
    '--accent-soft': hexToRgba(accent, theme === 'dark' ? 0.18 : 0.1),
  };
}
