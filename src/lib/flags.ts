import type { Card } from '../types';

export function deriveFlags(rule: string, category: string): Card['flags'] {
  return {
    mega: rule === 'Mega Pokémon ex',
    ex: rule === 'Pokémon ex' || rule === 'Mega Pokémon ex',
    aceSpec: rule === 'ACE SPEC',
    tera: /^Tera\(/.test(category),
  };
}
