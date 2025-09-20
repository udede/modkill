import { defineConfig } from 'tsup';

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
}));

