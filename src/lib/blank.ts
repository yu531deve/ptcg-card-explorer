export function isBlank(value: unknown): boolean {
  if (value == null) return true;
  const normalized = String(value).trim();
  return normalized === '' || normalized.toLowerCase() === 'n/a';
}

export function displayValue(value: unknown, fallback = 'n/a'): string {
  return isBlank(value) ? fallback : String(value).trim();
}

export function nullableNumber(value: unknown): number | null {
  if (isBlank(value)) return null;
  const num = Number(String(value).trim());
  return Number.isFinite(num) ? num : null;
}
