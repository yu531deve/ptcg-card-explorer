import Papa from 'papaparse';
import { foldMoves, type MappedRow } from './foldMoves';
import { mapHeaders, stripBom } from './columnMap';
import type { CardBundle } from '../types';

type RawPapaRow = Record<string, string | undefined>;

export async function loadCsvFile(file: File): Promise<CardBundle> {
  const text = await file.text();
  return parseCsvText(text, file.name);
}

export function parseCsvText(text: string, fileName = 'cards.csv'): Promise<CardBundle> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawPapaRow>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: stripBom,
      complete: (result) => {
        if (result.errors.length) {
          reject(new Error(result.errors.map((error) => error.message).join('\n')));
          return;
        }

        const fields = result.meta.fields ?? [];
        const mapping = mapHeaders(fields);
        const rows = result.data.map((row) => mapRow(row, mapping.headerToKey));
        const folded = foldMoves(rows, mapping.lang);
        const warnings = [
          ...mapping.missingKeys.map((key) => `Missing expected column: ${key}`),
          ...mapping.unknownHeaders.map((header) => `Unknown column kept in raw only: ${header}`),
          ...folded.warnings,
        ];

        resolve({
          lang: mapping.lang,
          fileName,
          cards: folded.cards,
          rawRowCount: result.data.length,
          warnings,
          fields,
        });
      },
      error: (error: Error) => reject(error),
    });
  });
}

function mapRow(row: RawPapaRow, headerToKey: Map<string, string>): MappedRow {
  const mapped: MappedRow = { raw: {} };

  for (const [header, value] of Object.entries(row)) {
    const cleanValue = String(value ?? '').trim();
    mapped.raw[header] = cleanValue;
    const key = headerToKey.get(header);
    if (key) mapped[key as keyof Omit<MappedRow, 'raw'>] = cleanValue;
  }

  return mapped;
}
