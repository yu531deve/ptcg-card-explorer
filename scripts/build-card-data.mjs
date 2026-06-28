// Preprocesses data/JP_Card_Data.csv (long format, Japanese headers) into a
// clean, one-row-per-card feature table at data/cards_processed.csv.
//
// Run: npm run build:data
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Papa from 'papaparse';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const INPUT = join(root, 'data', 'JP_Card_Data.csv');
const OUTPUT = join(root, 'data', 'cards_processed.csv');

// Source (Japanese) column names.
const COL = {
  id: 'カード ID',
  name: 'カード名',
  expansion: 'エキスパンションマーク',
  collectionNo: 'コレクション番号',
  stageLabel: 'ポケモンの進化の段階/エネルギー・トレーナーズの種類',
  rule: 'ルール',
  category: 'カテゴリ',
  prevStage: '進化前',
  hp: 'HP',
  type: 'タイプ',
  weakness: '弱点',
  resistance: '抵抗力',
  retreat: 'にげる',
  moveName: 'ワザ名',
  cost: 'コスト',
  damage: 'ダメージ',
  effect: '効果の説明',
};

// Energy symbols used in the Cost column: ● is colorless, the kanji are typed.
const ENERGY_SYMBOLS = '●草炎水雷超闘悪鋼竜無';

const TRAINER_LABELS = new Set(['グッズ', 'サポート', 'ポケモンのどうぐ', 'ポケモンの道具', 'スタジアム']);
const ENERGY_LABELS = new Set(['基本エネルギー', '特殊エネルギー']);

// Turn explicit-missing markers into a real empty string and trim whitespace.
function norm(value) {
  const v = String(value ?? '').trim();
  if (v === '' || ['n/a', 'none', '-', '−'].includes(v.toLowerCase())) return '';
  return v;
}

function toNumberOrNull(value) {
  const v = norm(value);
  if (v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function deriveKind(stageLabel) {
  if (stageLabel.startsWith('ポケモン/')) return 'Pokemon';
  if (TRAINER_LABELS.has(stageLabel)) return 'Trainer';
  if (ENERGY_LABELS.has(stageLabel)) return 'Energy';
  return 'Unknown';
}

function deriveStage(stageLabel) {
  if (!stageLabel.startsWith('ポケモン/')) return null;
  if (stageLabel.includes('たね')) return 0;
  if (stageLabel.includes('1進化')) return 1;
  if (stageLabel.includes('2進化')) return 2;
  return null;
}

function parseCost(raw) {
  const v = norm(raw);
  let total = 0;
  let colorless = 0;
  let typed = 0;
  for (const ch of v) {
    if (!ENERGY_SYMBOLS.includes(ch)) continue;
    total += 1;
    if (ch === '●') colorless += 1;
    else typed += 1;
  }
  return { cost_total: total, cost_colorless: colorless, cost_typed: typed };
}

function parseDamage(raw) {
  const v = norm(raw);
  if (v === '') return { damage_raw: '', damage_value: null, damage_kind: 'None' };
  let kind;
  if (/[×x]/.test(v)) kind = 'Multiplier';
  else if (/^[-−]/.test(v)) kind = 'Conditional';
  else if (/\d/.test(v)) kind = 'Static';
  else kind = 'None';
  const match = v.match(/\d+/);
  const value = match ? parseInt(match[0], 10) : null;
  return { damage_raw: v, damage_value: value, damage_kind: kind };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function main() {
  const text = readFileSync(INPUT, 'utf8');
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  const rows = parsed.data;

  const byCard = new Map();
  for (const row of rows) {
    const id = toNumberOrNull(row[COL.id]);
    if (id == null) continue;
    if (!byCard.has(id)) byCard.set(id, []);
    byCard.get(id).push(row);
  }

  const records = [];
  for (const [cardId, cardRows] of [...byCard.entries()].sort((a, b) => a[0] - b[0])) {
    const first = cardRows[0];
    const stageLabel = norm(first[COL.stageLabel]);
    const kind = deriveKind(stageLabel);
    const rule = norm(first[COL.rule]);

    const is_ex = rule === 'ex';
    const is_mega_ex = rule === 'メガシンカex';
    const is_ace_spec = rule === 'ACE SPEC';
    const prize_value = is_mega_ex ? 3 : is_ex ? 2 : 1;

    const weakness = norm(first[COL.weakness]);
    const resistance = norm(first[COL.resistance]);

    // Retreat: numeric for Pokemon (blank counts as 0); null for non-Pokemon.
    let retreat = null;
    if (kind === 'Pokemon') {
      retreat = toNumberOrNull(first[COL.retreat]) ?? 0;
    } else {
      retreat = toNumberOrNull(first[COL.retreat]);
    }

    const moves = [];
    for (const row of cardRows) {
      const name = norm(row[COL.moveName]);
      if (name === '') continue;
      const is_ability = name.startsWith('[特性]');
      const cost = norm(row[COL.cost]);
      const { cost_total, cost_colorless, cost_typed } = parseCost(cost);
      const { damage_raw, damage_value, damage_kind } = parseDamage(row[COL.damage]);
      const dpe =
        !is_ability && cost_total > 0 && damage_kind === 'Static' && damage_value != null
          ? round2(damage_value / cost_total)
          : null;
      moves.push({
        name,
        is_ability,
        cost,
        cost_total,
        cost_colorless,
        cost_typed,
        damage_raw,
        damage_value,
        damage_kind,
        dpe,
        effect: norm(row[COL.effect]),
      });
    }

    const attacks = moves.filter((m) => !m.is_ability);
    const abilityCount = moves.length - attacks.length;
    const staticDpes = attacks.map((m) => m.dpe).filter((d) => d != null);
    const damageValues = attacks.map((m) => m.damage_value).filter((d) => d != null);

    records.push({
      card_id: cardId,
      name: norm(first[COL.name]),
      expansion: norm(first[COL.expansion]),
      collection_no: norm(first[COL.collectionNo]),
      category: norm(first[COL.category]),
      rule,
      prev_stage: norm(first[COL.prevStage]),
      kind,
      stage_label: stageLabel,
      stage: deriveStage(stageLabel),
      hp: toNumberOrNull(first[COL.hp]),
      type: norm(first[COL.type]),
      weakness,
      resistance,
      retreat,
      is_ex,
      is_mega_ex,
      is_ace_spec,
      prize_value,
      has_ability: abilityCount > 0,
      ability_count: abilityCount,
      has_weakness: weakness !== '',
      has_resistance: resistance !== '',
      best_dpe: staticDpes.length ? Math.max(...staticDpes) : null,
      peak_damage: damageValues.length ? Math.max(...damageValues) : null,
      n_moves: attacks.length,
      moves_json: JSON.stringify(moves),
    });
  }

  const csv = Papa.unparse(records, { quotes: true });
  writeFileSync(OUTPUT, csv, 'utf8');

  // Validation / sanity report.
  const exCount = records.filter((r) => r.is_ex).length;
  const megaCount = records.filter((r) => r.is_mega_ex).length;
  const avgHpByStage = {};
  for (const stage of [0, 1, 2]) {
    const hps = records.filter((r) => r.stage === stage && r.hp != null).map((r) => r.hp);
    avgHpByStage[stage] = hps.length ? Math.round(hps.reduce((a, b) => a + b, 0) / hps.length) : null;
  }

  console.log(`Wrote ${OUTPUT}`);
  console.log(`Unique cards: ${records.length}`);
  console.log(`ex: ${exCount}, Mega: ${megaCount}`);
  console.log(`ACE SPEC: ${records.filter((r) => r.is_ace_spec).length}`);
  console.log(`Cards with ability: ${records.filter((r) => r.has_ability).length}`);
  console.log(`Avg HP — Basic(0): ${avgHpByStage[0]}, Stage1(1): ${avgHpByStage[1]}, Stage2(2): ${avgHpByStage[2]}`);
}

main();
