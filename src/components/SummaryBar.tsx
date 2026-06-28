import type { ReactNode } from 'react';
import { isBlank } from '../lib/blank';
import { cardTypeNames, type FilterState } from '../lib/filter';
import { energyLabel, kindLabel } from '../lib/labels';
import type { EnergyName } from '../lib/energy';
import type { Card, CardKind } from '../types';

type Props = {
  cards: Card[];
  filters: FilterState;
  onChange: (filters: FilterState) => void;
};

const HP_BUCKETS = [
  { label: '≤99', min: 0, max: 99 },
  { label: '100-149', min: 100, max: 149 },
  { label: '150-199', min: 150, max: 199 },
  { label: '200-249', min: 200, max: 249 },
  { label: '250+', min: 250, max: Number.POSITIVE_INFINITY },
];

export default function SummaryBar({ cards, filters, onChange }: Props) {
  const kindCounts = countValues(cards.map((card) => card.kind));
  const typeCounts = countValues(cards.flatMap(cardTypeNames));
  const stageCounts = countValues(cards.map((card) => card.stageOrType).filter((value) => !isBlank(value)));
  const maxKind = maxCount(kindCounts);
  const maxType = maxCount(typeCounts);
  const maxStage = maxCount(stageCounts);
  const hpCounts = HP_BUCKETS.map((bucket) => ({
    ...bucket,
    count: cards.filter((card) => card.hp != null && card.hp >= bucket.min && card.hp <= bucket.max).length,
  }));
  const maxHp = Math.max(1, ...hpCounts.map((bucket) => bucket.count));

  return (
    <section className="summary-bar" aria-label="サマリー">
      <SummaryGroup title="種別">
        {kindCounts.map(([kind, total]) => (
          <SummaryButton
            key={kind}
            label={kindLabel(kind as CardKind)}
            count={total}
            max={maxKind}
            active={filters.kinds.includes(kind as CardKind)}
            onClick={() => onChange({ ...filters, kinds: toggle(filters.kinds, kind as CardKind) })}
          />
        ))}
      </SummaryGroup>

      <SummaryGroup title="タイプ">
        {typeCounts.map(([type, total]) => (
          <SummaryButton
            key={type}
            label={energyLabel(type as EnergyName)}
            count={total}
            max={maxType}
            active={filters.types.includes(type as EnergyName)}
            onClick={() => onChange({ ...filters, types: toggle(filters.types, type as EnergyName) })}
          />
        ))}
      </SummaryGroup>

      <SummaryGroup title="進化段階/種類">
        {stageCounts.slice(0, 8).map(([stage, total]) => (
          <SummaryButton
            key={stage}
            label={stage}
            count={total}
            max={maxStage}
            active={filters.stageOrTypes.includes(stage)}
            onClick={() => onChange({ ...filters, stageOrTypes: toggle(filters.stageOrTypes, stage) })}
          />
        ))}
      </SummaryGroup>

      <div className="summary-group hp-summary">
        <h2>HP</h2>
        <div>
          {hpCounts.map((bucket) => (
            <span key={bucket.label} title={`${bucket.label}: ${bucket.count}`}>
              <i style={{ height: `${Math.max(8, (bucket.count / maxHp) * 54)}px` }} />
              <small>{bucket.label}</small>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function SummaryGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="summary-group">
      <h2>{title}</h2>
      <div>{children}</div>
    </div>
  );
}

function SummaryButton({
  label,
  count,
  max,
  active,
  onClick,
}: {
  label: string;
  count: number;
  max: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className={active ? 'is-active' : ''} onClick={onClick}>
      <span style={{ width: `${Math.max(6, (count / max) * 100)}%` }} />
      <strong>{label}</strong>
      <small>{count}</small>
    </button>
  );
}

function countValues<T extends string>(values: T[]): Array<[T, number]> {
  const counts = new Map<T, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function maxCount(values: Array<[string, number]>): number {
  return Math.max(1, ...values.map(([, count]) => count));
}

function toggle<T>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}
