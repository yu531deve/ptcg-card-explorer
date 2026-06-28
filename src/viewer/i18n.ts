import type { CardLanguage } from '../types';

export type Lang = CardLanguage; // 'JP' | 'EN'

// Static UI strings. Keys are referenced from the viewer via t(lang, key).
const DICT: Record<string, { JP: string; EN: string }> = {
  searchMode: { JP: '検索モード', EN: 'Search' },
  deckMode: { JP: 'デッキ作成モード', EN: 'Deck' },
  themeToggle: { JP: 'ライト / ダーク切替', EN: 'Light / dark' },

  filters: { JP: 'フィルター', EN: 'Filters' },
  clearAll: { JP: 'すべてクリア', EN: 'Clear all' },

  compareTray: { JP: '比較トレイ', EN: 'Compare tray' },
  openCompare: { JP: '比較トレイを開く', EN: 'Open compare tray' },
  images: { JP: '画像', EN: 'Images' },
  details: { JP: '詳細', EN: 'Details' },
  removeAll: { JP: 'すべて外す', EN: 'Remove all' },
  collapse: { JP: 'たたむ', EN: 'Collapse' },
  remove: { JP: '外す', EN: 'Remove' },
  compareEmpty: { JP: 'カードの ＋ を押して見比べたいカードを追加', EN: 'Press ＋ on a card to add it for comparison' },

  hp: { JP: 'HP', EN: 'HP' },
  type: { JP: 'タイプ', EN: 'Type' },
  weakness: { JP: '弱点', EN: 'Weakness' },
  resistance: { JP: '抵抗力', EN: 'Resistance' },
  retreat: { JP: 'にげる', EN: 'Retreat' },
  retreatEnergy: { JP: 'にげるエネルギー', EN: 'Retreat cost' },
  maxDpe: { JP: '最大DPE', EN: 'Max DPE' },
  ability: { JP: '特性', EN: 'Ability' },
  abilityShort: { JP: '特性', EN: 'Abil.' },
  attacks: { JP: 'ワザ', EN: 'Attacks' },
  expansion: { JP: '拡張', EN: 'Expansion' },
  category: { JP: 'カテゴリ', EN: 'Category' },

  searchPlaceholder: { JP: '名前・ID・タイプ・ワザ・特性で検索…', EN: 'Search name, ID, type, attack, ability…' },
  favorites: { JP: 'お気に入り', EN: 'Favorites' },
  favoritesOnly: { JP: 'お気に入りのみ', EN: 'Favorites only' },
  gridView: { JP: 'グリッド表示', EN: 'Grid view' },
  tableView: { JP: 'テーブル表示', EN: 'Table view' },
  sortDir: { JP: '昇順 / 降順', EN: 'Asc / desc' },

  noResults: { JP: '該当するカードがありません', EN: 'No cards match' },
  noResultsHint: { JP: '検索語やフィルターを調整してください', EN: 'Try adjusting your search or filters' },
  clearConditions: { JP: '条件をすべてクリア', EN: 'Clear all conditions' },

  colName: { JP: '名前', EN: 'Name' },
  colKind: { JP: '種別', EN: 'Kind' },
  colStage: { JP: '段階/種類', EN: 'Stage / Type' },
  colActions: { JP: '操作', EN: 'Actions' },

  prevCard: { JP: '前のカード', EN: 'Previous card' },
  nextCard: { JP: '次のカード', EN: 'Next card' },
  compare: { JP: '比較', EN: 'Compare' },
  showMore: { JP: 'さらに表示', EN: 'Show more' },

  deckBanner: {
    JP: 'デッキ作成モードは近日対応。60枚 / 同名カードは4枚まで / たねポケモン1枚以上 のルール検証を実装予定。一覧から候補を探しつつ ★・比較 で目星をつけられます。',
    EN: 'Deck builder coming soon. Rule checks (60 cards / max 4 per name / at least 1 Basic) are planned. Browse candidates and mark them with ★ / Compare.',
  },

  // Facet group labels (keyed facet_<facetKey>).
  facet_supertype: { JP: '種別', EN: 'Kind' },
  facet_stage: { JP: '進化段階', EN: 'Stage' },
  facet_type: { JP: 'タイプ', EN: 'Type' },
  facet_catTags: { JP: 'カテゴリ', EN: 'Category' },
  facet_expansion: { JP: '拡張', EN: 'Expansion' },
  facet_flagTags: { JP: 'フラグ', EN: 'Flags' },
  facet_hasAbility: { JP: '特性', EN: 'Ability' },
  hasAbilityOpt: { JP: '特性あり', EN: 'Has Ability' },

  // Sort options (keyed sort_<value>).
  sort_id: { JP: '#ID 順', EN: '#ID' },
  sort_name: { JP: '名前 順', EN: 'Name' },
  sort_hp: { JP: 'HP 順', EN: 'HP' },
  sort_retreat: { JP: 'にげる 順', EN: 'Retreat' },
  sort_dpe: { JP: '火力(DPE) 順', EN: 'Power (DPE)' },
  sort_expansion: { JP: '拡張 順', EN: 'Expansion' },
};

export function t(lang: Lang, key: string): string {
  const entry = DICT[key];
  return entry ? entry[lang] : key;
}

// Canonical (JP) card-derived values → English. Used for stage/supertype/category
// /flag/type labels that the model normalizes to Japanese regardless of source.
const VALUE_EN: Record<string, string> = {
  // supertype
  'ポケモン': 'Pokémon', 'トレーナーズ': 'Trainer', 'エネルギー': 'Energy', 'その他': 'Other',
  // evolution stage
  'たね': 'Basic', '1進化': 'Stage 1', '2進化': 'Stage 2',
  // category tags
  'ポケモンex': 'Pokémon ex', 'メガポケモン': 'Mega Pokémon', 'サポート': 'Supporter',
  'グッズ': 'Item', 'ポケモンのどうぐ': 'Pokémon Tool', 'スタジアム': 'Stadium',
  '基本エネルギー': 'Basic Energy', '特殊エネルギー': 'Special Energy',
  // flags
  'メガ': 'Mega', 'テラ': 'Tera',
  // energy types
  '草': 'Grass', '炎': 'Fire', '水': 'Water', '雷': 'Lightning', '超': 'Psychic',
  '闘': 'Fighting', '悪': 'Darkness', '鋼': 'Metal', '竜': 'Dragon', '無': 'Colorless',
};

// Translate a canonical value for display. JP passes through; EN maps known tokens
// and leaves anything else (raw data, proper nouns, 'ex', 'ACE SPEC') unchanged.
export function tv(lang: Lang, value: string | null | undefined): string {
  if (value == null) return '';
  if (lang === 'JP') return value;
  return VALUE_EN[value] ?? value;
}
