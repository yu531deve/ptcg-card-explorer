// Persists uploaded CSV text and PDF blobs in IndexedDB so a page reload restores
// the workspace without re-selecting files. IndexedDB (not localStorage) because
// the real card CSVs and PDFs can be several MB.
import type { CardLanguage } from '../types';

const DB_NAME = 'ptcg-card-explorer';
const STORE = 'files';
const VERSION = 1;

export type StoredCsv = { kind: 'csv'; lang: CardLanguage; fileName: string; text: string };
export type StoredPdf = { kind: 'pdf'; lang: CardLanguage; fileName: string; blob: Blob };
type StoredFile = (StoredCsv | StoredPdf) & { id: string };

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(db: IDBDatabase, mode: IDBTransactionMode): IDBObjectStore {
  return db.transaction(STORE, mode).objectStore(STORE);
}

async function put(record: StoredFile): Promise<void> {
  const db = await open();
  await new Promise<void>((resolve, reject) => {
    const req = tx(db, 'readwrite').put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
  db.close();
}

export async function saveCsv(lang: CardLanguage, fileName: string, text: string): Promise<void> {
  await put({ id: `csv:${lang}`, kind: 'csv', lang, fileName, text });
}

export async function savePdf(lang: CardLanguage, fileName: string, blob: Blob): Promise<void> {
  await put({ id: `pdf:${lang}`, kind: 'pdf', lang, fileName, blob });
}

export async function loadAll(): Promise<{ csvs: StoredCsv[]; pdfs: StoredPdf[] }> {
  let db: IDBDatabase;
  try {
    db = await open();
  } catch {
    return { csvs: [], pdfs: [] };
  }
  const all = await new Promise<StoredFile[]>((resolve, reject) => {
    const req = tx(db, 'readonly').getAll();
    req.onsuccess = () => resolve(req.result as StoredFile[]);
    req.onerror = () => reject(req.error);
  }).catch(() => [] as StoredFile[]);
  db.close();
  return {
    csvs: all.filter((f): f is StoredFile & StoredCsv => f.kind === 'csv'),
    pdfs: all.filter((f): f is StoredFile & StoredPdf => f.kind === 'pdf'),
  };
}

export async function clearAll(): Promise<void> {
  const db = await open();
  await new Promise<void>((resolve, reject) => {
    const req = tx(db, 'readwrite').clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
  db.close();
}
