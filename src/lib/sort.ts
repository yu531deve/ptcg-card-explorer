import type { Card, SortKey, SortState } from '../types';

export const DEFAULT_SORT: SortState = { key: 'cardId', direction: 'asc' };
export const SORT_KEYS: SortKey[] = ['cardId', 'name', 'hp', 'retreat', 'damage', 'collectionNo'];

export function sortCards(cards: Card[], sort: SortState): Card[] {
  return [...cards].sort((a, b) => compareCards(a, b, sort));
}

export function compareCards(a: Card, b: Card, sort: SortState): number {
  const direction = sort.direction === 'asc' ? 1 : -1;

  if (sort.key === 'name') return a.name.localeCompare(b.name, undefined, { numeric: true }) * direction;
  if (sort.key === 'collectionNo') {
    return a.collectionNo.localeCompare(b.collectionNo, undefined, { numeric: true }) * direction;
  }

  const aValue = numericSortValue(a, sort.key);
  const bValue = numericSortValue(b, sort.key);
  if (aValue == null && bValue == null) return a.cardId - b.cardId;
  if (aValue == null) return 1;
  if (bValue == null) return -1;
  return (aValue - bValue) * direction || a.cardId - b.cardId;
}

function numericSortValue(card: Card, key: SortKey): number | null {
  if (key === 'cardId') return card.cardId;
  if (key === 'hp') return card.hp;
  if (key === 'retreat') return card.retreat;
  if (key === 'damage') return highestDamageNumber(card);
  return null;
}

export function highestDamageNumber(card: Card): number | null {
  const values = card.moves
    .map((move) => extractFirstNumber(move.damage))
    .filter((value): value is number => value != null);
  return values.length ? Math.max(...values) : null;
}

export function extractFirstNumber(value: string): number | null {
  const match = value.normalize('NFKC').match(/\d+/);
  return match ? Number(match[0]) : null;
}
