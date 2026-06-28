// The compare tray ("一時保存") stores an ordered list of card IDs only — never
// card data — so localStorage is safe and consistent with the data policy.
const STORAGE_KEY = 'ptcgabc:pinned';

export function loadPinned(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is number => typeof value === 'number');
  } catch {
    return [];
  }
}

export function savePinned(pinned: number[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pinned));
  } catch {
    // Ignore storage failures (private mode / quota).
  }
}
