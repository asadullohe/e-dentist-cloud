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

import { BELGI_YOQ, PUL_BIRLIGI } from './strings.js'

export const OYLAR = [
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

export const KUNLAR = ['Du', 'Se', 'Chor', 'Pay', 'Ju', 'Shan', 'Yak'] as const

const pad2 = (n: number): string => String(n).padStart(2, '0')

// 1234567 → «1 234 567». Manfiy son ham toʻgʻri ishlanadi (qarzdorlik)
const guruhla = (n: number): string => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

// Pul har doim butun son (soʻm), kasr qismi yoʻq
export function soum(n: number | null | undefined): string {
  const v = Math.round(Number(n) || 0)
  return `${guruhla(v)} ${PUL_BIRLIGI}`
}

// Bugungi sana YYYY-MM-DD koʻrinishida — baza va API uchun.
// Diqqat: mahalliy vaqt zonasidan oladi. Server konteynerida
// TZ=Asia/Tashkent boʻlishi shart, aks holda «bugun» besh soatga surilib ketadi.
export function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

// Sana ekranda hamma joyda KK/OO/YYYY: 08/08/2026
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return BELGI_YOQ
  const [y, m, d] = String(iso).split('-').map(Number)
  if (!y || !m || !d) return String(iso)
  return `${pad2(d)}/${pad2(m)}/${y}`
}

// Oy sarlavhasi: «Avgust 2026»
export function fmtMonth(ym: string | null | undefined): string {
  if (!ym) return BELGI_YOQ
  const [y, m] = String(ym).split('-').map(Number)
  const nom = m ? OYLAR[m - 1] : undefined
  if (!y || !nom) return String(ym)
  return `${nom.charAt(0).toUpperCase()}${nom.slice(1)} ${y}`
}

// Sana va vaqt: 08/08/2026 21:00
export function fmtDateTime(value: string | Date | null | undefined): string {
  if (!value) return BELGI_YOQ
  const dt = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(dt.getTime())) return BELGI_YOQ
  const sana = `${pad2(dt.getDate())}/${pad2(dt.getMonth() + 1)}/${dt.getFullYear()}`
  return `${sana} ${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`
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

// Qarz = tashriflar summasi − toʻlovlar. Manfiy boʻlsa bemor oldindan toʻlagan
export function debtOf(p: { charges?: number; paid?: number } | null | undefined): number {
  return (p?.charges ?? 0) - (p?.paid ?? 0)
}
