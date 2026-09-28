import { describe, expect, it } from 'vitest'
import {
  type ArchSpec,
  bridgeSpan,
  crownMaterialLabel,
  isCrowned,
  isPrimary,
  isToothNo,
  LOWER,
  placeArch,
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
  const upper: ArchSpec = {
    upper: true,
    primary: false,
    cx: 210,
    center: 285,
    a: 128,
    b: 215,
    maxScale: 9,
  }
  const byNo = (spec: ArchSpec) => new Map(placeArch(spec).map((p) => [p.tooth, p]))

  it('doimiy jagʻda 16 ta, sut jagʻida 10 ta tish — FDI raqamlari bilan', () => {
    expect(
      placeArch(upper)
        .map((p) => p.tooth)
        .sort(),
    ).toEqual([...UPPER].sort())
    const lower = placeArch({ ...upper, upper: false, center: 335 })
    expect(lower.map((p) => p.tooth).sort()).toEqual([...LOWER].sort())
    const primary = placeArch({ ...upper, primary: true, maxScale: 1 })
    expect(primary.map((p) => p.tooth).sort()).toEqual([51, 52, 53, 54, 55, 61, 62, 63, 64, 65])
  })

  it('bemorning oʻng tomoni koʻrinishda chapda, ikki yarmi oʻrta chiziqqa nisbatan simmetrik', () => {
    const p = byNo(upper)
    const right = p.get(16)
    const left = p.get(26)
    expect(right && left).toBeTruthy()
    if (!right || !left) return
    expect(right.x).toBeLessThan(210)
    expect(right.x - 210).toBeCloseTo(210 - left.x, 5)
    expect(right.y).toBeCloseTo(left.y, 5)
  })

  it('tishlar oʻrta chiziqdan chetga qarab ketma-ket turadi va bir-birini yopmaydi', () => {
    const p = byNo(upper)
    for (let i = 1; i < 8; i++) {
      const a = p.get(10 + i)
      const b = p.get(11 + i)
      if (!a || !b) throw new Error('tish yoʻq')
      // Qoʻshni markazlar orasi ikki yarim kenglikdan kam emas (yoy vatardan uzun)
      expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan((a.width + b.width) / 2 - 1)
      expect(b.y).toBeGreaterThan(a.y)
    }
  })

  it('tashqi normal ravoqdan tashqariga qaraydi', () => {
    const p = byNo(upper)
    // Markaziy kesuvchi tepada — normal yuqoriga; katta oziq chetda — chapga
    expect(p.get(11)?.ny).toBeLessThan(-0.9)
    expect(p.get(18)?.nx).toBeLessThan(-0.9)
    const lower = byNo({ ...upper, upper: false, center: 335 })
    expect(lower.get(41)?.ny).toBeGreaterThan(0.9)
  })

  it('ichki ravoqda tishlar kattalashmaydi', () => {
    const primary = byNo({ ...upper, primary: true, a: 80, b: 132, maxScale: 1 })
    // 51 ning asl kengligi 24
    expect(primary.get(51)?.width).toBeCloseTo(24, 5)
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
