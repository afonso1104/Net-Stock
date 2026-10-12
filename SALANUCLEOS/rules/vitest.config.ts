import { defineConfig } from 'vitest/config'

// Corre só com o emulador ativo: npm run test:rules
export default defineConfig({ test: { include: ['rules/**/*.test.ts'], environment: 'node', testTimeout: 20000 } })
