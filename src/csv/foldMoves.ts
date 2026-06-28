import { deriveKind } from '../lib/deriveKind';
import {
  aggregateCard,
  deriveFlags,
  deriveMove,
  derivePrizeValue,
  deriveStage,
} from '../lib/cardTransform';
import { displayValue, isBlank, nullableNumber } from '../lib/blank';
import type { Card, CardLanguage, Move } from '../types';
import type { InternalKey } from './columnMap';

export type MappedRow = Partial<Record<InternalKey, string>> & {
  raw: Record<string, string>;
};

export type FoldResult = {
  cards: Card[];
  warnings: string[];
};

export function foldMoves(rows: MappedRow[], lang: CardLanguage): FoldResult {
  const grouped = new Map<number, MappedRow[]>();
  const warnings: string[] = [];

  for (const [index, row] of rows.entries()) {
    const cardId = nullableNumber(row.cardId);
    if (cardId == null) {
      warnings.push(`Row ${index + 2}: Card ID is missing or invalid.`);
      continue;
    }
    const bucket = grouped.get(cardId) ?? [];
    bucket.push(row);
    grouped.set(cardId, bucket);
  }

  const cards = Array.from(grouped.entries())
    .sort(([a], [b]) => a - b)
    .map(([cardId, cardRows]) => {
      const first = cardRows[0];
      const stageOrType = displayValue(first.stageOrType);
      const category = displayValue(first.category);
      const rule = displayValue(first.rule);
      const raw = cardRows.reduce<Record<string, string>>((acc, row) => ({ ...acc, ...row.raw }), {});
      const moves = cardRows.map(rowToMove).filter((move) => !isEmptyMove(move));

      const flags = deriveFlags(rule, category);
      const aggregate = aggregateCard(moves);

      return {
        cardId,
        name: displayValue(first.name, `Card ${cardId}`),
        kind: deriveKind(stageOrType),
        stageOrType,
        category,
        rule,
        flags,
        prevStage: isBlank(first.prevStage) ? undefined : first.prevStage?.trim(),
        hp: nullableNumber(first.hp),
        type: displayValue(first.type),
        weakness: displayValue(first.weakness),
        resistance: displayValue(first.resistance),
        retreat: nullableNumber(first.retreat),
        expansion: displayValue(first.expansion),
        collectionNo: displayValue(first.collectionNo),
        moves,
        raw,
        _lang: lang,
        stage: deriveStage(stageOrType),
        prizeValue: derivePrizeValue(flags),
        hasAbility: aggregate.hasAbility,
        abilityCount: aggregate.abilityCount,
        hasWeakness: !isBlank(first.weakness),
        hasResistance: !isBlank(first.resistance),
        bestDpe: aggregate.bestDpe,
        peakDamage: aggregate.peakDamage,
        nMoves: aggregate.nMoves,
      } satisfies Card;
    });

  return { cards, warnings };
}

function rowToMove(row: MappedRow): Move {
  return deriveMove({
    name: displayValue(row.moveName),
    cost: displayValue(row.cost),
    damage: displayValue(row.damage),
    effect: displayValue(row.effect),
  });
}

function isEmptyMove(move: Move): boolean {
  return isBlank(move.name) && isBlank(move.cost) && isBlank(move.damage) && isBlank(move.effect);
}
