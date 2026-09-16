import { ERROR_TEXT } from '@e-dentist/shared'
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { toast } from 'sonner'
import { ApiError } from '@/shared/api'
import { LocaleProvider } from '@/shared/lib'
import { Toaster } from '@/shared/ui'

/// Amal natijasi haqida bildirish — bitta joyda, har mutatsiyada emas.
/// Muvaffaqiyat matnini mutatsiya oʻzi beradi (`meta.success`, funksiya —
/// joriy tilda oʻqilishi uchun). Xato — avtomatik: maydon xatolari formada
/// koʻrinadi, ular toast boʻlmaydi; forma umumiy xatoni oʻzi koʻrsatsa
/// (`meta.inlineErrors`) ham toast yoʻq — bir xato ikki joyda chiqmasin
const mutationCache = new MutationCache({
  onSuccess: (data, variables, _context, mutation) => {
    const success = mutation.meta?.success
    if (success) toast.success(success(data, variables))
  },
  onError: (error, _variables, _context, mutation) => {
    if (mutation.meta?.inlineErrors) return
    if (error instanceof ApiError && error.fields) return
    toast.error(error instanceof Error ? error.message : ERROR_TEXT.internal)
  },
})

const queryClient = new QueryClient({
  mutationCache,
  defaultOptions: {
    queries: {
      // Tibbiy maʼlumot bilan ishlaganda eski koʻrsatkichni koʻrsatib
      // qoʻymaslik muhimroq: oynaga qaytilganda maʼlumot yangilanadi
      refetchOnWindowFocus: true,
      staleTime: 30_000,
      retry: 1,
    },
  },
})

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Til almashganda butun daraxt qayta yaratiladi — router ham */}
      <LocaleProvider>
        <BrowserRouter>{children}</BrowserRouter>
      </LocaleProvider>
      <Toaster />
    </QueryClientProvider>
  )
}
