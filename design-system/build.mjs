// Builds the design-system package into dist/:
//   - dist/index.js   ESM bundle (React kept external)
//   - dist/*.css      tokens + component styles (styles.css is the entry)
//   - dist/index.d.ts type declarations
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, 'dist');
mkdirSync(dist, { recursive: true });

await build({
  entryPoints: [join(root, 'src/index.ts')],
  outfile: join(dist, 'index.js'),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2020',
  jsx: 'automatic',
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  logLevel: 'info',
});

for (const css of ['tokens.css', 'components.css', 'styles.css']) {
  copyFileSync(join(root, 'src', css), join(dist, css));
}

// Type declarations via the repo's TypeScript.
execFileSync(join(root, '../node_modules/.bin/tsc'), ['-p', join(root, 'tsconfig.json')], {
  stdio: 'inherit',
});

console.log('design-system build complete → dist/');
