import { isBlank } from './blank';

export type EnergyName =
  | 'Fire'
  | 'Water'
  | 'Grass'
  | 'Lightning'
  | 'Psychic'
  | 'Fighting'
  | 'Darkness'
  | 'Metal'
  | 'Colorless'
  | 'Dragon'
  | 'Unknown';

export type EnergyToken = {
  raw: string;
  energy: EnergyName;
  label: string;
};

export const ENERGY_COLOR: Record<EnergyName, string> = {
  Fire: '#ef6a5a',
  Water: '#48a7e6',
  Grass: '#5bc88a',
  Lightning: '#f2c14e',
  Psychic: '#b07ad6',
  Fighting: '#d08a4a',
  Darkness: '#6b7a99',
  Metal: '#9fb0c9',
  Colorless: '#d9dee8',
  Dragon: '#c9a24a',
  Unknown: '#8a97b0',
};

export const TOKEN_TO_ENERGY: Record<string, EnergyName> = {
  R: 'Fire',
  W: 'Water',
  G: 'Grass',
  L: 'Lightning',
  P: 'Psychic',
  F: 'Fighting',
  D: 'Darkness',
  M: 'Metal',
  C: 'Colorless',
  '●': 'Colorless',
  竜: 'Dragon',
  草: 'Grass',
  炎: 'Fire',
  水: 'Water',
  雷: 'Lightning',
  超: 'Psychic',
  闘: 'Fighting',
  悪: 'Darkness',
  鋼: 'Metal',
  無: 'Colorless',
};

export function parseEnergySymbols(value: string): EnergyToken[] {
  if (isBlank(value)) return [];

  const tokens: EnergyToken[] = [];
  const source = value.trim();
  let index = 0;

  while (index < source.length) {
    const char = source[index];

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    if (char === '{') {
      const end = source.indexOf('}', index + 1);
      if (end !== -1) {
        const raw = source.slice(index + 1, end);
        tokens.push(toEnergyToken(raw, `{${raw}}`));
        index = end + 1;
        continue;
      }
    }

    if (char === '●' || TOKEN_TO_ENERGY[char]) {
      tokens.push(toEnergyToken(char, char));
      index += 1;
      continue;
    }

    const nextSpecial = findNextSpecial(source, index + 1);
    const raw = source.slice(index, nextSpecial).trim();
    if (raw) tokens.push(toEnergyToken(raw, raw));
    index = nextSpecial;
  }

  return tokens;
}

export function firstEnergyName(value: string): EnergyName | null {
  return parseEnergySymbols(value)[0]?.energy ?? null;
}

function toEnergyToken(token: string, label: string): EnergyToken {
  const energy = TOKEN_TO_ENERGY[token] ?? 'Unknown';
  return { raw: token, energy, label };
}

function findNextSpecial(source: string, start: number): number {
  for (let i = start; i < source.length; i += 1) {
    if (source[i] === '{' || source[i] === '●' || TOKEN_TO_ENERGY[source[i]]) return i;
  }
  return source.length;
}
