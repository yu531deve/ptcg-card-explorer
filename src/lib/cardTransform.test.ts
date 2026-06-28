import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseCsvText } from '../csv/loadCsv';
import { deriveMove, parseDamage, summarizeCost } from './cardTransform';
import type { Card } from '../types';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

async function loadDummy(file: string) {
  const text = readFileSync(join(root, 'dummy', file), 'utf8');
  return parseCsvText(text, file);
}

function byId(cards: Card[], id: number): Card {
  const card = cards.find((c) => c.cardId === id);
  if (!card) throw new Error(`Card ${id} not found`);
  return card;
}

describe('language detection', () => {
  it('detects JP and EN dummy files', async () => {
    expect((await loadDummy('dummy_jp.csv')).lang).toBe('JP');
    expect((await loadDummy('dummy_en.csv')).lang).toBe('EN');
  });
});

describe('card flags and derived fields (both languages)', () => {
  for (const file of ['dummy_jp.csv', 'dummy_en.csv']) {
    it(`derives flags for ${file}`, async () => {
      const { cards } = await loadDummy(file);

      const lynx = byId(cards, 1001);
      expect(lynx.flags.ex).toBe(true);
      expect(lynx.flags.tera).toBe(true);

      const drake = byId(cards, 1006);
      expect(drake.flags.mega).toBe(true);
      expect(drake.flags.ex).toBe(true);
      expect(drake.prizeValue).toBe(3);

      const patch = byId(cards, 1004);
      expect(patch.flags.aceSpec).toBe(true);
    });
  }
});

describe('summarizeCost', () => {
  it('counts colorless and typed energy across notations', () => {
    expect(summarizeCost('{R}{C}●').costTotal).toBe(3);
    expect(summarizeCost('炎無●').costTotal).toBe(3);
    expect(summarizeCost('{A}{A}').costTotal).toBe(0);
  });
});

describe('parseDamage', () => {
  it('parses static damage values', () => {
    expect(parseDamage('90+')).toMatchObject({ damageKind: 'Static', damageValue: 90 });
    expect(parseDamage('220')).toMatchObject({ damageKind: 'Static', damageValue: 220 });
  });
});

describe('deriveMove isAbility', () => {
  it('treats only [特性] and [Ability] markers as abilities', () => {
    expect(deriveMove({ name: '[特性] れいきゃく', cost: '', damage: '', effect: '' }).isAbility).toBe(true);
    expect(deriveMove({ name: '[Ability] Cooling', cost: '', damage: '', effect: '' }).isAbility).toBe(true);
    expect(deriveMove({ name: '[Tera]', cost: '', damage: '', effect: '' }).isAbility).toBe(false);
  });
});

describe('deriveMove dpe', () => {
  it('computes damage per energy for static attacks', () => {
    const move = deriveMove({ name: 'Blazing Pounce', cost: '炎無●', damage: '90+', effect: '' });
    expect(move.costTotal).toBe(3);
    expect(move.dpe).toBe(30);
    const big = deriveMove({ name: 'Meteor Break', cost: '{R}{W}●', damage: '220', effect: '' });
    expect(big.dpe).toBe(round2(220 / 3));
  });
});

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
