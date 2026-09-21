# Landing uchun skrinshotlar

`apps/landing/img/*.webp` — kabinetning haqiqiy ekranlari. Yangilash tartibi (lokal):

1. Docker (`npm run up`) va dev serverlar: API 3000, kabinet 5175. Lokal sinov egasi
   `ui-sinov@example.com / sinov12345` boʻlishi kerak.
2. Demo maʼlumot: `node scripts/landing/seed-demo.mjs` — 16 bemor, tashriflar, tish
   xaritasi, toʻlovlar, xarajatlar, qabullar, navbat, naryadlar. Ikkinchi marta ishga
   tushsa mavjudini qayta yozmaydi. Faqat `localhost` — serverga qaratib boʻlmaydi.
3. Rasmlar: `npm i --no-save playwright-core` (ildizda), brauzer yoʻq boʻlsa
   `npx playwright-core install chromium-headless-shell`, keyin
   `node scripts/landing/shots.mjs ./shots` — `patients, teeth, visits, calendar, queue,
   reports, dashboard, queue-phone, queue-screen, feedback-phone, feedback-cabinet`.
   Fikrlar ochiq sahifa orqali yoziladi — IP soatiga 10 ta: seed ikkinchi marta
   toʻsiqqa urilsa `docker exec ed-redis redis-cli DEL ratelimit:feedback:ip:127.0.0.1`. Ruscha interfeys uchun (`img/ru/`):
   `node scripts/landing/shots.mjs ./shots-ru ru`.
4. WebP: `cwebp -q 82 -resize 1600 0 shots/patients.png -o apps/landing/img/patients.webp`
   (telefon: `-resize 780 0`, keyin `-crop 0 0 780 1180`).

`img/og.png` / `img/og-ru.png` (1200×630, ijtimoiy tarmoq uchun) — `og.html` / `og-ru.html`
shabloni shu papkada:
`apps/landing` ni 5191 portda ochib (`python3 -m http.server 5191`), `og.html` ni oʻsha
papkaga vaqtincha koʻchirib, `node scripts/landing/og.mjs apps/landing/img/og.png`.
