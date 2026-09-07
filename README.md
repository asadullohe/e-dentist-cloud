# E-Dentist Bulut

Stomatologiya klinikalari uchun brauzerda ishlaydigan obunali xizmat (SaaS).

Bu **alohida mahsulot** — oflayn Electron/Android/iOS ilovalari boshqa
repozitoriyada (`e-dentist`) va oʻz yoʻlida davom etadi. Ikkalasi orasida
maʼlumot koʻchmaydi.

## Hujjatlar

- [`docs/tz.md`](docs/tz.md) — toʻliq texnik topshiriq. Arxitektura, maʼlumotlar
  modeli, rollar, modullar, API, bosqichlar. Ish shu hujjatga qarab olib boriladi.

## Holat

Loyiha endi boshlanmoqda. TZ ning **1-bosqichi** birinchi ish:

1. Repozitoriya skeleti — npm workspaces, TypeScript, Docker Compose
2. Prisma sxema va migratsiya
3. Koʻp ijarachilik qatlami (`clinicId` + Postgres RLS + test)
4. `auth` moduli — roʻyxatdan oʻtish, sinov, kirish
5. Kabinet skeleti

Oxirida: klinika roʻyxatdan oʻtadi, egasi kiradi, boʻsh kabinet ochiladi.

## Infratuzilma

Server olingan: Contabo, Ubuntu 24.04, 8 GB RAM, 100 GB SSD.
Domen: `e-dentist.uz` — landing Netlify'da apex'da qoladi, ilova
`kabinet.e-dentist.uz`, boshqaruv paneli `admin.e-dentist.uz`.
