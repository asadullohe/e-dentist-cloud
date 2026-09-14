import { setLocale as applyLocale, DEFAULT_LOCALE, isLocale, type Locale } from '@e-dentist/shared'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

// Til holati.
//
// Matnlar `@e-dentist/shared` dagi jonli eksportlar orqali oʻqiladi — ular
// komponentlar emas, shuning uchun til almashganda React oʻzi qayta
// chizmaydi. Yechim: butun daraxt `key={locale}` bilan qayta yaratiladi.
// Bu forma holatini yoʻqotadi, lekin til kunda bir marta emas, bir umrda
// bir marta almashadi.

const KEY = 'edentist-locale'

interface LocaleState {
  locale: Locale
  setLocale: (locale: Locale) => void
}

const LocaleContext = createContext<LocaleState | null>(null)

function read(): Locale {
  try {
    const saved = localStorage.getItem(KEY)
    if (isLocale(saved)) return saved
  } catch {
    // maxfiy oyna yoki saqlash oʻchirilgan
  }
  return DEFAULT_LOCALE
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    // Birinchi chizishdan OLDIN: aks holda birinchi kadr oʻzbekcha chiqardi
    const initial = read()
    applyLocale(initial)
    return initial
  })

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    applyLocale(next)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // saqlanmasa ham joriy sessiyada ishlaydi
    }
    setLocaleState(next)
  }, [])

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale])

  return (
    <LocaleContext.Provider value={value}>
      <LocaleRoot key={locale}>{children}</LocaleRoot>
    </LocaleContext.Provider>
  )
}

/// `key` almashganda shu tugun bilan birga butun daraxt qayta yaratiladi
function LocaleRoot({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export function useLocale(): LocaleState {
  const state = useContext(LocaleContext)
  if (!state) throw new Error('useLocale faqat LocaleProvider ichida ishlaydi')
  return state
}
