# E-Dentist Bulut

Stomatologiya klinikalari uchun brauzerda ishlaydigan obunali xizmat (SaaS).

Bu **alohida mahsulot** — oflayn Electron/Android/iOS ilovalari boshqa
repozitoriyada (`e-dentist`) va oʻz yoʻlida davom etadi. Ikkalasi orasida
maʼlumot koʻchmaydi.

## Hujjatlar

- [`docs/tz.md`](docs/tz.md) — toʻliq texnik topshiriq. Arxitektura, maʼlumotlar
  modeli, rollar, modullar, API. **Nima quriladi.**
- [`docs/reja.md`](docs/reja.md) — mayda tasklarga boʻlingan reja va holat.
  **Nima navbatda.**
- [`docs/ish-tartibi.md`](docs/ish-tartibi.md) — task sikli, git tartibi,
  «tayyor» mezoni. **Qanday ishlaymiz.**

## Holat

Loyiha endi boshlanmoqda — hozircha faqat hujjatlar. Birinchi ish:
**bosqich 0 — lokal muhit** (Docker da postgres, redis, minio).

Keyin **bosqich 1 — poydevor**: monorepo skeleti, Prisma sxema, koʻp ijarachilik
qatlami (`clinicId` + Postgres RLS + test), `auth` moduli, kabinet skeleti.
Oxirida: klinika roʻyxatdan oʻtadi, egasi kiradi, boʻsh kabinet ochiladi.

Batafsil va joriy holat — [`docs/reja.md`](docs/reja.md).

## Infratuzilma

Hozircha server yoʻq: ishlab chiqish notebookda, Docker Compose bilan.
Server bosqich 5.6 da olinadi — **Hetzner Cloud**, Ubuntu 24.04, CX32 atrofida.

Domen: `e-dentist.uz` — landing Netlify'da apex'da qoladi, ilova
`kabinet.e-dentist.uz`, boshqaruv paneli `admin.e-dentist.uz`.
