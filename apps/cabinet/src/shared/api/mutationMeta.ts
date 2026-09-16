// Mutatsiya `meta` maydonining shakli (app/Providers.tsx dagi MutationCache
// oʻqiydi). TanStack Query `Register` orqali butun ilovaga tarqaladi —
// har hookda `meta` yozilganda tip tekshiriladi.

import '@tanstack/react-query'

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      /// Muvaffaqiyat toasti. Funksiya — matn joriy tilda oʻqilishi uchun;
      /// natija va argumentlar keladi («5 ta yangi» kabi matnlar uchun)
      // biome-ignore lint/suspicious/noExplicitAny: har mutatsiya oʻz tiplari bilan chaqiradi
      success?: (data: any, variables: any) => string
      /// Forma umumiy xatoni oʻzi koʻrsatadi — toast chiqmasin
      inlineErrors?: boolean
    }
  }
}
