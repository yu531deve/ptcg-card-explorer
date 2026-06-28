import { ENERGY_COLOR, parseEnergySymbols } from '../lib/energy';
import { energyLabel } from '../lib/labels';

type Props = {
  value: string;
  compact?: boolean;
};

export default function EnergyPip({ value, compact = false }: Props) {
  const tokens = parseEnergySymbols(value);

  if (!tokens.length) return <span className="muted">n/a</span>;

  return (
    <span className={`energy-pips${compact ? ' is-compact' : ''}`} aria-label={value}>
      {tokens.map((token, index) => (
        <span
          className="energy-pip"
          style={{ backgroundColor: ENERGY_COLOR[token.energy] }}
          title={`${energyLabel(token.energy)}: ${token.label}`}
          key={`${token.raw}-${index}`}
        >
          {labelFor(token.label)}
        </span>
      ))}
    </span>
  );
}

function labelFor(label: string) {
  if (/^\{.+\}$/.test(label)) return label.slice(1, -1);
  return label;
}
