import type { ReactNode } from 'react';
import { isBlank } from '../lib/blank';
import { cardTypeNames, EMPTY_FILTERS, type FilterState } from '../lib/filter';
import { energyLabel, kindLabel } from '../lib/labels';
import type { EnergyName } from '../lib/energy';
import type { Card, CardKind, FlagKey } from '../types';

type Props = {
  cards: Card[];
  filters: FilterState;
  onChange: (filters: FilterState) => void;
};

type Option<T extends string> = {
  value: T;
  label: string;
  count: number;
};

const KIND_ORDER: CardKind[] = ['Pokémon', 'Trainer', 'Energy', 'Unknown'];
const TYPE_ORDER: EnergyName[] = [
  'Grass',
  'Fire',
  'Water',
  'Lightning',
  'Psychic',
  'Fighting',
  'Darkness',
  'Metal',
  'Colorless',
  'Dragon',
  'Unknown',
];
const FLAG_LABEL: Record<FlagKey, string> = {
  ex: 'ex',
  mega: 'メガ',
  aceSpec: 'ACE SPEC',
  tera: 'テラ',
};

export default function FilterPanel({ cards, filters, onChange }: Props) {
  const facets = buildFacets(cards);
  const chips = buildChips(filters);

  return (
    <section className="filter-panel" aria-label="Filters">
      <FacetGroup title="種別">
        {facets.kinds.map((option) => (
          <FacetToggle
            key={option.value}
            option={option}
            active={filters.kinds.includes(option.value)}
            onClick={() => onChange({ ...filters, kinds: toggle(filters.kinds, option.value) })}
          />
        ))}
      </FacetGroup>

      <FacetGroup title="進化段階/種類">
        {facets.stageOrTypes.map((option) => (
          <FacetToggle
            key={option.value}
            option={option}
            active={filters.stageOrTypes.includes(option.value)}
            onClick={() => onChange({ ...filters, stageOrTypes: toggle(filters.stageOrTypes, option.value) })}
          />
        ))}
      </FacetGroup>

      <FacetGroup title="タイプ">
        {facets.types.map((option) => (
          <FacetToggle
            key={option.value}
            option={option}
            active={filters.types.includes(option.value)}
            onClick={() => onChange({ ...filters, types: toggle(filters.types, option.value) })}
          />
        ))}
      </FacetGroup>

      <FacetGroup title="カテゴリ">
        {facets.categories.map((option) => (
          <FacetToggle
            key={option.value}
            option={option}
            active={filters.categories.includes(option.value)}
            onClick={() => onChange({ ...filters, categories: toggle(filters.categories, option.value) })}
          />
        ))}
      </FacetGroup>

      <FacetGroup title="拡張">
        {facets.expansions.map((option) => (
          <FacetToggle
            key={option.value}
            option={option}
            active={filters.expansions.includes(option.value)}
            onClick={() => onChange({ ...filters, expansions: toggle(filters.expansions, option.value) })}
          />
        ))}
      </FacetGroup>

      <FacetGroup title="フラグ">
        {facets.flags.map((option) => (
          <FacetToggle
            key={option.value}
            option={option}
            active={filters.flags.includes(option.value)}
            onClick={() => onChange({ ...filters, flags: toggle(filters.flags, option.value) })}
          />
        ))}
      </FacetGroup>

      <FacetGroup title="特性">
        <FacetToggle
          option={{ value: 'hasAbility', label: '特性あり', count: facets.abilityCount }}
          active={Boolean(filters.hasAbility)}
          onClick={() => onChange({ ...filters, hasAbility: !filters.hasAbility })}
        />
      </FacetGroup>

      {chips.length ? (
        <div className="active-chips" aria-label="Active filters">
          {chips.map((chip) => (
            <button type="button" key={`${chip.key}-${chip.value}`} onClick={() => onChange(removeChip(filters, chip))}>
              <span>{chip.label}</span>
              <strong>×</strong>
            </button>
          ))}
          <button type="button" className="clear-chip" onClick={() => onChange(EMPTY_FILTERS)}>
            全クリア
          </button>
        </div>
      ) : null}
    </section>
  );
}

function FacetGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="facet-group">
      <h2>{title}</h2>
      <div>{children}</div>
    </div>
  );
}

function FacetToggle<T extends string>({
  option,
  active,
  onClick,
}: {
  option: Option<T>;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className={active ? 'is-active' : ''} onClick={onClick}>
      <span>{option.label}</span>
      <small>{option.count}</small>
    </button>
  );
}

function buildFacets(cards: Card[]) {
  return {
    kinds: KIND_ORDER.map((kind) => ({ value: kind, label: kindLabel(kind), count: count(cards, (card) => card.kind === kind) })).filter(
      (option) => option.count > 0,
    ),
    stageOrTypes: countedOptions(cards.map((card) => card.stageOrType).filter((value) => !isBlank(value))),
    types: TYPE_ORDER.map((type) => ({
      value: type,
      label: energyLabel(type),
      count: count(cards, (card) => cardTypeNames(card).includes(type)),
    })).filter((option) => option.count > 0),
    categories: countedOptions(cards.map((card) => card.category).filter((value) => !isBlank(value))),
    expansions: countedOptions(cards.map((card) => card.expansion).filter((value) => !isBlank(value))),
    flags: (Object.keys(FLAG_LABEL) as FlagKey[])
      .map((flag) => ({ value: flag, label: FLAG_LABEL[flag], count: count(cards, (card) => card.flags[flag]) }))
      .filter((option) => option.count > 0),
    abilityCount: count(cards, (card) => Boolean(card.hasAbility)),
  };
}

function countedOptions<T extends string>(values: T[]): Option<T>[] {
  const counts = new Map<T, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return Array.from(counts.entries())
    .map(([value, itemCount]) => ({ value, label: value, count: itemCount }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function count(cards: Card[], predicate: (card: Card) => boolean) {
  return cards.reduce((total, card) => total + (predicate(card) ? 1 : 0), 0);
}

function toggle<T>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

type Chip = {
  key: keyof FilterState;
  value: string;
  label: string;
};

function buildChips(filters: FilterState): Chip[] {
  const chips: Chip[] = [];
  if (!isBlank(filters.query)) chips.push({ key: 'query', value: filters.query, label: `検索: ${filters.query}` });
  for (const value of filters.kinds) chips.push({ key: 'kinds', value, label: kindLabel(value) });
  for (const value of filters.stageOrTypes) chips.push({ key: 'stageOrTypes', value, label: value });
  for (const value of filters.types) chips.push({ key: 'types', value, label: energyLabel(value) });
  for (const value of filters.categories) chips.push({ key: 'categories', value, label: value });
  for (const value of filters.expansions) chips.push({ key: 'expansions', value, label: value });
  for (const value of filters.flags) chips.push({ key: 'flags', value, label: FLAG_LABEL[value] });
  if (filters.hasAbility) chips.push({ key: 'hasAbility', value: 'hasAbility', label: '特性あり' });
  return chips;
}

function removeChip(filters: FilterState, chip: Chip): FilterState {
  if (chip.key === 'query') return { ...filters, query: '' };
  if (chip.key === 'hasAbility') return { ...filters, hasAbility: false };
  const current = filters[chip.key] as string[];
  return { ...filters, [chip.key]: current.filter((value) => value !== chip.value) };
}
