import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = fileURLToPath(new URL('.', import.meta.url))
const sourceRoot = resolve(packageRoot, './src')

export default defineConfig({
  resolve: {
    alias: [{ find: /^\/src\//, replacement: `${sourceRoot}/` }],
  },
  plugins: [react(), tailwindcss()],
})
