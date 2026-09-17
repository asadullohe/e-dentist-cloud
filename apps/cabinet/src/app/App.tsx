import { useLayoutEffect } from 'react'
import { dismissStaticSplash } from '@/shared/ui'
import { Providers } from './Providers'
import { Router } from './router'

export function App() {
  // index.html dagi yuklanish ekrani React chizilgach yopiladi — faqat
  // biror <Splash/> uni ushlab turmagan boʻlsa (sessiya hali kelmagan)
  useLayoutEffect(() => dismissStaticSplash(), [])

  return (
    <Providers>
      <Router />
    </Providers>
  )
}
