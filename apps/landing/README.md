# Landing sahifasi — e-dentist.uz

Onlayn versiya (E-Dentist Bulut, `cabinet.e-dentist.uz`) uchun marketing sahifasi. Oddiy
statik sayt: qurish bosqichi yoʻq, `deploy/web.Dockerfile` papkani `/srv/landing` ga
koʻchiradi, Caddy tarqatadi (`deploy/Caddyfile`: sarlavhalar, kesh, `www` → apex).

| Manzil | Nima |
|---|---|
| `e-dentist.uz` | shu sahifa |
| `www.e-dentist.uz` | apex ga yoʻnaltiriladi |
| `cabinet.e-dentist.uz` | klinikalar kabineti (`X-Robots-Tag: noindex`) |
| `admin.e-dentist.uz` | boshqaruv paneli (`noindex`) |

Oflayn ilova (Windows/macOS/Android) 18/09/2026 dan saytda yoʻq — u alohida mahsulot.

## Fayllar

- `styles.css` yoki `app.js` oʻzgarsa ikkala HTML dagi `?v=…` ni yangilang — Cloudflare
  eski faylni 4 soatgacha keshlaydi, yangi manzil buni chetlab oʻtadi
- `index.html` (oʻzbekcha) va `ru/index.html` (ruscha) — ikkalasi bir xil tuzilishda, matn
  oʻzgarsa **ikkalasini** tuzating. `styles.css`, `app.js` umumiy; `app.js` tish nomlarini
  `<html lang>` dan oladi. Ruscha sahifada yoʻllar absolyut (`/img/…`, `/styles.css`)
- `img/*.webp` — oʻzbekcha, `img/ru/*.webp` — ruscha interfeys skrinshotlari, demo maʼlumot
  bilan (1600 px; telefon 780 px). Yangilash: `scripts/landing/` (seed + Playwright,
  `shots.mjs ./shots ru`), keyin `cwebp -q 82`
- `img/og.png`, `img/og-ru.png` — ijtimoiy tarmoq/Telegram uchun 1200×630. Yangilash: matn
  yoki logo oʻzgarsa, `scripts/landing/README.md`
- Boʻlimlar: imkoniyatlar → QR navbat → bemor fikrlari (`#fikrlar` / `#otzyvy`) → jamoa →
  xavfsizlik → narx → savollar. Fikrlar boʻlimi navbat boʻlimining `queue-grid` uslubini
  qayta ishlatadi (telefon + kabinet skrinshoti + roʻyxat)
- `robots.txt`, `sitemap.xml` — `lastmod` ni sahifa oʻzgarganda yangilang
- `fonts/` — shriftlar shu yerda, tashqi xizmat yoʻq

## SEO — nima qilingan, nimani saqlash kerak

- `<title>` va `description` da kalit soʻzlar: «stomatologiya klinikasi uchun dastur»,
  «stomatologiya CRM», «bemorlar kartotekasi», «tish xaritasi», «QR navbat». H1 da ham shu
- `canonical`, `hreflang` juftligi (`uz` ↔ `ru`, `x-default` → uz) ikkala sahifada va
  `sitemap.xml` da, Open Graph + Twitter card (`og.png` / `og-ru.png`), `theme-color`
- JSON-LD (`@graph`): Organization · WebSite · SoftwareApplication (featureList, 14 kun bepul
  offer) · FAQPage — savollar boʻlimidagi matn bilan **bir xil** boʻlishi shart, savol
  oʻzgarsa ikkalasini tuzating
- Rasmlar: `width/height`, `alt`, `loading="lazy"`; shriftlar `preload`
- Kabinet va panel `noindex` — qidiruvda faqat landing chiqadi

> Bu papka biome tekshiruvidan chetda (`biome.json`): sayt alohida yozilgan va uning
> uslubi ilova kodiga tegishli emas.
