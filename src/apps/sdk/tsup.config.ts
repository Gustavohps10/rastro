import { defineConfig } from 'tsup'

import pkg from './package.json'

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: {
      resolve: [/^@rastro\/(application|shared|domain)(\/.*)?$/],
      compilerOptions: {
        baseUrl: '.',
        paths: {
          '@rastrokit/application': [
            '../../packages/application/dist/index.d.ts',
          ],
          '@rastrokit/application/*': [
            '../../packages/application/dist/*.d.ts',
          ],
          '@rastrokit/domain': ['../../packages/domain/dist/index.d.ts'],
          '@rastrokit/shared/*': ['../../packages/shared/dist/*/index.d.ts'],
        },
      },
    },
    clean: true,
    sourcemap: true,
    splitting: false,
    tsconfig: './tsconfig.build.json',
    noExternal: [
      '@rastrokit/application',
      '@rastrokit/shared',
      '@rastrokit/domain',
    ],
    define: {
      __SDK_VERSION__: JSON.stringify(pkg.version),
    },
  },
  {
    entry: {
      cli: 'src/cli/index.ts',
    },
    format: ['cjs'],
    banner: {
      js: '#!/usr/bin/env node',
    },
    target: 'node18',
    platform: 'node',
    dts: false,
    sourcemap: true,
    splitting: false,
    tsconfig: './tsconfig.build.json',
    noExternal: [
      '@rastrokit/application',
      '@rastrokit/shared',
      '@rastrokit/domain',
      'commander',
      'inquirer',
      'js-yaml',
      'adm-zip',
      'zod',
    ],
    define: {
      __SDK_VERSION__: JSON.stringify(pkg.version),
    },
  },
])
