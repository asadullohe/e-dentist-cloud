import { describe, expect, it } from 'vitest'
import { detectColumns, parseCsv, parseDate, parsePhone, parseRow } from './import-parse.js'

describe('ustunlarni tanish', () => {
  it('shablon sarlavhalarini tanaydi', () => {
    const { columns, missing } = detectColumns([
      'ID',
      'F.I.O.',
      'Telefon',
      'Tugʻilgan sana',
      'Manzil',
      'Izoh',
    ])
    expect(missing).toBeUndefined()
    expect(columns).toEqual({ id: 0, fio: 1, phone: 2, birthDate: 3, address: 4, note: 5 })
  })

  // Ustun tartibi oʻzgarsa ham, ortiqcha ustun boʻlsa ham ishlashi kerak
  it('tartib oʻzgarsa va ortiqcha ustun boʻlsa ham topadi', () => {
    const { columns } = detectColumns(['Telefon', 'Kim yubordi', 'F.I.O.', 'Izoh'])
    expect(columns.fio).toBe(2)
    expect(columns.phone).toBe(0)
    expect(columns.note).toBe(3)
    expect(columns.birthDate).toBeUndefined()
  })

  it('apostrof va katta-kichik harf farq qilmaydi', () => {
    expect(detectColumns(['tugilgan sana', 'ISM']).columns).toMatchObject({
      birthDate: 0,
      fio: 1,
    })
    expect(detectColumns(["Tug'ilgan sana", 'F.I.O.']).columns.birthDate).toBe(0)
  })

  it('F.I.O. ustuni yoʻq boʻlsa aniq xato', () => {
    const { missing } = detectColumns(['Telefon', 'Manzil'])
    expect(missing).toBe('F.I.O.')
  })
})

describe('sana tuzoqlari', () => {
  it('Excel sana katagi (Date obyekti)', () => {
    expect(parseDate(new Date(Date.UTC(1990, 4, 12))).iso).toBe('1990-05-12')
  })

  // Excel sanani seriya raqami sifatida saqlaydi
  it('Excel seriya raqami sanaga aylanadi', () => {
    expect(parseDate(33_005).iso).toBe('1990-05-12')
  })

  // Nazorat nuqtalari: Excel da 25569 — Unix davrining boshi.
  // 1900-yil kabisa emas, lekin Excel uni kabisa deb hisoblaydi; shu sababli
  // 1900-yil 1-mart (61) dan oldingi sanalar bir kunga surilgan. Bemor
  // tugʻilgan sanasi hech qachon u yerga tushmaydi — 1900 dan oldingisi
  // baribir rad etiladi
  it('maʼlum nazorat nuqtalariga toʻgʻri keladi', () => {
    expect(parseDate(25_569).iso).toBe('1970-01-01')
    // 61 — 1900-yil 1-mart, soxta kabisa kunidan keyingi birinchi kun
    expect(parseDate(61).iso).toBe('1900-03-01')
  })

  // Bizda hamma joyda kun/oy/yil: 05/12/1990 — 5-dekabr, 12-may emas
  it('matn sana kun/oy/yil tartibida oʻqiladi', () => {
    expect(parseDate('12/05/1990').iso).toBe('1990-05-12')
    expect(parseDate('05/12/1990').iso).toBe('1990-12-05')
  })

  it('nuqta va chiziqcha bilan ham', () => {
    expect(parseDate('12.05.1990').iso).toBe('1990-05-12')
    expect(parseDate('12-05-1990').iso).toBe('1990-05-12')
  })

  it('boʻsh katak xato emas', () => {
    expect(parseDate(null)).toEqual({ iso: null })
    expect(parseDate('')).toEqual({ iso: null })
  })

  it('kelajakdagi va juda qadimgi sana rad etiladi', () => {
    expect(parseDate('01/01/2099').error).toBe('Sana kelajakda')
    expect(parseDate('01/01/1850').error).toBe('Sana juda qadimgi')
  })

  it('tanib boʻlmaydigan sana aniq xato beradi', () => {
    expect(parseDate('kecha').error).toMatch(/kun\/oy\/yil/)
  })
})

describe('telefon tuzoqlari', () => {
  it('turli koʻrinishlar bir xilga keltiriladi', () => {
    for (const value of ['901234567', '+998901234567', '90 123 45 67', '+998 (90) 123-45-67']) {
      expect(parsePhone(value).phone, value).toBe('+998901234567')
    }
  })

  // Excel «0901234567» dagi boshidagi nolni yeb qoʻyadi
  it('boshidagi nol yoʻqolgan raqam tiklanadi', () => {
    expect(parsePhone(901_234_567).phone).toBe('+998901234567')
    expect(parsePhone(90_123_456).phone).toBe('+998090123456')
  })

  it('boʻsh katak xato emas', () => {
    expect(parsePhone('')).toEqual({ phone: null })
  })

  it('oʻqib boʻlmaydigan raqam xato beradi', () => {
    expect(parsePhone('telefon yoʻq').error).toBe('Telefon raqamini oʻqib boʻlmadi')
  })
})

describe('qatorni tekshirish', () => {
  const columns = { id: 0, fio: 1, phone: 2, birthDate: 3, address: 4, note: 5 }

  it('toʻgʻri qator xatosiz oʻtadi', () => {
    const parsed = parseRow(
      ['', 'Karimov Aziz', '901234567', '12/05/1990', 'Toshkent', 'Allergiya'],
      columns,
      2,
    )
    expect(parsed.errors).toEqual({})
    expect(parsed.values).toEqual({
      id: null,
      fio: 'Karimov Aziz',
      phone: '+998901234567',
      birthDate: '1990-05-12',
      address: 'Toshkent',
      note: 'Allergiya',
    })
  })

  it('boʻsh F.I.O. va qisqa ism ushlanadi', () => {
    expect(parseRow(['', '', '', '', '', ''], columns, 3).errors.fio).toBe('F.I.O. boʻsh')
    expect(parseRow(['', 'Ab', '', '', '', ''], columns, 4).errors.fio).toMatch(/kamida 3/)
  })

  it('bir nechta xato bir vaqtda koʻrsatiladi', () => {
    const parsed = parseRow(['', '', 'xato', 'kecha', '', ''], columns, 5)
    expect(Object.keys(parsed.errors).sort()).toEqual(['birthDate', 'fio', 'phone'])
  })

  it('qator raqami saqlanadi — Excelda topish uchun', () => {
    expect(parseRow(['', 'Karimov Aziz', '', '', '', ''], columns, 42).row).toBe(42)
  })
})

describe('CSV tahlili', () => {
  it('vergul bilan ajratilgan', () => {
    expect(parseCsv('a,b\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  // Oʻzbek Excel koʻpincha nuqtali vergul ishlatadi
  it('nuqtali vergulni oʻzi tanaydi', () => {
    expect(parseCsv('F.I.O.;Telefon\nKarimov;901234567')).toEqual([
      ['F.I.O.', 'Telefon'],
      ['Karimov', '901234567'],
    ])
  })

  it('qoʻshtirnoq ichidagi ajratgich va yangi qator', () => {
    expect(parseCsv('a,"b,c"\n"ikki\nqator",d')).toEqual([
      ['a', 'b,c'],
      ['ikki\nqator', 'd'],
    ])
  })

  it('ikkilangan qoʻshtirnoq', () => {
    expect(parseCsv('"u ""katta"" dedi",x')).toEqual([['u "katta" dedi', 'x']])
  })

  it('BOM va boʻsh qatorlar tashlanadi', () => {
    expect(parseCsv('﻿a,b\n\n1,2\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })
})
