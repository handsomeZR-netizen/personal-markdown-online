import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
import { loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      env: {
        DATABASE_URL: env.DATABASE_URL || process.env.DATABASE_URL || '',
        DIRECT_URL: env.DIRECT_URL || process.env.DIRECT_URL || '',
      },
      server: {
        deps: {
          inline: ['next-auth'],
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        'next/server': path.resolve(__dirname, './src/test/mocks/next-server.ts'),
        'next/cache': path.resolve(__dirname, './src/test/mocks/next-cache.ts'),
        'lucide-react': path.resolve(__dirname, './src/test/mocks/lucide-react.ts'),
      },
    },
  }
})
