import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  addDays,
  age,
  debtOf,
  formatDate,
  formatDateTime,
  formatMonth,
  formatSom,
  toDbDate,
  todayISO,
} from './format.js'

describe('soum', () => {
  it('minglarni boʻshliq bilan ajratadi', () => {
    expect(formatSom(1234567)).toBe('1 234 567 soʻm')
    expect(formatSom(1000)).toBe('1 000 soʻm')
    expect(formatSom(999)).toBe('999 soʻm')
    expect(formatSom(0)).toBe('0 soʻm')
  })

  it('qarzdorlik — manfiy sonni ham toʻgʻri chiqaradi', () => {
    expect(formatSom(-1234567)).toBe('-1 234 567 soʻm')
  })

  it('kasrni butunga yaxlitlaydi — pul butun son', () => {
    expect(formatSom(1500.6)).toBe('1 501 soʻm')
  })

  it('boʻsh qiymatda 0 chiqaradi, xato bermaydi', () => {
    expect(formatSom(null)).toBe('0 soʻm')
    expect(formatSom(undefined)).toBe('0 soʻm')
  })

  it('oddiy boʻshliq ishlatadi, uzilmas boʻshliq emas', () => {
    expect(formatSom(1234567)).not.toContain(' ')
  })

  it('«ʻ» — U+02BB, oddiy apostrof emas', () => {
    expect(formatSom(0)).toContain('soʻm')
  })
})

describe('fmtDate', () => {
  it('KK/OO/YYYY koʻrinishida chiqaradi', () => {
    expect(formatDate('2026-08-08')).toBe('08/08/2026')
    expect(formatDate('1990-05-12')).toBe('12/05/1990')
  })

  it('boʻsh qiymatda chiziqcha', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate('')).toBe('—')
  })

  it('tanib boʻlmaydigan qiymatni oʻzgartirmay qaytaradi', () => {
    expect(formatDate('salom')).toBe('salom')
  })
})

describe('fmtMonth', () => {
  it('oy nomini bosh harf bilan yozadi', () => {
    expect(formatMonth('2026-08')).toBe('Avgust 2026')
    expect(formatMonth('2026-01')).toBe('Yanvar 2026')
  })

  it('notoʻgʻri oy raqamida qiymatni oʻzgartirmaydi', () => {
    expect(formatMonth('2026-13')).toBe('2026-13')
  })
})

describe('fmtDateTime', () => {
  it('sana va vaqtni birga chiqaradi', () => {
    expect(formatDateTime(new Date(2026, 7, 8, 21, 5))).toBe('08/08/2026 21:05')
  })

  it('notoʻgʻri sanada chiziqcha', () => {
    expect(formatDateTime('salom')).toBe('—')
  })
})

describe('age', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('tugʻilgan kuni oʻtgan boʻlsa toʻliq yosh', () => {
    vi.useFakeTimers().setSystemTime(new Date(2026, 8, 7))
    expect(age('1990-05-12')).toBe(36)
  })

  it('tugʻilgan kuni hali kelmagan boʻlsa bir yosh kam', () => {
    vi.useFakeTimers().setSystemTime(new Date(2026, 8, 7))
    expect(age('1990-12-31')).toBe(35)
  })

  it('sana yoʻq boʻlsa null', () => {
    expect(age(null)).toBeNull()
  })
})

describe('todayStr', () => {
  it('YYYY-MM-DD koʻrinishida, mahalliy vaqt boʻyicha', () => {
    vi.useFakeTimers().setSystemTime(new Date(2026, 0, 5, 23, 30))
    expect(todayISO()).toBe('2026-01-05')
    vi.useRealTimers()
  })
})

describe('debtOf', () => {
  it('qarz = tashriflar summasi − toʻlovlar', () => {
    expect(debtOf({ charges: 500000, paid: 200000 })).toBe(300000)
  })

  it('oldindan toʻlangan boʻlsa manfiy', () => {
    expect(debtOf({ charges: 100000, paid: 150000 })).toBe(-50000)
  })

  it('maydonlar yoʻq boʻlsa nol', () => {
    expect(debtOf(null)).toBe(0)
    expect(debtOf({})).toBe(0)
  })
})

describe('bazaSanasi va kunQoshib', () => {
  // Toshkent UTC+5: mahalliy yarim tun UTC da oldingi kunga tushadi va
  // DATE ustuni bir kun kam saqlaydi. Shuning uchun UTC yarim tuni yoziladi
  it('kun mahalliy vaqtdan olinadi, vaqt esa UTC yarim tuni', () => {
    const d = toDbDate(new Date(2026, 8, 21, 23, 30))
    expect(d.toISOString()).toBe('2026-09-21T00:00:00.000Z')
  })

  it('kun qoʻshganda ham surilmaydi', () => {
    const d = addDays(14, new Date(2026, 8, 7, 23, 59))
    expect(d.toISOString().slice(0, 10)).toBe('2026-09-21')
  })

  it('oy chegarasidan oʻtadi', () => {
    expect(
      addDays(14, new Date(2026, 8, 25))
        .toISOString()
        .slice(0, 10),
    ).toBe('2026-10-09')
  })
})
