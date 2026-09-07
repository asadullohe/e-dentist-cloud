// Telefon, pul va forma tekshiruvi. Oflayn ilovadagi lib/validation.js dan.
// Maydon nomlari tz.md dagi maʼlumotlar modeliga moslandi: full_name → fio.

import { TEKSHIRUV } from './strings.js'

// Kiritilgan matndan operator + raqam qismini (9 xona) ajratib oladi.
// «+998 90 123 45 67», «901234567», «8 90 123 45 67» — hammasi bir xil natija
export function phoneDigits(value: string | number | null | undefined): string {
  let d = String(value ?? '').replace(/\D/g, '')
  if (d.startsWith('998')) d = d.slice(3)
  else if (d.startsWith('8') && d.length > 9) d = d.slice(1)
  return d.slice(0, 9)
}

// 9 xonagacha raqamdan «+998 90 123 45 67» maskasini yasaydi
export function formatUzPhone(value: string | number | null | undefined): string {
  const d = phoneDigits(value)
  if (!d) return ''
  const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean)
  return `+998 ${parts.join(' ')}`
}

// Bazada saqlash uchun bir xil koʻrinish: +998901234567.
// Raqam toʻliq boʻlmasa null — yarim raqam saqlanmaydi
export function normalizePhone(value: string | number | null | undefined): string | null {
  const d = phoneDigits(value)
  return d.length === 9 ? `+998${d}` : null
}

// Faqat raqamlar, boshidagi nollar olib tashlanadi
export function moneyDigits(value: string | number | null | undefined): string {
  return String(value ?? '')
    .replace(/\D/g, '')
    .replace(/^0+(?=\d)/, '')
    .slice(0, 12)
}

// Kiritish maydoni uchun: 1234567 → «1 234 567»
export function formatMoney(value: string | number | null | undefined): string {
  const d = moneyDigits(value)
  return d ? d.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : ''
}

// Ismlarda apostrof variantlarini bir xillashtiramiz — «oʻ», «o'», «o’»
// bitta qidiruvda topilishi uchun
export function normalizeName(s: string | null | undefined): string {
  return String(s ?? '')
    .replace(/[ʻʼ‘’`']/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

const ISM_RE = /^[a-zA-ZʻʼʹЀ-ӿ' .-]+$/

export interface BemorFormasi {
  fio?: string | null
  phone?: string | null
  birth_date?: string | null
}

export type BemorXatolari = Partial<Record<keyof BemorFormasi, string>>

// Boʻsh obyekt qaytsa — forma toʻgʻri
export function validatePatient(f: BemorFormasi): BemorXatolari {
  const errors: BemorXatolari = {}

  const ism = String(f.fio ?? '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!ism) errors.fio = TEKSHIRUV.fio_shart
  else if (ism.length < 3) errors.fio = TEKSHIRUV.fio_qisqa
  else if (!ISM_RE.test(ism)) errors.fio = TEKSHIRUV.fio_harf

  // Telefon majburiy emas, lekin kiritilgan boʻlsa toʻliq boʻlishi kerak
  const d = phoneDigits(f.phone)
  if (d && d.length < 9) errors.phone = TEKSHIRUV.telefon_toliq_emas

  if (f.birth_date) {
    const b = new Date(`${f.birth_date}T00:00:00`)
    if (Number.isNaN(b.getTime())) errors.birth_date = TEKSHIRUV.sana_notogri
    else if (b > new Date()) errors.birth_date = TEKSHIRUV.sana_kelajak
    else if (b.getFullYear() < 1900) errors.birth_date = TEKSHIRUV.sana_qadimgi
  }

  return errors
}
