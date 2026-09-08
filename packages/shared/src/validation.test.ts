import { describe, expect, it } from 'vitest'
import {
  formatMoney,
  formatUzPhone,
  normalizeName,
  normalizePhone,
  phoneDigits,
  searchKey,
  validatePatient,
} from './validation.js'

describe('phoneDigits', () => {
  it('turli koʻrinishlarni bitta shaklga keltiradi', () => {
    expect(phoneDigits('901234567')).toBe('901234567')
    expect(phoneDigits('+998901234567')).toBe('901234567')
    expect(phoneDigits('90 123 45 67')).toBe('901234567')
    expect(phoneDigits('+998 (90) 123-45-67')).toBe('901234567')
  })

  it('boʻsh qiymatda boʻsh satr', () => {
    expect(phoneDigits(null)).toBe('')
  })
})

describe('formatUzPhone', () => {
  it('toʻliq raqamni maskaga soladi', () => {
    expect(formatUzPhone('901234567')).toBe('+998 90 123 45 67')
    expect(formatUzPhone('+998901234567')).toBe('+998 90 123 45 67')
  })

  it('yarim kiritilgan raqamni ham koʻrsatadi', () => {
    expect(formatUzPhone('9012')).toBe('+998 90 12')
  })

  it('boʻsh qiymatda boʻsh satr — «+998» yolgʻiz qolmaydi', () => {
    expect(formatUzPhone('')).toBe('')
  })
})

describe('normalizePhone', () => {
  it('bazaga saqlash koʻrinishi', () => {
    expect(normalizePhone('90 123 45 67')).toBe('+998901234567')
  })

  it('raqam toʻliq boʻlmasa null — yarim raqam saqlanmaydi', () => {
    expect(normalizePhone('9012')).toBeNull()
  })
})

describe('formatMoney', () => {
  it('minglarni ajratadi', () => {
    expect(formatMoney('1234567')).toBe('1 234 567')
  })

  it('boshidagi nollarni olib tashlaydi', () => {
    expect(formatMoney('000123')).toBe('123')
  })

  it('harflarni tashlab yuboradi', () => {
    expect(formatMoney('12a34')).toBe('1 234')
  })
})

describe('normalizeName', () => {
  it('apostrof variantlarini bir xillashtiradi — qidiruv topsin', () => {
    expect(normalizeName('Gʻayrat')).toBe(normalizeName("G'ayrat"))
    expect(normalizeName('Gʻayrat')).toBe(normalizeName('G’ayrat'))
  })

  it('ortiqcha boʻshliqlarni yigʻishtiradi', () => {
    expect(normalizeName('  Karimov   Aziz ')).toBe('karimov aziz')
  })
})

describe('validatePatient', () => {
  it('toʻgʻri forma — xato yoʻq', () => {
    const x = validatePatient({ fio: 'Karimov Aziz', phone: '901234567', birth_date: '1990-05-12' })
    expect(x).toEqual({})
  })

  it('F.I.O. majburiy', () => {
    expect(validatePatient({ fio: '' }).fio).toBe('F.I.O. kiritilishi shart')
    expect(validatePatient({ fio: 'Ab' }).fio).toBe('Kamida 3 ta harf kiriting')
  })

  it('oʻzbekcha va kirill harflarni qabul qiladi', () => {
    expect(validatePatient({ fio: 'Gʻanijonov Shoʻhrat' }).fio).toBeUndefined()
    expect(validatePatient({ fio: 'Каримов Азиз' }).fio).toBeUndefined()
  })

  it('ismda raqam boʻlishi mumkin emas', () => {
    expect(validatePatient({ fio: 'Aziz 123' }).fio).toBe('Ismda faqat harflar boʻlishi mumkin')
  })

  it('telefon majburiy emas, lekin yarim boʻlmasin', () => {
    expect(validatePatient({ fio: 'Karimov Aziz' }).phone).toBeUndefined()
    expect(validatePatient({ fio: 'Karimov Aziz', phone: '9012' }).phone).toBe(
      'Raqam toʻliq emas: +998 XX XXX XX XX',
    )
  })

  it('tugʻilgan sana kelajakda boʻla olmaydi', () => {
    expect(validatePatient({ fio: 'Karimov Aziz', birth_date: '2099-01-01' }).birth_date).toBe(
      'Sana kelajakda boʻlishi mumkin emas',
    )
  })

  it('1900 dan oldingi sana rad etiladi', () => {
    expect(validatePatient({ fio: 'Karimov Aziz', birth_date: '1899-12-31' }).birth_date).toBe(
      'Sana juda qadimgi',
    )
  })
})

describe('searchKey', () => {
  it('apostrofning barcha koʻrinishlarini bir xil qiladi', () => {
    const expected = searchKey('Gʻayratov')
    for (const variant of ["G'ayratov", 'G’ayratov', 'G`ayratov', 'Gayratov']) {
      expect(searchKey(variant)).toBe(expected)
    }
  })

  it('normalizeName dan farqi: u apostrofni saqlaydi', () => {
    expect(normalizeName('Gʻayrat')).toContain("'")
    expect(searchKey('Gʻayrat')).not.toContain("'")
  })
})
