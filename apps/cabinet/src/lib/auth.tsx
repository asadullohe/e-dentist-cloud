// Kirgan foydalanuvchi holati. Ruxsatlar serverdan keladi va menyuni
// shakllantirishda ishlatiladi — lekin himoya baribir serverda: bu yerdagisi
// faqat koʻrinish, xavfsizlik emas.

import type { Ruxsat } from '@e-dentist/shared'
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import { ApiXato, api, type Men } from './api'

interface AuthQiymati {
  men: Men | null
  yuklanmoqda: boolean
  kir(email: string, parol: string): Promise<void>
  chiq(): Promise<void>
  yangila(): Promise<void>
}

const Kontekst = createContext<AuthQiymati | null>(null)

export function AuthTaminlovchi({ children }: { children: ReactNode }) {
  const [men, setMen] = useState<Men | null>(null)
  const [yuklanmoqda, setYuklanmoqda] = useState(true)

  const yangila = useCallback(async () => {
    try {
      setMen(await api.men())
    } catch (e) {
      // 401 — hali kirmagan. Bu xato emas, oddiy holat
      if (!(e instanceof ApiXato)) throw e
      setMen(null)
    } finally {
      setYuklanmoqda(false)
    }
  }, [])

  useEffect(() => {
    void yangila()
  }, [yangila])

  const kir = useCallback(async (email: string, parol: string) => {
    await api.kir(email, parol)
    setMen(await api.men())
  }, [])

  const chiq = useCallback(async () => {
    await api.chiq()
    setMen(null)
  }, [])

  return (
    <Kontekst.Provider value={{ men, yuklanmoqda, kir, chiq, yangila }}>
      {children}
    </Kontekst.Provider>
  )
}

export function useAuth(): AuthQiymati {
  const q = useContext(Kontekst)
  if (!q) throw new Error('useAuth faqat AuthTaminlovchi ichida ishlaydi')
  return q
}

export function useRuxsat(): (kerak: Ruxsat) => boolean {
  const { men } = useAuth()
  return (kerak) => men?.permissions.includes(kerak) ?? false
}
