import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const monorepoRoot = path.resolve(__dirname, '../..')

export default defineConfig(({ mode }) => {
  const fromRoot = loadEnv(mode, monorepoRoot, 'VITE_')
  const fromWeb = loadEnv(mode, __dirname, 'VITE_')
  const merged = { ...fromRoot, ...fromWeb }
  for (const [key, value] of Object.entries(merged)) {
    process.env[key] = value
  }

  return {
    plugins: [react(), tailwindcss()],
    base: process.env.VITE_BASE_PATH || '/',
    server: { port: 5174 },
    test: {
      globals: true,
      environment: 'jsdom',
      include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
      reporter: 'verbose',
    },
  }
})
