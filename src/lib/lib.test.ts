import { describe, expect, it } from 'vitest';
import { isBlank, nullableNumber } from './blank';
import { deriveKind } from './deriveKind';
import { parseEnergySymbols } from './energy';
import { deriveFlags } from './flags';
import { filterCards, type FilterState } from './filter';
import { getCardImagePage } from './pdfPages';
import { DEFAULT_SORT, sortCards } from './sort';
import { createUrlSearch, parseUrlState } from './urlState';
import type { Card } from '../types';

const BASE_FILTERS: FilterState = {
  query: '',
  kinds: [],
  stageOrTypes: [],
  types: [],
  categories: [],
  expansions: [],
  flags: [],
};

describe('blank helpers', () => {
  it('treats empty strings and n/a as blank', () => {
    expect(isBlank('')).toBe(true);
    expect(isBlank(' n/a ')).toBe(true);
    expect(isBlank('0')).toBe(false);
    expect(nullableNumber('220')).toBe(220);
    expect(nullableNumber('n/a')).toBeNull();
  });
});

describe('deriveKind', () => {
  it('derives kind from EN and JP stage/type values', () => {
    expect(deriveKind('Basic Pokémon')).toBe('Pokémon');
    expect(deriveKind('Item')).toBe('Trainer');
    expect(deriveKind('Special Energy')).toBe('Energy');
    expect(deriveKind('基本ポケモン')).toBe('Pokémon');
    expect(deriveKind('ポケモンのどうぐ')).toBe('Trainer');
    expect(deriveKind('特殊エネルギー')).toBe('Energy');
  });
});

describe('energy parser', () => {
  it('keeps known and unknown tokens without dropping text', () => {
    expect(parseEnergySymbols('{R}{Team Rocket}●竜炎').map((token) => token.energy)).toEqual([
      'Fire',
      'Unknown',
      'Colorless',
      'Dragon',
      'Fire',
    ]);
  });
});

describe('flags', () => {
  it('uses rule and category columns only', () => {
    expect(deriveFlags('Mega Pokémon ex', 'Tera(Fire)')).toEqual({
      ex: true,
      mega: true,
      aceSpec: false,
      tera: true,
    });
    expect(deriveFlags('ACE SPEC', 'n/a').aceSpec).toBe(true);
  });
});

describe('filterCards', () => {
  it('searches name, move effect, and rule with NFKC normalization', () => {
    const cards = [card({ name: 'Draw Master', rule: 'Pokémon ex', effect: 'Draw 2 cards.' })];
    expect(filterCards(cards, { ...BASE_FILTERS, query: 'ｄｒａｗ' })).toHaveLength(1);
    expect(filterCards(cards, { ...BASE_FILTERS, query: 'pokémon ex' })).toHaveLength(1);
  });

  it('applies filter groups as AND and values inside a group as OR', () => {
    const cards = [
      card({ cardId: 1, kind: 'Pokémon', type: '{R}', category: 'Ancient' }),
      card({ cardId: 2, kind: 'Trainer', type: 'n/a', category: 'Future' }),
    ];
    expect(filterCards(cards, { ...BASE_FILTERS, kinds: ['Pokémon'], categories: ['Ancient', 'Future'] })).toHaveLength(1);
    expect(filterCards(cards, { ...BASE_FILTERS, types: ['Fire'] })).toHaveLength(1);
  });
});

describe('sortCards', () => {
  it('sorts numeric fields with nulls at the end', () => {
    const cards = [card({ cardId: 1, hp: null }), card({ cardId: 2, hp: 80 }), card({ cardId: 3, hp: 220 })];
    expect(sortCards(cards, { key: 'hp', direction: 'desc' }).map((item) => item.cardId)).toEqual([3, 2, 1]);
  });

  it('sorts by extracted move damage', () => {
    const cards = [
      card({ cardId: 1, damage: '90+' }),
      card({ cardId: 2, damage: 'n/a' }),
      card({ cardId: 3, damage: '220' }),
    ];
    expect(sortCards(cards, { key: 'damage', direction: 'desc' }).map((item) => item.cardId)).toEqual([3, 1, 2]);
  });
});

describe('url state', () => {
  it('round-trips condition state without card data', () => {
    const search = createUrlSearch({
      filters: {
        ...BASE_FILTERS,
        query: 'draw',
        kinds: ['Trainer'],
        types: ['Fire'],
        flags: ['ex'],
      },
      viewMode: 'grid',
      sort: { key: 'hp', direction: 'desc' },
    });
    const parsed = parseUrlState(search);
    expect(parsed.filters.query).toBe('draw');
    expect(parsed.filters.kinds).toEqual(['Trainer']);
    expect(parsed.filters.types).toEqual(['Fire']);
    expect(parsed.filters.flags).toEqual(['ex']);
    expect(parsed.viewMode).toBe('grid');
    expect(parsed.sort).toEqual({ key: 'hp', direction: 'desc' });
    expect(search).not.toContain('Card Name');
  });

  it('uses defaults for empty search', () => {
    expect(parseUrlState('').sort).toEqual(DEFAULT_SORT);
  });
});

describe('pdf page mapping', () => {
  it('maps card ids after the index pages', () => {
    expect(getCardImagePage(1, 1000)).toBe(32);
    expect(getCardImagePage(1000, 1000)).toBe(1031);
  });
});

function card(overrides: Partial<Card> & { effect?: string; damage?: string } = {}): Card {
  return {
    cardId: overrides.cardId ?? 1,
    name: overrides.name ?? 'Sample',
    kind: overrides.kind ?? 'Pokémon',
    stageOrType: overrides.stageOrType ?? 'Basic Pokémon',
    category: overrides.category ?? 'n/a',
    rule: overrides.rule ?? 'n/a',
    flags: overrides.flags ?? deriveFlags(overrides.rule ?? 'n/a', overrides.category ?? 'n/a'),
    prevStage: overrides.prevStage,
    hp: 'hp' in overrides ? (overrides.hp ?? null) : 100,
    type: overrides.type ?? '{G}',
    weakness: overrides.weakness ?? 'n/a',
    resistance: overrides.resistance ?? 'n/a',
    retreat: overrides.retreat ?? 1,
    expansion: overrides.expansion ?? 'ABC',
    collectionNo: overrides.collectionNo ?? '001',
    moves: overrides.moves ?? [
      {
        name: 'Move',
        cost: '{G}',
        damage: overrides.damage ?? '30',
        effect: overrides.effect ?? 'n/a',
      },
    ],
    raw: overrides.raw ?? {},
    _lang: overrides._lang ?? 'EN',
  };
}
