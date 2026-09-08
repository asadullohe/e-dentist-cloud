import { describe, expect, it } from 'vitest'
import {
  archLayout,
  bridgeSpan,
  crownMaterialLabel,
  isCrowned,
  isPrimary,
  isToothNo,
  LOWER,
  toothStatusLabel,
  toothType,
  UPPER,
} from './index.js'

describe('FDI raqamlash', () => {
  it('har jagʻda 16 ta doimiy tish', () => {
    expect(UPPER).toHaveLength(16)
    expect(LOWER).toHaveLength(16)
  })

  it('sut tishi birinchi raqami 5–8', () => {
    expect(isPrimary(51)).toBe(true)
    expect(isPrimary(85)).toBe(true)
    expect(isPrimary(11)).toBe(false)
    expect(isPrimary(48)).toBe(false)
  })

  it('mavjud boʻlmagan raqamni rad etadi', () => {
    expect(isToothNo(11)).toBe(true)
    expect(isToothNo(19)).toBe(false)
    expect(isToothNo(0)).toBe(false)
  })
})

describe('tish turi', () => {
  it('FDI ikkinchi raqamiga qarab aniqlanadi', () => {
    expect(toothType(11)).toBe('incisor')
    expect(toothType(13)).toBe('canine')
    expect(toothType(15)).toBe('premolar')
    expect(toothType(17)).toBe('molar')
  })

  // Sut tishlarida kichik oziq tish boʻlmaydi
  it('sut tishida 4 va 5 ham katta oziq', () => {
    expect(toothType(54)).toBe('molar')
    expect(toothType(55)).toBe('molar')
  })
})

describe('ravoq geometriyasi', () => {
  it('pozitsiyalar 0..1 oraligʻida va oʻsib boradi', () => {
    const positions = archLayout(UPPER)
    expect(positions).toHaveLength(16)
    for (const p of positions) {
      expect(p).toBeGreaterThan(0)
      expect(p).toBeLessThan(1)
    }
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeGreaterThan(positions[i - 1] as number)
    }
  })

  it('kengroq tish koʻproq joy oladi', () => {
    // 18 va 17 — katta oziq, 11 va 21 — kesuvchi
    const p = archLayout([18, 17, 11, 21])
    const molarGap = (p[1] as number) - (p[0] as number)
    const incisorGap = (p[3] as number) - (p[2] as number)
    expect(molarGap).toBeGreaterThan(incisorGap)
  })
})

describe('koʻprik', () => {
  it('oraliqdagi barcha tishlarni beradi', () => {
    expect(bridgeSpan(14, 16)).toEqual([16, 15, 14])
  })

  it('tartib teskari boʻlsa ham bir xil', () => {
    expect(bridgeSpan(16, 14)).toEqual(bridgeSpan(14, 16))
  })

  it('turli jagʻdagi tishlar koʻprik boʻla olmaydi', () => {
    expect(bridgeSpan(14, 44)).toEqual([])
  })

  it('markazdan oʻtadigan koʻprik ham ishlaydi', () => {
    expect(bridgeSpan(12, 22)).toEqual([12, 11, 21, 22])
  })
})

describe('holat va material', () => {
  it('koronka va koʻprik ustidan qopqoq chiziladi', () => {
    expect(isCrowned('koronka')).toBe(true)
    expect(isCrowned('koprik')).toBe(true)
    expect(isCrowned('karies')).toBe(false)
  })

  it('yorliqlar oʻzbekcha', () => {
    expect(toothStatusLabel('soglom')).toBe('Sogʻlom')
    expect(crownMaterialLabel('sirkoniy')).toBe('Sirkoniy')
    expect(crownMaterialLabel(null)).toBe('Koʻrsatilmagan')
  })

  it('nomaʼlum kalitni oʻzini qaytaradi', () => {
    expect(toothStatusLabel('yangi-holat')).toBe('yangi-holat')
  })
})
