// Telefon, pul va forma tekshiruvi. Oflayn ilovadagi lib/validation.js dan.
// Maydon nomlari tz.md dagi maʼlumotlar modeliga moslandi: full_name → fio.

import { VALIDATION_TEXT } from './strings.js'

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

/// Qidiruv kaliti: normalizeName ustiga apostrof butunlay olib tashlanadi.
///
/// Sabab: «Gʻayratov» ni odam koʻpincha «Gayratov» deb yozadi — apostrofni
/// klaviaturada topish qiyin. Qidiruvda bu ikkisi bir xil topilishi kerak.
/// normalizeName oʻzgarmaydi: u takrorlarni aniqlashda ishlatiladi va
/// u yerda apostrof farqi saqlangani maʼqul
export function searchKey(s: string | null | undefined): string {
  return normalizeName(s).replace(/'/g, '')
}

const NAME_RE = /^[a-zA-ZʻʼʹЀ-ӿ' .-]+$/

export interface BemorFormasi {
  fio?: string | null
  phone?: string | null
  birth_date?: string | null
}

export type BemorXatolari = Partial<Record<keyof BemorFormasi, string>>

// Boʻsh obyekt qaytsa — forma toʻgʻri
export function validatePatient(f: BemorFormasi): BemorXatolari {
  const errors: BemorXatolari = {}

  const name = String(f.fio ?? '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!name) errors.fio = VALIDATION_TEXT.fio_required
  else if (name.length < 3) errors.fio = VALIDATION_TEXT.fio_too_short
  else if (!NAME_RE.test(name)) errors.fio = VALIDATION_TEXT.fio_letters_only

  // Telefon majburiy emas, lekin kiritilgan boʻlsa toʻliq boʻlishi kerak
  const d = phoneDigits(f.phone)
  if (d && d.length < 9) errors.phone = VALIDATION_TEXT.phone_incomplete

  if (f.birth_date) {
    const b = new Date(`${f.birth_date}T00:00:00`)
    if (Number.isNaN(b.getTime())) errors.birth_date = VALIDATION_TEXT.date_invalid
    else if (b > new Date()) errors.birth_date = VALIDATION_TEXT.date_in_future
    else if (b.getFullYear() < 1900) errors.birth_date = VALIDATION_TEXT.date_too_old
  }

  return errors
}
