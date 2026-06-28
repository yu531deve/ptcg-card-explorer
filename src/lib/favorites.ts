// Favorites store only card IDs (never card data), so localStorage is safe and
// not subject to the competition data handling rules.
const STORAGE_KEY = 'ptcgabc:favorites';

export function loadFavorites(): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((value): value is number => typeof value === 'number'));
  } catch {
    return new Set();
  }
}

export function saveFavorites(favorites: Set<number>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]));
  } catch {
    // Ignore storage failures (private mode / quota).
  }
}
