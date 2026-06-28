import type { Card, Deck, DeckEntry } from '../types';

// --- Pokémon TCG deck rules (Standard / this competition) ---------------------
// These constants and helpers define the deck-building domain so the deck
// builder UI can be added later without re-deriving the rules. The compare /
// search features do not depend on building a deck, but the model is ready.

export const DECK_SIZE = 60;
// Max copies of cards sharing the same name, except Basic Energy (unlimited).
export const MAX_COPIES_PER_NAME = 4;

export const EMPTY_DECK: Deck = { name: '新しいデッキ', entries: [] };

export function isBasicEnergy(card: Card): boolean {
  return card.kind === 'Energy' && /基本/.test(card.stageOrType);
}

export function isBasicPokemon(card: Card): boolean {
  return card.kind === 'Pokémon' && card.stage === 0;
}

// A card name can be held in unlimited quantity only if it is a Basic Energy.
export function copyLimitFor(card: Card): number {
  return isBasicEnergy(card) ? Infinity : MAX_COPIES_PER_NAME;
}

export function deckTotalCount(deck: Deck): number {
  return deck.entries.reduce((total, entry) => total + entry.count, 0);
}

export function entryFor(deck: Deck, cardId: number): DeckEntry | undefined {
  return deck.entries.find((entry) => entry.cardId === cardId);
}

// Total copies already in the deck that share this card's name (for the 4-copy
// rule, which is per-name rather than per-id).
export function countByName(deck: Deck, cards: Map<number, Card>, name: string): number {
  return deck.entries.reduce((total, entry) => {
    const card = cards.get(entry.cardId);
    return card && card.name === name ? total + entry.count : total;
  }, 0);
}

export type DeckValidation = {
  ok: boolean;
  total: number;
  errors: string[];
  warnings: string[];
};

// Validates a deck against the core rules. Returns human-readable Japanese
// messages so the future deck panel can surface them directly.
export function validateDeck(deck: Deck, cards: Map<number, Card>): DeckValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const total = deckTotalCount(deck);

  if (total !== DECK_SIZE) {
    errors.push(`デッキは${DECK_SIZE}枚ちょうどにしてください（現在 ${total} 枚）。`);
  }

  let basicPokemonCount = 0;
  const perName = new Map<string, number>();
  for (const entry of deck.entries) {
    const card = cards.get(entry.cardId);
    if (!card) continue;
    if (isBasicPokemon(card)) basicPokemonCount += entry.count;
    if (!isBasicEnergy(card)) {
      perName.set(card.name, (perName.get(card.name) ?? 0) + entry.count);
    }
  }

  if (basicPokemonCount === 0) {
    errors.push('たねポケモンを1枚以上入れてください。');
  }

  for (const [name, count] of perName) {
    if (count > MAX_COPIES_PER_NAME) {
      errors.push(`「${name}」は${MAX_COPIES_PER_NAME}枚までです（現在 ${count} 枚）。`);
    }
  }

  return { ok: errors.length === 0, total, errors, warnings };
}
