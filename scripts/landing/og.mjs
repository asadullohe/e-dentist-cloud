import { chromium } from 'playwright-core'

const b = await chromium.launch({
  ...(process.env.PLAYWRIGHT_CHROMIUM ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM } : {}),
})
const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
await p.goto('http://127.0.0.1:5191/og.html', { waitUntil: 'load' })
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(400)
await p.screenshot({ path: process.argv[2], type: 'png' })
await b.close()
