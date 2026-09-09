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
    // tortib keladi. Ikkita nusxa boʻlsa react-router bittasini, bizning
    // kod boshqasini koʻradi va hooklar umuman ishlamaydi — dedupe
    // hammasini bitta nusxaga yigʻadi
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 5173,
    // API ni oʻsha manzilga uzatamiz. Shunda brauzer uchun kabinet ham,
    // API ham bitta manzil boʻladi — xuddi serverdagidek (Caddy ham shunday
    // qiladi). CORS sozlash kerak emas va cookie muammosiz ishlaydi
    proxy: {
      '/api': { target: 'http://localhost:3000' },
    },
  },
})
