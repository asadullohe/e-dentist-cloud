import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    // Ildizdagi `prisma` CLI Prisma Studio bilan birga oʻz React nusxasini
    // tortib keladi. Ikkita nusxa boʻlsa hooklar umuman ishlamaydi
    dedupe: ['react', 'react-dom'],
  },
  server: {
    // Kabinet 5173 da — panel boshqa portda turadi
    port: 5174,
    proxy: {
      '/api': { target: 'http://localhost:3000' },
    },
  },
})
