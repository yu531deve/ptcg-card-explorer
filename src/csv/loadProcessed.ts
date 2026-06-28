import Papa from 'papaparse';
import type { Card, CardKind, DamageKind, Move } from '../types';

type ProcessedRow = Record<string, string | undefined>;

type RawMove = {
  name?: string;
  is_ability?: boolean;
  cost?: string;
  cost_total?: number;
  cost_colorless?: number;
  cost_typed?: number;
  damage_raw?: string;
  damage_value?: number | null;
  damage_kind?: DamageKind;
  dpe?: number | null;
  effect?: string;
};

const KIND_MAP: Record<string, CardKind> = {
  Pokemon: 'Pokémon',
  Trainer: 'Trainer',
  Energy: 'Energy',
  Unknown: 'Unknown',
};

// Parses data/cards_processed.csv (one row per card, with a moves_json column)
// into the app's Card model, including the derived ability/feature fields.
export function parseProcessedCsv(text: string, fileName = 'cards_processed.csv'): Promise<{
  cards: Card[];
  fields: string[];
}> {
  return new Promise((resolve, reject) => {
    Papa.parse<ProcessedRow>(text, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length) {
          reject(new Error(result.errors.map((error) => error.message).join('\n')));
          return;
        }
        const fields = result.meta.fields ?? [];
        const cards = result.data
          .map((row) => rowToCard(row))
          .filter((card): card is Card => card != null)
          .sort((a, b) => a.cardId - b.cardId);
        resolve({ cards, fields });
      },
      error: (error: Error) => reject(error),
    });
  });
}

function rowToCard(row: ProcessedRow): Card | null {
  const cardId = num(row.card_id);
  if (cardId == null) return null;

  const rule = text(row.rule);
  const category = text(row.category);
  const moves = parseMoves(row.moves_json);
  const isMega = bool(row.is_mega_ex);
  const isEx = bool(row.is_ex);

  return {
    cardId,
    name: text(row.name, `Card ${cardId}`),
    kind: KIND_MAP[text(row.kind)] ?? 'Unknown',
    stageOrType: text(row.stage_label),
    category,
    rule,
    flags: {
      ex: isEx,
      mega: isMega,
      aceSpec: bool(row.is_ace_spec),
      tera: /テラスタル|Tera/.test(category),
    },
    prevStage: text(row.prev_stage) || undefined,
    hp: num(row.hp),
    type: text(row.type),
    weakness: text(row.weakness),
    resistance: text(row.resistance),
    retreat: num(row.retreat),
    expansion: text(row.expansion),
    collectionNo: text(row.collection_no),
    moves,
    raw: buildRaw(row),
    _lang: 'JP',
    stage: num(row.stage),
    prizeValue: num(row.prize_value) ?? 1,
    hasAbility: bool(row.has_ability),
    abilityCount: num(row.ability_count) ?? 0,
    hasWeakness: bool(row.has_weakness),
    hasResistance: bool(row.has_resistance),
    bestDpe: num(row.best_dpe),
    peakDamage: num(row.peak_damage),
    nMoves: num(row.n_moves) ?? 0,
  };
}

function parseMoves(json: string | undefined): Move[] {
  if (!json) return [];
  let parsed: RawMove[];
  try {
    parsed = JSON.parse(json);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.map((move) => ({
    name: move.name ?? '',
    cost: move.cost ?? '',
    damage: move.damage_raw ?? '',
    effect: move.effect ?? '',
    isAbility: Boolean(move.is_ability),
    costTotal: move.cost_total ?? 0,
    costColorless: move.cost_colorless ?? 0,
    costTyped: move.cost_typed ?? 0,
    damageValue: move.damage_value ?? null,
    damageKind: move.damage_kind ?? 'None',
    dpe: move.dpe ?? null,
  }));
}

// Keeps the processed columns available for the detail panel's "All fields" view.
function buildRaw(row: ProcessedRow): Record<string, string> {
  const raw: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    if (key === 'moves_json') continue;
    raw[key] = String(value ?? '');
  }
  return raw;
}

function text(value: string | undefined, fallback = ''): string {
  const v = String(value ?? '').trim();
  return v === '' ? fallback : v;
}

function num(value: string | undefined): number | null {
  const v = String(value ?? '').trim();
  if (v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function bool(value: string | undefined): boolean {
  return String(value ?? '').trim().toLowerCase() === 'true';
}
