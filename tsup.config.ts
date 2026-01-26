import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: false,
  target: 'node18',
  platform: 'node',
  banner: {
    js: '#!/usr/bin/env node',
  },
  // Don't bundle any node_modules - keep them external for runtime resolution
  skipNodeModulesBundle: true,
});
