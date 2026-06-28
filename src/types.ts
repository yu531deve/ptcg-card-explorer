export type CardKind = 'Pokémon' | 'Trainer' | 'Energy' | 'Unknown';
export type CardLanguage = 'EN' | 'JP';

// Right-hand workspace mode. In "search" the side panel is the compare tray;
// in "deck" it is the deck builder.
export type AppMode = 'search' | 'deck';

// One stack of identical cards in a deck (referenced by card id + count).
export type DeckEntry = {
  cardId: number;
  count: number;
};

export type Deck = {
  name: string;
  entries: DeckEntry[];
};
export type FlagKey = 'ex' | 'mega' | 'aceSpec' | 'tera';
export type ViewMode = 'table' | 'grid';
export type SortKey = 'cardId' | 'name' | 'hp' | 'retreat' | 'damage' | 'collectionNo';
export type SortDirection = 'asc' | 'desc';
export type SortState = {
  key: SortKey;
  direction: SortDirection;
};

export type CardPdf = {
  lang: CardLanguage;
  fileName: string;
  url: string;
  indexPageCount: number;
};

export type DamageKind = 'Static' | 'Multiplier' | 'Conditional' | 'None';

export type Move = {
  name: string;
  cost: string;
  damage: string;
  effect: string;
  isAbility?: boolean;
  costTotal?: number;
  costColorless?: number;
  costTyped?: number;
  damageValue?: number | null;
  damageKind?: DamageKind;
  dpe?: number | null;
};

export type Card = {
  cardId: number;
  name: string;
  kind: CardKind;
  stageOrType: string;
  category: string;
  rule: string;
  flags: { ex: boolean; mega: boolean; aceSpec: boolean; tera: boolean };
  prevStage?: string;
  hp: number | null;
  type: string;
  weakness: string;
  resistance: string;
  retreat: number | null;
  expansion: string;
  collectionNo: string;
  moves: Move[];
  raw: Record<string, string>;
  _lang: CardLanguage;
  // Derived features from the preprocessing pipeline (cards_processed.csv).
  stage?: number | null;
  prizeValue?: number;
  hasAbility?: boolean;
  abilityCount?: number;
  hasWeakness?: boolean;
  hasResistance?: boolean;
  bestDpe?: number | null;
  peakDamage?: number | null;
  nMoves?: number;
};

export type CardBundle = {
  lang: CardLanguage;
  fileName: string;
  cards: Card[];
  rawRowCount: number;
  warnings: string[];
  fields: string[];
};
