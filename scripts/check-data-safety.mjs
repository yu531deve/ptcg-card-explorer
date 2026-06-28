import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const allowedCsv = new Set(['dummy/dummy_en.csv', 'dummy/dummy_jp.csv']);
const forbidden = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (['.git', 'node_modules', 'dist', '.npm-cache', 'coverage', 'data'].includes(entry)) continue;
    const full = join(dir, entry);
    const rel = relative(root, full);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full);
      continue;
    }
    if (/\.(csv|tsv|pdf)$/i.test(entry) && !allowedCsv.has(rel)) forbidden.push(rel);
  }
}

walk(root);

if (forbidden.length) {
  console.error('Competition data-like files must not be committed:');
  for (const file of forbidden) console.error(`- ${file}`);
  process.exit(1);
}

console.log('No forbidden CSV/TSV/PDF files found in the repository tree.');
