// Landing (e-dentist.uz) uchun kabinet skrinshotlari — lokal dev server,
// egasi sifatida, yorugʻ rejim, 1280×800 @2x. Oldin seed-demo.mjs.
//
//   npm i --no-save playwright-core            # repo ildizida, bir marta
//   npx playwright-core install chromium-headless-shell   # brauzer yoʻq boʻlsa
//   node scripts/landing/shots.mjs ./shots
//
// Keyin WebP: cwebp -q 82 -resize 1600 0 shots/patients.png -o patients.webp
// (telefon: -resize 780 0 -crop 0 0 780 1180) → e-dentist/web/img/
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'

const OUT = process.argv[2] ?? './shots'
mkdirSync(OUT, { recursive: true })
const BASE = 'http://localhost:5175'
// Interfeys tili: `node shots.mjs ./shots ru` — ruscha landing (/ru/) uchun
const LOCALE = process.argv[3] === 'ru' ? 'ru' : 'uz'

// PLAYWRIGHT_CHROMIUM — keshdagi headless shell yoʻli; berilmasa Playwright oʻzi topadi
const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM } : {},
)
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 2,
  locale: LOCALE,
  colorScheme: 'light',
})
// Yorugʻ rejim va til: ilova ikkalasini localStorage dan oʻqiydi
await context.addInitScript((locale) => {
  try {
    localStorage.setItem('edentist-cabinet-theme', 'light')
    localStorage.setItem('edentist-locale', locale)
  } catch {}
}, LOCALE)
const page = await context.newPage()

// Kirish — API orqali, cookie kontekstga tushadi
await page.goto(`${BASE}/login`)
await page.evaluate(async () => {
  await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'ui-sinov@example.com', password: 'sinov12345' }),
  })
})

async function shot(path, name, { wait = 1800, before } = {}) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'load' })
  // Splash yopilsin, soʻrovlar tugasin
  await page.waitForTimeout(wait)
  if (before) await before()
  await page.screenshot({ path: `${OUT}/${name}.png` })
  console.log('✓', name)
}

// Bemorlar roʻyxati
await shot('/patients', 'patients')

// Bemor kartochkasi — tish xaritasi (Karimova Madina: koʻprik + holatlar)
const patientId = await page.evaluate(async () => {
  const r = await fetch('/api/patients?q=Karimova&page=1&pageSize=1').then((r) => r.json())
  return r.data.items[0]?.id
})
await page.setViewportSize({ width: 1280, height: 1040 })
await shot(`/patients/${patientId}/tishlar`, 'teeth')
await page.setViewportSize({ width: 1280, height: 800 })
await shot(`/patients/${patientId}`, 'visits')

// Qabul jadvali
await shot('/schedule', 'calendar')

// Navbat taxtasi
await shot('/queue', 'queue')

// Hisobotlar
await shot('/reports', 'reports')

// Bosh sahifa
await shot('/', 'dashboard')

// Telefon: ochiq navbat sahifasi
const code = await page.evaluate(
  async () => (await fetch('/api/me').then((r) => r.json())).data.clinic.queueCode,
)
const phone = await browser.newContext({
  viewport: { width: 390, height: 780 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: LOCALE,
  colorScheme: 'light',
})
await phone.addInitScript((locale) => {
  try {
    localStorage.setItem('edentist-locale', locale)
  } catch {}
}, LOCALE)
const pp = await phone.newPage()
await pp.goto(`${BASE}/n/${code}`, { waitUntil: 'load' })
await pp.waitForTimeout(1200)
await pp.screenshot({ path: `${OUT}/queue-phone-list.png` })
// Raqam olingan holat: tasdiqlangan (waiting) yozuvning id si brauzerga yoziladi
const ticketId = await page.evaluate(async () => {
  const rows = (await fetch('/api/queue').then((r) => r.json())).data
  return (
    rows.find((row) => row.status === 'waiting' && row.number === 3)?.id ??
    rows.find((row) => row.status === 'waiting')?.id
  )
})
await pp.evaluate(([key, id]) => localStorage.setItem(key, id), [`ed_queue_${code}`, ticketId])
await pp.reload({ waitUntil: 'load' })
await pp.waitForTimeout(1200)
await pp.screenshot({ path: `${OUT}/queue-phone.png` })
console.log('✓ queue-phone')

// Kutish xonasi ekrani (televizor)
const tv = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 2,
  locale: LOCALE,
})
await tv.addInitScript((locale) => {
  try {
    localStorage.setItem('edentist-locale', locale)
  } catch {}
}, LOCALE)
const tp = await tv.newPage()
await tp.goto(`${BASE}/n/${code}/ekran`, { waitUntil: 'load' })
await tp.waitForTimeout(1500)
await tp.screenshot({ path: `${OUT}/queue-screen.png` })
console.log('✓ queue-screen')

await browser.close()
