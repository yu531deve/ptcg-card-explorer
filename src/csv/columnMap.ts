import type { CardLanguage } from '../types';

export const INTERNAL_KEYS = [
  'cardId',
  'name',
  'expansion',
  'collectionNo',
  'stageOrType',
  'rule',
  'category',
  'prevStage',
  'hp',
  'type',
  'weakness',
  'resistance',
  'retreat',
  'moveName',
  'cost',
  'damage',
  'effect',
] as const;

export type InternalKey = (typeof INTERNAL_KEYS)[number];

const HEADER_PAIRS: Array<[InternalKey, string, string]> = [
  ['cardId', 'Card ID', 'カード ID'],
  ['name', 'Card Name', 'カード名'],
  ['expansion', 'Expansion', 'エキスパンションマーク'],
  ['collectionNo', 'Collection No.', 'コレクション番号'],
  ['stageOrType', 'Stage (Pokémon)/Type (Energy and Trainer)', 'ポケモンの進化の段階/エネルギー・トレーナーズの種類'],
  ['rule', 'Rule', 'ルール'],
  ['category', 'Category', 'カテゴリ'],
  ['prevStage', 'Previous stage', '進化前'],
  ['hp', 'HP', 'HP'],
  ['type', 'Type', 'タイプ'],
  ['weakness', 'Weakness', '弱点'],
  ['resistance', 'Resistance (Type)', '抵抗力'],
  ['retreat', 'Retreat', 'にげる'],
  ['moveName', 'Move Name', 'ワザ名'],
  ['cost', 'Cost', 'コスト'],
  ['damage', 'Damage', 'ダメージ'],
  ['effect', 'Effect Explanation', '効果の説明'],
];

const HEADER_TO_KEY = new Map<string, InternalKey>();

for (const [key, enHeader, jpHeader] of HEADER_PAIRS) {
  HEADER_TO_KEY.set(normalizeHeader(enHeader), key);
  HEADER_TO_KEY.set(normalizeHeader(jpHeader), key);
}

export type HeaderMapping = {
  fields: string[];
  headerToKey: Map<string, InternalKey>;
  unknownHeaders: string[];
  missingKeys: InternalKey[];
  lang: CardLanguage;
};

export function normalizeHeader(header: string): string {
  return header
    .replace(/^\uFEFF/, '')
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[\s()（）.・/]/g, '');
}

export function stripBom(header: string): string {
  return header.replace(/^\uFEFF/, '');
}

export function mapHeaders(fields: string[]): HeaderMapping {
  const headerToKey = new Map<string, InternalKey>();
  const seenKeys = new Set<InternalKey>();
  const unknownHeaders: string[] = [];

  for (const field of fields) {
    const key = HEADER_TO_KEY.get(normalizeHeader(field));
    if (key) {
      headerToKey.set(field, key);
      seenKeys.add(key);
    } else {
      unknownHeaders.push(field);
    }
  }

  const missingKeys = INTERNAL_KEYS.filter((key) => !seenKeys.has(key));
  const normalizedFields = fields.map(normalizeHeader);
  const jpSignals = ['カードid', 'カード名', 'カテゴリ', 'ワザ名'];
  const lang: CardLanguage = jpSignals.some((signal) => normalizedFields.includes(signal)) ? 'JP' : 'EN';

  return { fields, headerToKey, unknownHeaders, missingKeys, lang };
}
