import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { LocaleProvider } from '@/shared/lib'
import { Toaster } from '@/shared/ui'

const queryClient = new QueryClient({
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
