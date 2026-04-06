import { build } from 'esbuild';

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: 'dist/bundle.js',
  external: ['playwright', 'fsevents'],
  banner: {
    js: [
      '#!/usr/bin/env node',
      '// Polyfill createRequire for CJS modules (pptxgenjs)',
      'import { createRequire as __createRequire } from "node:module";',
      'const require = __createRequire(import.meta.url);',
    ].join('\n'),
  },
  // Resolve workspace packages
  conditions: ['import', 'node'],
  mainFields: ['module', 'main'],
});

console.log('Bundle created: dist/bundle.js');
