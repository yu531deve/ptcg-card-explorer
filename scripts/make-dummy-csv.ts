import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const EN_HEADERS = [
  'Card ID',
  'Card Name',
  'Expansion',
  'Collection No.',
  'Stage (Pokémon)/Type (Energy and Trainer)',
  'Rule',
  'Category',
  'Previous stage',
  'HP',
  'Type',
  'Weakness',
  'Resistance (Type)',
  'Retreat',
  'Move Name',
  'Cost',
  'Damage',
  'Effect Explanation',
];

const JP_HEADERS = [
  'カード ID',
  'カード名',
  'エキスパンションマーク',
  'コレクション番号',
  'ポケモンの進化の段階/エネルギー・トレーナーズの種類',
  'ルール',
  'カテゴリ',
  '進化前',
  'HP',
  'タイプ',
  '弱点',
  '抵抗力',
  'にげる',
  'ワザ名',
  'コスト',
  'ダメージ',
  '効果の説明',
];

type Row = string[];

const enRows: Row[] = [
  ['1001', 'Ember Lynx ex', 'ABC', '001', 'Basic Pokémon', 'Pokémon ex', 'Tera(Fire)', 'n/a', '220', '{R}', '{W}', 'n/a', '2', '[Tera]', 'n/a', 'n/a', 'As long as this Pokémon is on your Bench, prevent all damage done to it by attacks.'],
  ['1001', 'Ember Lynx ex', 'ABC', '001', 'Basic Pokémon', 'Pokémon ex', 'Tera(Fire)', 'n/a', '220', '{R}', '{W}', 'n/a', '2', 'Blazing Pounce', '{R}{C}●', '90+', 'If this Pokémon has any damage counters on it, this attack does 60 more damage.'],
  ['1002', 'River Otter', 'ABC', '002', 'Stage 1 Pokémon', 'n/a', 'Future', 'Stream Pup', '110', '{W}', '{L}', 'n/a', '1', 'Aqua Draw', '{W}', '30', 'Draw a card.'],
  ['1003', 'Garden Sage', 'ABC', '003', 'Supporter', 'n/a', "Trainer's Pokémon(Iono)", 'n/a', 'n/a', 'n/a', 'n/a', 'n/a', 'n/a', 'Supporter', 'n/a', 'n/a', 'Search your deck for up to 2 Basic Pokémon and put them onto your Bench.'],
  ['1004', 'Rocket Patch', 'ABC', '004', 'Item', 'ACE SPEC', "Trainer's Pokémon(Team Rocket)", 'n/a', 'n/a', 'n/a', 'n/a', 'n/a', 'n/a', 'Item', 'n/a', 'n/a', 'Attach a {Team Rocket} Energy from your discard pile to 1 of your Pokémon.'],
  ['1005', 'Prism Energy', 'ABC', 'GRA', 'Special Energy', 'n/a', 'n/a', 'n/a', 'n/a', '{C}', 'n/a', 'n/a', 'n/a', 'Energy', 'n/a', 'n/a', 'This card provides {C} Energy.'],
  ['1006', 'Drake Meteor', 'ABC', '005', 'Stage 2 Pokémon', 'Mega Pokémon ex', 'Tera(Stellar)', 'Drake Wing', '330', '竜', 'n/a', 'n/a', '3', 'Meteor Break', '{R}{W}●', '220', 'Discard 2 Energy from this Pokémon.'],
  ['1006', 'Drake Meteor', 'ABC', '005', 'Stage 2 Pokémon', 'Mega Pokémon ex', 'Tera(Stellar)', 'Drake Wing', '330', '竜', 'n/a', 'n/a', '3', 'Stellar Guard', '{A}{A}', 'n/a', 'During your opponent’s next turn, this Pokémon takes 80 less damage from attacks.'],
];

const jpRows: Row[] = [
  ['1001', 'エンバーリンクスex', 'ABC', '001', '基本ポケモン', 'Pokémon ex', 'Tera(Fire)', 'n/a', '220', '炎', '水', 'n/a', '2', '[Tera]', 'n/a', 'n/a', 'このポケモンがベンチにいるかぎり、ワザのダメージを受けない。'],
  ['1001', 'エンバーリンクスex', 'ABC', '001', '基本ポケモン', 'Pokémon ex', 'Tera(Fire)', 'n/a', '220', '炎', '水', 'n/a', '2', 'ブレイズパウンス', '炎無●', '90+', 'このポケモンにダメカンがのっているなら、60ダメージ追加。'],
  ['1002', 'リバーオッター', 'ABC', '002', '1進化ポケモン', 'n/a', 'Future', 'ストリームパップ', '110', '水', '雷', 'n/a', '1', 'アクアドロー', '水', '30', '山札を1枚引く。'],
  ['1003', 'ガーデンセージ', 'ABC', '003', 'サポート', 'n/a', "Trainer's Pokémon(Iono)", 'n/a', 'n/a', 'n/a', 'n/a', 'n/a', 'n/a', 'サポート', 'n/a', 'n/a', '山札からたねポケモンを2枚までベンチに出す。'],
  ['1004', 'ロケットパッチ', 'ABC', '004', 'グッズ', 'ACE SPEC', "Trainer's Pokémon(Team Rocket)", 'n/a', 'n/a', 'n/a', 'n/a', 'n/a', 'n/a', 'グッズ', 'n/a', 'n/a', 'トラッシュから{Team Rocket}エネルギーを1枚選び、自分のポケモンにつける。'],
  ['1005', 'プリズムエネルギー', 'ABC', 'GRA', '特殊エネルギー', 'n/a', 'n/a', 'n/a', 'n/a', '無', 'n/a', 'n/a', 'n/a', 'エネルギー', 'n/a', 'n/a', 'このカードは無色エネルギー1個ぶんとしてはたらく。'],
  ['1006', 'ドレイクメテオ', 'ABC', '005', '2進化ポケモン', 'Mega Pokémon ex', 'Tera(Stellar)', 'ドレイクウィング', '330', '竜', 'n/a', 'n/a', '3', 'メテオブレイク', '炎水●', '220', 'このポケモンについているエネルギーを2個トラッシュする。'],
  ['1006', 'ドレイクメテオ', 'ABC', '005', '2進化ポケモン', 'Mega Pokémon ex', 'Tera(Stellar)', 'ドレイクウィング', '330', '竜', 'n/a', 'n/a', '3', 'ステラーガード', '{A}{A}', 'n/a', '次の相手の番、このポケモンが受けるワザのダメージは80少なくなる。'],
];

function quote(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function toCsv(headers: string[], rows: Row[]) {
  return [headers, ...rows].map((row) => row.map(quote).join(',')).join('\n') + '\n';
}

const outDir = join(process.cwd(), 'dummy');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'dummy_en.csv'), toCsv(EN_HEADERS, enRows), 'utf8');
writeFileSync(join(outDir, 'dummy_jp.csv'), toCsv(JP_HEADERS, jpRows), 'utf8');
console.log('Generated dummy/dummy_en.csv and dummy/dummy_jp.csv');
