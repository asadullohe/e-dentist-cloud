# Landing uchun skrinshotlar

`apps/landing/img/*.webp` — kabinetning haqiqiy ekranlari. Yangilash tartibi (lokal):

1. Docker (`npm run up`) va dev serverlar: API, kabinet 5175. Port 3000 band boʻlsa API ni
   `API_PORT=3001` bilan, kabinetni `API_PROXY=http://localhost:3001` bilan koʻtaring.
2. Maʼlumot — namuna klinika «Tabassum Dental»: `npm run db:demo -- --reset` (API
   ishlab turgan boʻlsin; port boshqa boʻlsa oldiga `API_PORT=3001`). Har safar `--reset`
   bilan: sanalar bugundan hisoblanadi, bugungi navbat faqat shunda boʻladi. Kirish
   `egasi@tabassum.uz / tabassum123` — skriptda sukut; boshqa hisob uchun
   `SHOT_EMAIL`, `SHOT_PASSWORD`. Bemorlar tasodifiy ssenariy bilan yaratiladi, shuning
   uchun skript ism emas, maʼlumot boʻyicha tanlaydi (koʻprigi bor bemor, qabul qilingan
   va yuborilgan reja).
3. Rasmlar: `npm i --no-save playwright-core` (ildizda), brauzer yoʻq boʻlsa
   `npx playwright-core install chromium-headless-shell` (yoki keshdagisi:
   `PLAYWRIGHT_CHROMIUM=~/Library/Caches/ms-playwright/chromium_headless_shell-<v>/chrome-mac/headless_shell`),
   keyin `node scripts/landing/shots.mjs ./shots` — `patients, teeth, visits, calendar,
   queue, reports, dashboard, queue-phone, queue-screen, feedback-phone, feedback-cabinet,
   plan-cabinet, plan-phone`. Ruscha interfeys uchun (`img/ru/`):
   `node scripts/landing/shots.mjs ./shots-ru ru`.
4. WebP: `cwebp -q 82 -resize 1600 0 shots/patients.png -o apps/landing/img/patients.webp`.
   Telefon: `cwebp -q 82 -crop 0 0 780 1180 …` (`plan-phone` qirqilmaydi — 780×1560,
   xarita ostidagi bosqich ham koʻrinsin). `plan-cabinet`: `-crop 0 0 2560 1600 -resize 1600 0`.
   **`cwebp` avval qirqadi, keyin kichraytiradi** — `-crop` asl (2×) oʻlchamda yoziladi.
   Oʻlcham oʻzgarsa HTML dagi `width`/`height` ni ham, raqam yoki ism koʻringan `alt` ni
   ham tuzating (ikkala tilda).

`img/og.png` / `img/og-ru.png` (1200×630, ijtimoiy tarmoq uchun) — `og.html` / `og-ru.html`
shabloni shu papkada:
`apps/landing` ni 5191 portda ochib (`python3 -m http.server 5191`), `og.html` ni oʻsha
papkaga vaqtincha koʻchirib, `node scripts/landing/og.mjs apps/landing/img/og.png`.
