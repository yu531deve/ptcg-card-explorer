// Shared, pure transform logic for both the Node preprocessing script
// (scripts/build-card-data.mjs) and the in-browser raw-CSV path
// (src/csv/foldMoves.ts). No fs/DOM side effects — runs in Node and the browser.
import { parseEnergySymbols } from './energy';
import type { Card, DamageKind, Move } from '../types';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Count energy tokens in a cost string. Unknown tokens (e.g. {A}) are excluded
// from costTotal; Colorless (●, 無, {C}) is counted separately from typed energy.
export function summarizeCost(cost: string): {
  costTotal: number;
  costColorless: number;
  costTyped: number;
} {
  let costTotal = 0;
  let costColorless = 0;
  let costTyped = 0;
  for (const token of parseEnergySymbols(cost)) {
    if (token.energy === 'Unknown') continue;
    costTotal += 1;
    if (token.energy === 'Colorless') costColorless += 1;
    else costTyped += 1;
  }
  return { costTotal, costColorless, costTyped };
}

export function parseDamage(raw: string): {
  damageRaw: string;
  damageValue: number | null;
  damageKind: DamageKind;
} {
  const v = String(raw ?? '').trim();
  const cleaned = v === '' || v.toLowerCase() === 'n/a' ? '' : v;
  if (cleaned === '') return { damageRaw: '', damageValue: null, damageKind: 'None' };
  let damageKind: DamageKind;
  if (/[×x]/.test(cleaned)) damageKind = 'Multiplier';
  else if (/^[-−]/.test(cleaned)) damageKind = 'Conditional';
  else if (/\d/.test(cleaned)) damageKind = 'Static';
  else damageKind = 'None';
  const match = cleaned.match(/\d+/);
  const damageValue = match ? parseInt(match[0], 10) : null;
  return { damageRaw: cleaned, damageValue, damageKind };
}

// Abilities are marked [特性] (JP) or [Ability] (EN). Real data contains only
// [特性]; no other bracketed marker (e.g. [Tera]) denotes an ability.
function isAbilityName(name: string): boolean {
  const v = String(name ?? '').trim();
  return v.startsWith('[特性]') || v.startsWith('[Ability]');
}

export function deriveMove(rawMove: { name: string; cost: string; damage: string; effect: string }): Move {
  const isAbility = isAbilityName(rawMove.name);
  const { costTotal, costColorless, costTyped } = summarizeCost(rawMove.cost);
  const { damageValue, damageKind } = parseDamage(rawMove.damage);
  const dpe =
    !isAbility && costTotal > 0 && damageKind === 'Static' && damageValue != null
      ? round2(damageValue / costTotal)
      : null;
  return {
    name: rawMove.name,
    cost: rawMove.cost,
    damage: rawMove.damage,
    effect: rawMove.effect,
    isAbility,
    costTotal,
    costColorless,
    costTyped,
    damageValue,
    damageKind,
    dpe,
  };
}

// Flag detection for BOTH languages. Japanese real data uses `ex` / `メガシンカex`
// / `ACE SPEC`; English uses `Pokémon ex` / `Mega Pokémon ex` / `ACE SPEC`.
export function deriveFlags(rule: string, category: string): Card['flags'] {
  const r = String(rule ?? '').trim();
  const c = String(category ?? '');
  const mega = r === 'メガシンカex' || r === 'Mega Pokémon ex';
  return {
    mega,
    ex: r === 'ex' || r === 'Pokémon ex' || r === 'Mega Pokémon ex',
    aceSpec: r === 'ACE SPEC',
    tera: /Tera\(/.test(c) || c.includes('テラスタル'),
  };
}

export function derivePrizeValue(flags: Card['flags']): number {
  if (flags.mega) return 3;
  if (flags.ex) return 2;
  return 1;
}

export function deriveStage(stageOrType: string): number | null {
  const v = String(stageOrType ?? '');
  if (v.includes('たね') || v.includes('基本') || v.includes('Basic')) return 0;
  if (v.includes('1進化') || v.includes('Stage 1')) return 1;
  if (v.includes('2進化') || v.includes('Stage 2')) return 2;
  return null;
}

export function aggregateCard(moves: Move[]): {
  hasAbility: boolean;
  abilityCount: number;
  bestDpe: number | null;
  peakDamage: number | null;
  nMoves: number;
} {
  const abilityCount = moves.filter((m) => m.isAbility).length;
  const attacks = moves.filter((m) => !m.isAbility);
  const dpes = attacks.map((m) => m.dpe).filter((d): d is number => d != null);
  const damageValues = attacks
    .map((m) => m.damageValue)
    .filter((d): d is number => d != null);
  return {
    hasAbility: abilityCount > 0,
    abilityCount,
    bestDpe: dpes.length ? Math.max(...dpes) : null,
    peakDamage: damageValues.length ? Math.max(...damageValues) : null,
    nMoves: attacks.length,
  };
}
