import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'

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
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  )
}
