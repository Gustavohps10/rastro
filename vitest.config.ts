import path from 'node:path'

import { configDefaults, defineConfig } from 'vitest/config'

// Previne erro 'Electron failed to install correctly' quando ELECTRON_SKIP_BINARY_DOWNLOAD=1 é usado no CI/Linux
if (!process.env.ELECTRON_OVERRIDE_DIST_PATH) {
  process.env.ELECTRON_OVERRIDE_DIST_PATH = process.cwd()
}

const testExclude = [
  ...configDefaults.exclude,
  '**/.temps/**',
  '**/e2e/**',
  '**/*.e2e.spec.ts',
]

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      '@rastrokit/sdk': path.resolve(import.meta.dirname, './src/apps/sdk/src'),
      '@rastrokit/application': path.resolve(
        import.meta.dirname,
        './src/packages/application/src',
      ),
      '@rastrokit/adapters': path.resolve(
        import.meta.dirname,
        './src/packages/adapters/src',
      ),
      '@rastrokit/shared': path.resolve(
        import.meta.dirname,
        './src/packages/shared/src',
      ),
      '@rastrokit/domain': path.resolve(
        import.meta.dirname,
        './src/packages/domain/src',
      ),
    },
  },
  test: {
    coverage: {
      reportsDirectory: path.resolve(import.meta.dirname, '.temps/coverage'),
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          globals: true,
          environment: 'node',
          server: { deps: { inline: ['next-intl'] } },
          include: [
            'src/packages/!(ui)/**/*.spec.ts',
            'src/apps/**/*.spec.ts',
            'src/dev-addons/**/*.spec.ts',
          ],
          exclude: [
            ...testExclude,
            'src/packages/ui/**',
            'src/apps/desktop/test-results*/**',
          ],
        },
      },
      {
        extends: true,
        test: {
          name: 'ui',
          globals: true,
          environment: 'jsdom',
          setupFiles: ['./vitest.setup.ts'],
          include: ['src/packages/ui/**/*.spec.{ts,tsx}'],
          exclude: testExclude,
        },
      },
    ],
  },
})
