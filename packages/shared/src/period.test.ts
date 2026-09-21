import { describe, expect, it } from 'vitest'
import { formatPeriod, periodRange, samePeriod, shiftPeriod } from './period.js'

describe('davr chegaralari', () => {
  it('kun', () => {
    expect(periodRange({ kind: 'day', anchor: '2026-09-21' })).toEqual({
      from: '2026-09-21',
      to: '2026-09-21',
    })
  })

  it('hafta dushanbadan yakshanbagacha', () => {
    // 2026-09-21 — dushanba; 2026-09-27 — yakshanba
    expect(periodRange({ kind: 'week', anchor: '2026-09-23' })).toEqual({
      from: '2026-09-21',
      to: '2026-09-27',
    })
    expect(periodRange({ kind: 'week', anchor: '2026-09-27' }).from).toBe('2026-09-21')
  })

  it('oy va yil', () => {
    expect(periodRange({ kind: 'month', anchor: '2026-02-10' })).toEqual({
      from: '2026-02-01',
      to: '2026-02-28',
    })
    expect(periodRange({ kind: 'year', anchor: '2026-06-15' })).toEqual({
      from: '2026-01-01',
      to: '2026-12-31',
    })
  })
})

describe('davr almashtirish', () => {
  it('31 yanvardan keyingi oy — fevral, mart emas', () => {
    expect(shiftPeriod({ kind: 'month', anchor: '2026-01-31' }, 1).anchor).toBe('2026-02-01')
  })

  it('hafta yetti kunga, kun bir kunga, yil bir yilga', () => {
    expect(shiftPeriod({ kind: 'week', anchor: '2026-09-21' }, -1).anchor).toBe('2026-09-14')
    expect(shiftPeriod({ kind: 'day', anchor: '2026-09-30' }, 1).anchor).toBe('2026-10-01')
    expect(shiftPeriod({ kind: 'year', anchor: '2026-09-21' }, 1).anchor).toBe('2027-01-01')
  })

  it('bir davr ichidagi ikki kun — bir xil davr', () => {
    expect(
      samePeriod({ kind: 'week', anchor: '2026-09-21' }, { kind: 'week', anchor: '2026-09-27' }),
    ).toBe(true)
    expect(
      samePeriod({ kind: 'month', anchor: '2026-09-21' }, { kind: 'week', anchor: '2026-09-21' }),
    ).toBe(false)
  })
})

describe('davr sarlavhasi', () => {
  it('kun, hafta, oy, yil', () => {
    expect(formatPeriod({ kind: 'day', anchor: '2026-09-21' })).toBe('21/09/2026')
    expect(formatPeriod({ kind: 'week', anchor: '2026-09-21' })).toBe('21–27 sen 2026')
    expect(formatPeriod({ kind: 'week', anchor: '2026-09-30' })).toBe('28 sen – 4 okt 2026')
    expect(formatPeriod({ kind: 'week', anchor: '2025-12-31' })).toBe('29 dek 2025 – 4 yan 2026')
    expect(formatPeriod({ kind: 'month', anchor: '2026-09-21' })).toBe('Sentabr 2026')
    expect(formatPeriod({ kind: 'year', anchor: '2026-09-21' })).toBe('2026')
  })
})
