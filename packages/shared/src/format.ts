// Sana va pul formati. Oflayn ilovadagi lib/format.js dan koʻchirildi.
//
// Ikkita ataylab qilingan oʻzgarish:
//
// 1. soum() endi «summalarni yashirish» sozlamasiga bogʻliq emas. Oflayn
//    versiyada u localStorage va React'ga murojaat qilardi — bu paket esa
//    serverda ham ishlaydi, u yerda ikkalasi ham yoʻq. Yashirish — koʻrinish
//    masalasi, u packages/ui ga tushadi.
//
// 2. Raqam guruhlash toLocaleString('ru-RU') oʻrniga qoʻlda qilinadi.
//    toLocaleString natijasi Node va brauzerda har xil boʻlishi mumkin
//    (ajratgich sifatida uzilmas boʻshliq qaytaradi), server va brauzer esa
//    bir xil matn chiqarishi shart.

import { CURRENCY, EMPTY_MARK } from './strings.js'

export const MONTHS = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avgust',
  'sentabr',
  'oktabr',
  'noyabr',
  'dekabr',
] as const

/// Grafik oʻqi uchun qisqartma
export const MONTHS_SHORT = [
  'yan',
  'fev',
  'mar',
  'apr',
  'may',
  'iyn',
  'iyl',
  'avg',
  'sen',
  'okt',
  'noy',
  'dek',
] as const

export const WEEKDAYS = ['Du', 'Se', 'Chor', 'Pay', 'Ju', 'Shan', 'Yak'] as const

const pad2 = (n: number): string => String(n).padStart(2, '0')

// 1234567 → «1 234 567». Manfiy son ham toʻgʻri ishlanadi (qarzdorlik)
const groupDigits = (n: number): string => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

// Pul har doim butun son (soʻm), kasr qismi yoʻq
export function formatSom(n: number | null | undefined): string {
  const v = Math.round(Number(n) || 0)
  return `${groupDigits(v)} ${CURRENCY}`
}

// Bugungi sana YYYY-MM-DD koʻrinishida — baza va API uchun.
// Diqqat: mahalliy vaqt zonasidan oladi. Server konteynerida
// TZ=Asia/Tashkent boʻlishi shart, aks holda «bugun» besh soatga surilib ketadi.
export function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

// Sana ekranda hamma joyda KK/OO/YYYY: 08/08/2026
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return EMPTY_MARK
  const [y, m, d] = String(iso).split('-').map(Number)
  if (!y || !m || !d) return String(iso)
  return `${pad2(d)}/${pad2(m)}/${y}`
}

// Oy sarlavhasi: «Avgust 2026»
export function formatMonth(ym: string | null | undefined): string {
  if (!ym) return EMPTY_MARK
  const [y, m] = String(ym).split('-').map(Number)
  const label = m ? MONTHS[m - 1] : undefined
  if (!y || !label) return String(ym)
  return `${label.charAt(0).toUpperCase()}${label.slice(1)} ${y}`
}

// Sana va vaqt: 08/08/2026 21:00
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return EMPTY_MARK
  const dt = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(dt.getTime())) return EMPTY_MARK
  const date = `${pad2(dt.getDate())}/${pad2(dt.getMonth() + 1)}/${dt.getFullYear()}`
  return `${date} ${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`
}

// Toʻliq yosh. Tugʻilgan kuni hali kelmagan boʻlsa bir yosh kam
export function age(birthDate: string | null | undefined): number | null {
  if (!birthDate) return null
  const b = new Date(birthDate)
  if (Number.isNaN(b.getTime())) return null
  const now = new Date()
  let a = now.getFullYear() - b.getFullYear()
  const oyOtmagan = now.getMonth() < b.getMonth()
  const kunOtmagan = now.getMonth() === b.getMonth() && now.getDate() < b.getDate()
  if (oyOtmagan || kunOtmagan) a--
  return a
}

// Ekrandagi KK/OO/YYYY dan API kutadigan YYYY-MM-DD ga.
// Sana notoʻgʻri boʻlsa null — chaqiruvchi xato koʻrsatadi
export function parseDisplayDate(value: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim())
  if (!m) return null
  const [, day, month, year] = m
  const iso = `${year}-${month}-${day}`
  const d = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return null
  // 31/02/2020 kabi mavjud boʻlmagan sanani Date oʻzi surib yuboradi —
  // teskari tekshiruv bilan ushlaymiz
  return d.toISOString().slice(0, 10) === iso ? iso : null
}

// Kiritish paytida oʻzi chiziqcha qoʻyadi: 12052026 → 12/05/2026
export function maskDisplayDate(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean)
  return parts.join('/')
}

// Postgres DATE ustuniga yoziladigan sana.
//
// Tuzoq: `new Date()` ga setHours(0,0,0,0) qoʻysak mahalliy yarim tun chiqadi.
// Toshkent UTC+5 boʻlgani uchun 21-sentabr 00:00 mahalliy = 20-sentabr 19:00
// UTC, va DATE ustuni kunni 20-sentabr deb saqlaydi — bir kun yoʻqoladi.
// Shuning uchun kun mahalliy vaqtda olinadi, lekin UTC yarim tuni yoziladi.
export function toDbDate(d: Date = new Date()): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
}

// Bugundan N kun keyingi sana — DATE ustuni uchun
export function addDays(days: number, dan: Date = new Date()): Date {
  const d = new Date(dan)
  d.setDate(d.getDate() + days)
  return toDbDate(d)
}

// Qarz = tashriflar summasi − toʻlovlar. Manfiy boʻlsa bemor oldindan toʻlagan
export function debtOf(p: { charges?: number; paid?: number } | null | undefined): number {
  return (p?.charges ?? 0) - (p?.paid ?? 0)
}

/// Klinika logotipining manzili.
///
/// Rasm API orqali beriladi — imzolangan havola serverdagi MinIO ga
/// koʻrsatadi, u esa Docker tarmogʻi ichida va brauzerga koʻrinmaydi.
/// Manzilda klinika raqami emas, navbat kodi: sahifa loginsiz ochiladi
export function clinicLogoUrl(queueCode: string): string {
  return `/api/n/${encodeURIComponent(queueCode)}/logo`
}
