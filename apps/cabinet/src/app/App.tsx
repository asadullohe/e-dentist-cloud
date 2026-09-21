import { useLayoutEffect } from 'react'
import { dismissStaticSplash } from '@/shared/ui'
import { ErrorBoundary } from './ErrorBoundary'
import { Providers } from './Providers'
import { Router } from './router'

export function App() {
  // index.html dagi yuklanish ekrani React chizilgach yopiladi — faqat
  // biror <Splash/> uni ushlab turmagan boʻlsa (sessiya hali kelmagan)
  useLayoutEffect(() => dismissStaticSplash(), [])

  // Chegara provayderlardan tashqarida — ular yiqilsa ham ekran boʻsh qolmasin
  return (
    <ErrorBoundary>
      <Providers>
        <Router />
      </Providers>
    </ErrorBoundary>
  )
}
