import { defineConfig } from 'tsup';
import { readFileSync } from 'fs';

// Read version from package.json
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
const version = packageJson.version;

export default defineConfig((options) => ({
  entry: {
    cli: 'src/cli.ts',
    index: 'src/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  minify: !options.watch,
  clean: true,
  target: 'node20',
  platform: 'node',
  banner: {
    js: '#!/usr/bin/env node',
  },
  // Inject version at build time
  define: {
    '__VERSION__': JSON.stringify(version),
  },
}));

