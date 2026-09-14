import { afterEach, describe, expect, it } from 'vitest'
import {
  AUDIT_LABELS,
  getLocale,
  parseAcceptLanguage,
  setLocale,
  setLocaleResolver,
  strings,
  UI_TEXT,
} from './strings.js'

afterEach(() => {
  setLocale('uz')
  setLocaleResolver(() => undefined)
})

describe('tillar', () => {
  it('sukut boʻyicha oʻzbekcha', () => {
    expect(getLocale()).toBe('uz')
    expect(UI_TEXT.login).toBe('Kirish')
  })

  it('til almashganda jonli eksport yangi qiymat beradi', () => {
    setLocale('ru')
    expect(UI_TEXT.login).toBe('Войти')
    setLocale('uz')
    expect(UI_TEXT.login).toBe('Kirish')
  })

  it('tarjima qilinmagan toʻplam oʻzbekchaga qaytadi', () => {
    // VITA_SHADES ru.ts da yoʻq — butun toʻplam asosiy tildan keladi
    expect(strings('ru').VITA_SHADES).toEqual(strings('uz').VITA_SHADES)
    setLocale('ru')
    expect(AUDIT_LABELS.registered).toBe('Регистрация')
  })

  it('funksiyali matnlar ham ishlaydi', () => {
    expect(UI_TEXT.trial_left(3)).toBe('Sinov muddati: 3 kun qoldi')
  })

  it('kalitlar roʻyxati proxy orqali ham toʻliq', () => {
    expect(Object.keys(AUDIT_LABELS)).toContain('registered')
    expect('registered' in AUDIT_LABELS).toBe(true)
    expect({ ...AUDIT_LABELS }.registered).toBe('Roʻyxatdan oʻtdi')
  })

  it('aniq til soʻralganda joriy til oʻzgarmaydi', () => {
    expect(strings('ru').UI_TEXT.login).toBe('Войти')
    expect(getLocale()).toBe('uz')
  })
})

describe('server tili', () => {
  it('resolver berilsa til oʻsha yerdan olinadi', () => {
    setLocaleResolver(() => 'ru')
    expect(getLocale()).toBe('ru')
    expect(UI_TEXT.login).toBe('Войти')
    expect(strings().UI_TEXT.login).toBe('Войти')
  })

  it('resolver undefined qaytarsa oddiy til ishlaydi', () => {
    setLocaleResolver(() => undefined)
    setLocale('ru')
    expect(getLocale()).toBe('ru')
  })

  it('Accept-Language dan til tanlanadi', () => {
    expect(parseAcceptLanguage('ru-RU,ru;q=0.9,en;q=0.8')).toBe('ru')
    expect(parseAcceptLanguage('uz-Latn-UZ,ru;q=0.5')).toBe('uz')
    // Ogʻirlik tartibga ustun: ru 0.9, uz 1 boʻlsa uz
    expect(parseAcceptLanguage('ru;q=0.9,uz')).toBe('uz')
    // Mos til yoʻq — oʻzbekcha
    expect(parseAcceptLanguage('en-US,en;q=0.9')).toBe('uz')
    expect(parseAcceptLanguage('')).toBe('uz')
    expect(parseAcceptLanguage(undefined)).toBe('uz')
    // q=0 — rad etilgan til
    expect(parseAcceptLanguage('ru;q=0,en')).toBe('uz')
  })
})

describe('ruscha tarjima toʻliq', () => {
  /// Har tilda bir xil qoladigan toʻplamlar — tarjima talab qilinmaydi
  const SAME_IN_ALL = new Set(['VITA_SHADES'])

  const isPlain = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null && !Array.isArray(v)

  function missingKeys(base: unknown, patch: unknown, path = ''): string[] {
    if (!isPlain(base)) return []
    if (!isPlain(patch)) return [path || '(ildiz)']
    return Object.keys(base).flatMap((key) => {
      const next = path ? `${path}.${key}` : key
      if (SAME_IN_ALL.has(key)) return []
      if (!(key in patch)) return [next]
      return missingKeys(base[key], patch[key], next)
    })
  }

  it('uz.ts dagi har kalit ru.ts da ham bor', async () => {
    const { ru } = await import('./locales/ru.js')
    const uz = await import('./locales/uz.js')
    // Yangi matn qoʻshilganda ruschasi ham birga yoziladi — shu test eslatadi
    expect(missingKeys({ ...uz }, ru)).toEqual([])
  })

  it('ruscha koʻplik shakllari toʻgʻri', () => {
    const t = strings('ru')
    expect(t.DEBTORS_UI.count(1)).toBe('1 пациент')
    expect(t.DEBTORS_UI.count(3)).toBe('3 пациента')
    expect(t.DEBTORS_UI.count(11)).toBe('11 пациентов')
    expect(t.DEBTORS_UI.count(21)).toBe('21 пациент')
    expect(t.UI_TEXT.trial_left(5)).toBe('Пробный период: осталось 5 дней')
  })
})

describe('jonli eksportlar toʻliq', () => {
  it('uz.ts dagi har toʻplam strings.ts dan ham chiqadi', async () => {
    const catalogs = await import('./locales/uz.js')
    const live = await import('./strings.js')
    const missing = Object.keys(catalogs).filter((name) => !(name in live))
    // Yangi toʻplam qoʻshilganda strings.ts ga `live('NOM')` qatori ham kerak
    expect(missing).toEqual([])
  })
})
