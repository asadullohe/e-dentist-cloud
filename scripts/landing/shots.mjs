// Landing (e-dentist.uz) uchun kabinet skrinshotlari — lokal dev server,
// egasi sifatida, yorugʻ rejim, 1280×800 @2x. Maʼlumot — namuna klinika
// «Tabassum Dental» (`npm run db:demo -- --reset`, bugungi navbat bilan).
// Boshqa hisob: SHOT_EMAIL / SHOT_PASSWORD.
//
//   npm i --no-save playwright-core            # repo ildizida, bir marta
//   npx playwright-core install chromium-headless-shell   # brauzer yoʻq boʻlsa
//   node scripts/landing/shots.mjs ./shots
//   (patients, teeth, visits, calendar, queue, reports, dashboard, queue-phone,
//    queue-screen, feedback-phone, feedback-cabinet)
//
// Keyin WebP: cwebp -q 82 -resize 1600 0 shots/patients.png -o patients.webp
// (telefon: -resize 780 0 -crop 0 0 780 1180) → e-dentist/web/img/
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'

const OUT = process.argv[2] ?? './shots'
const CREDENTIALS = {
  email: process.env.SHOT_EMAIL ?? 'egasi@tabassum.uz',
  password: process.env.SHOT_PASSWORD ?? 'tabassum123',
}
mkdirSync(OUT, { recursive: true })
const BASE = process.env.BASE_URL ?? 'http://localhost:5175'
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
await page.evaluate(async (credentials) => {
  await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(credentials),
  })
}, CREDENTIALS)

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

// Bemor kartochkasi — tish xaritasi. Namunada bemorlar tasodifiy ssenariy
// bilan yaratiladi, shuning uchun ism emas: koʻprigi bor va xaritasida eng
// koʻp yozuv bor bemor tanlanadi
const patientId = await page.evaluate(async () => {
  const ids = []
  for (let p = 1; ; p++) {
    const r = await fetch(`/api/patients?page=${p}&pageSize=100`).then((r) => r.json())
    ids.push(...r.data.items.map((item) => item.id))
    if (r.data.items.length < 100) break
  }
  let best = { id: ids[0], score: -1 }
  for (const id of ids) {
    const chart = (await fetch(`/api/patients/${id}/teeth`).then((r) => r.json())).data
    const statuses = new Set(chart.teeth.map((t) => t.status)).size
    const score = chart.bridges.length * 100 + statuses * 10 + chart.teeth.length
    if (score > best.score) best = { id, score }
  }
  return best.id
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

// Telefon: fikr sahifasi — 5 yulduz, ikki teg, izoh yozilgan holat
const fp = await phone.newPage()
await fp.goto(`${BASE}/f/${code}?from=qr&rating=5`, { waitUntil: 'load' })
await fp.waitForTimeout(1200)
const TAGS = LOCALE === 'ru' ? ['Отношение', 'Лечение'] : ['Muomala', 'Davolash']
for (const tag of TAGS) await fp.getByRole('button', { name: tag, exact: true }).click()
await fp
  .locator('#feedback-comment')
  .fill(
    LOCALE === 'ru'
      ? 'Всё прошло без боли, врач всё объяснил. Спасибо!'
      : 'Ogʻriqsiz oʻtdi, shifokor hammasini tushuntirdi. Rahmat!',
  )
await fp.waitForTimeout(300)
await fp.screenshot({ path: `${OUT}/feedback-phone.png` })
console.log('✓ feedback-phone')

// Kabinet: Sozlamalar → Fikrlar
await shot('/settings/fikrlar', 'feedback-cabinet')

// Kabinet: qabul qilingan reja (bosqichlar, bir qismi bajarilgan)
const acceptedPlan = await page.evaluate(async () => {
  const plans = (await fetch('/api/plans').then((r) => r.json())).data
  const plan = plans.find((row) => row.status === 'accepted') ?? plans[0]
  return { patientId: plan?.patientId, planId: plan?.id }
})
await page.setViewportSize({ width: 1280, height: 980 })
await shot(`/patients/${acceptedPlan.patientId}/reja/${acceptedPlan.planId}`, 'plan-cabinet', {
  // Xarita tik va baland — ochiq boʻlsa bosqichlar va jami kadrga sigʻmaydi.
  // Rejadagi tishlar xaritasi telefon rasmida (plan-phone) koʻrinadi
  before: async () => {
    const toggle = page.locator('main button[aria-expanded], main button').filter({
      hasText: LOCALE === 'ru' ? 'Зубная карта' : 'Tish xaritasi',
    })
    await toggle.first().click()
    await page.waitForTimeout(400)
  },
})
await page.setViewportSize({ width: 1280, height: 800 })

// Telefon: bemorga yuborilgan rejaning ochiq sahifasi
const sentCode = await page.evaluate(async () => {
  const plans = (await fetch('/api/plans').then((r) => r.json())).data
  return (plans.find((row) => row.status === 'sent') ?? plans[0])?.publicCode
})
const planPhone = await phone.newPage()
await planPhone.goto(`${BASE}/r/${sentCode}`, { waitUntil: 'load' })
await planPhone.waitForTimeout(1500)
await planPhone.screenshot({ path: `${OUT}/plan-phone.png` })
console.log('✓ plan-phone')

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
