import { isBlank } from './blank';
import { parseEnergySymbols, type EnergyName } from './energy';
import type { Card, CardKind, FlagKey } from '../types';

export type FilterState = {
  query: string;
  kinds: CardKind[];
  stageOrTypes: string[];
  types: EnergyName[];
  categories: string[];
  expansions: string[];
  flags: FlagKey[];
  hasAbility?: boolean;
};

export const EMPTY_FILTERS: FilterState = {
  query: '',
  kinds: [],
  stageOrTypes: [],
  types: [],
  categories: [],
  expansions: [],
  flags: [],
  hasAbility: false,
};

export function filterCards(cards: Card[], filters: FilterState): Card[] {
  return cards.filter((card) => matchesAllFilters(card, filters));
}

export function matchesAllFilters(card: Card, filters: FilterState): boolean {
  if (!matchesQuery(card, filters.query)) return false;
  if (filters.kinds.length && !filters.kinds.includes(card.kind)) return false;
  if (filters.stageOrTypes.length && !filters.stageOrTypes.includes(card.stageOrType)) return false;
  if (filters.types.length && !cardHasAnyType(card, filters.types)) return false;
  if (filters.categories.length && !filters.categories.includes(card.category)) return false;
  if (filters.expansions.length && !filters.expansions.includes(card.expansion)) return false;
  if (filters.flags.length && !filters.flags.some((flag) => card.flags[flag])) return false;
  if (filters.hasAbility && !card.hasAbility) return false;
  return true;
}

export function matchesQuery(card: Card, query: string): boolean {
  if (isBlank(query)) return true;
  const needle = normalizeSearchText(query);
  const haystack = normalizeSearchText(
    [card.name, card.rule, ...card.moves.map((move) => `${move.name} ${move.effect}`)].join(' '),
  );
  return haystack.includes(needle);
}

export function normalizeSearchText(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase();
}

export function hasActiveFilters(filters: FilterState): boolean {
  return (
    !isBlank(filters.query) ||
    filters.kinds.length > 0 ||
    filters.stageOrTypes.length > 0 ||
    filters.types.length > 0 ||
    filters.categories.length > 0 ||
    filters.expansions.length > 0 ||
    filters.flags.length > 0 ||
    Boolean(filters.hasAbility)
  );
}

export function cardTypeNames(card: Card): EnergyName[] {
  return Array.from(new Set(parseEnergySymbols(card.type).map((token) => token.energy)));
}

function cardHasAnyType(card: Card, types: EnergyName[]) {
  const cardTypes = cardTypeNames(card);
  return types.some((type) => cardTypes.includes(type));
}
