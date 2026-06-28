import { EMPTY_FILTERS, type FilterState } from './filter';
import { DEFAULT_SORT, SORT_KEYS } from './sort';
import type { CardKind, FlagKey, SortDirection, SortKey, SortState, ViewMode } from '../types';
import type { EnergyName } from './energy';

type UrlState = {
  filters: FilterState;
  viewMode: ViewMode;
  sort: SortState;
};

const KIND_VALUES: CardKind[] = ['Pokémon', 'Trainer', 'Energy', 'Unknown'];
const TYPE_VALUES: EnergyName[] = [
  'Fire',
  'Water',
  'Grass',
  'Lightning',
  'Psychic',
  'Fighting',
  'Darkness',
  'Metal',
  'Colorless',
  'Dragon',
  'Unknown',
];
const FLAG_VALUES: FlagKey[] = ['ex', 'mega', 'aceSpec', 'tera'];

export function readUrlState(): UrlState {
  if (typeof window === 'undefined') {
    return { filters: EMPTY_FILTERS, viewMode: 'table', sort: DEFAULT_SORT };
  }

  return parseUrlState(window.location.search);
}

export function parseUrlState(search: string): UrlState {
  const params = new URLSearchParams(search);
  const sortParam = params.get('sort') ?? '';
  const [sortKey, sortDirection] = sortParam.split(':');

  return {
    filters: {
      query: params.get('q') ?? '',
      kinds: readList(params, 'kind', KIND_VALUES),
      stageOrTypes: readFreeList(params, 'stage'),
      types: readList(params, 'type', TYPE_VALUES),
      categories: readFreeList(params, 'category'),
      expansions: readFreeList(params, 'expansion'),
      flags: readList(params, 'flag', FLAG_VALUES),
      hasAbility: params.get('ability') === '1',
    },
    viewMode: params.get('view') === 'grid' ? 'grid' : 'table',
    sort: {
      key: isSortKey(sortKey) ? sortKey : DEFAULT_SORT.key,
      direction: isDirection(sortDirection) ? sortDirection : DEFAULT_SORT.direction,
    },
  };
}

export function syncUrlState({ filters, viewMode, sort }: UrlState): void {
  if (typeof window === 'undefined') return;

  const next = createUrlSearch({ filters, viewMode, sort });
  const current = window.location.search.replace(/^\?/, '');
  if (next !== current) {
    const url = `${window.location.pathname}${next ? `?${next}` : ''}${window.location.hash}`;
    window.history.replaceState(null, '', url);
  }
}

export function createUrlSearch({ filters, viewMode, sort }: UrlState): string {
  const params = new URLSearchParams();
  if (filters.query.trim()) params.set('q', filters.query.trim());
  writeList(params, 'kind', filters.kinds);
  writeList(params, 'stage', filters.stageOrTypes);
  writeList(params, 'type', filters.types);
  writeList(params, 'category', filters.categories);
  writeList(params, 'expansion', filters.expansions);
  writeList(params, 'flag', filters.flags);
  if (filters.hasAbility) params.set('ability', '1');
  if (viewMode !== 'table') params.set('view', viewMode);
  if (sort.key !== DEFAULT_SORT.key || sort.direction !== DEFAULT_SORT.direction) {
    params.set('sort', `${sort.key}:${sort.direction}`);
  }
  return params.toString();
}

function readList<T extends string>(params: URLSearchParams, key: string, allowed: readonly T[]): T[] {
  const allowedSet = new Set(allowed);
  return readFreeList(params, key).filter((value): value is T => allowedSet.has(value as T));
}

function readFreeList(params: URLSearchParams, key: string): string[] {
  const value = params.get(key);
  return value ? value.split(',').filter(Boolean) : [];
}

function writeList(params: URLSearchParams, key: string, values: string[]) {
  if (values.length) params.set(key, values.join(','));
}

function isSortKey(value: string): value is SortKey {
  return SORT_KEYS.includes(value as SortKey);
}

function isDirection(value: string): value is SortDirection {
  return value === 'asc' || value === 'desc';
}
