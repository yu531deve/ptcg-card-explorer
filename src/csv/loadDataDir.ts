import { parseCsvText } from './loadCsv';
import { parseProcessedCsv } from './loadProcessed';
import type { CardBundle, CardLanguage } from '../types';

// Preferred input: the preprocessed feature table built by `npm run build:data`.
const PROCESSED_FILE = 'cards_processed.csv';
// Fallback raw competition files served from the local `data/` folder.
const CSV_FILES = ['EN_Card_Data.csv', 'JP_Card_Data.csv'];
const PDF_FILES: { name: string; lang: CardLanguage }[] = [
  { name: 'Card_ID List_EN.pdf', lang: 'EN' },
  { name: 'Card_ID List_JP.pdf', lang: 'JP' },
];

export type DataDirResult = {
  bundles: CardBundle[];
  pdfs: { lang: CardLanguage; fileName: string; url: string }[];
};

async function exists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

async function loadProcessedBundle(): Promise<CardBundle | null> {
  const url = `/data/${encodeURIComponent(PROCESSED_FILE)}`;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const { cards, fields } = await parseProcessedCsv(await response.text(), PROCESSED_FILE);
    if (!cards.length) return null;
    return {
      lang: 'JP',
      fileName: PROCESSED_FILE,
      cards,
      rawRowCount: cards.length,
      warnings: [],
      fields,
    };
  } catch {
    return null;
  }
}

export async function loadDataDir(): Promise<DataDirResult> {
  const bundles: CardBundle[] = [];

  const processed = await loadProcessedBundle();
  if (processed) {
    bundles.push(processed);
  } else {
    // Fall back to the raw CSVs if the processed file is not present.
    for (const name of CSV_FILES) {
      const url = `/data/${encodeURIComponent(name)}`;
      try {
        const response = await fetch(url);
        if (!response.ok) continue;
        bundles.push(await parseCsvText(await response.text(), name));
      } catch {
        // Ignore unavailable files.
      }
    }
  }

  const pdfs: DataDirResult['pdfs'] = [];
  for (const { name, lang } of PDF_FILES) {
    const url = `/data/${encodeURIComponent(name)}`;
    if (await exists(url)) pdfs.push({ lang, fileName: name, url });
  }

  return { bundles, pdfs };
}
