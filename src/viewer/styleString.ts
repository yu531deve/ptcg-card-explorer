import type { CSSProperties } from 'react';

// Converts a raw CSS declaration string ("display:flex;gap:8px") into a React
// style object, so the design's inline styles can be reused verbatim.
export function s(css: string): CSSProperties {
  const out: Record<string, string> = {};
  for (const part of css.split(';')) {
    const i = part.indexOf(':');
    if (i === -1) continue;
    const prop = part.slice(0, i).trim();
    const value = part.slice(i + 1).trim();
    if (!prop || !value) continue;
    if (prop.startsWith('--')) {
      out[prop] = value;
    } else {
      out[prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = value;
    }
  }
  return out as CSSProperties;
}
