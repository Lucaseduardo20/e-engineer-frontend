import { fileURLToPath } from 'node:url'
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'node',
      include: ['tests/e2e/**/*.spec.ts'],
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
  }),
)
