import { afterEach, describe, expect, it } from 'vitest'
import { AUDIT_LABELS, getLocale, setLocale, strings, UI_TEXT } from './strings.js'

afterEach(() => setLocale('uz'))

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

  it('tarjima qilinmagan kalit oʻzbekchaga qaytadi', () => {
    setLocale('ru')
    expect(UI_TEXT.brand).toBe('E-Dentist')
    // Butun toʻplam ham: ruscha faylda yoʻq toʻplam toʻliq oʻzbekcha
    expect(AUDIT_LABELS.registered).toBe('Roʻyxatdan oʻtdi')
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

describe('jonli eksportlar toʻliq', () => {
  it('uz.ts dagi har toʻplam strings.ts dan ham chiqadi', async () => {
    const catalogs = await import('./locales/uz.js')
    const live = await import('./strings.js')
    const missing = Object.keys(catalogs).filter((name) => !(name in live))
    // Yangi toʻplam qoʻshilganda strings.ts ga `live('NOM')` qatori ham kerak
    expect(missing).toEqual([])
  })
})
