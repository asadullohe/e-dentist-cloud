# E-Dentist Bulut

Stomatologiya klinikalari uchun brauzerda ishlaydigan obunali xizmat (SaaS).
Oʻzbek tilida, koʻp ijarachili.

**Toʻliq texnik topshiriq: [`docs/tz.md`](docs/tz.md)** — arxitektura, maʼlumotlar
modeli, rollar, modullar, API, bosqichlar. Ish shu hujjatga qarab olib boriladi;
oʻzgarish kiritilsa oʻsha fayl yangilanadi.

## Kelishilgan qarorlar

Bular muhokama qilinib tasdiqlangan — qayta ochmang, faqat foydalanuvchi soʻrasa:

- **Modulli monolit**, mikroservis emas (bitta dasturchi)
- Oflayn ilovalar (`e-dentist` repo) — **alohida mahsulot**, maʼlumot koʻchmaydi
- Klinika **oʻzi roʻyxatdan oʻtadi** + 14 kunlik sinov
- Toʻlov **qoʻlda**, Telegram orqali. Payme/Click — 2-bosqich
- Faqat **oʻzbek tili**, lekin barcha matnlar `packages/shared/strings.ts` da
- **Filial yoʻq**: bitta klinika = bitta joy
- Rollar tayyor shablon sifatida beriladi; klinika ruxsatlarni oʻzgartira oladi,
  lekin 1-versiyada yangi rol yarata olmaydi
- Bemorlarni **Excel/CSV dan yuklash** shablon orqali; chiqarilgan fayl = shablon
- **Texnik** (protez ustasi) klinika xodimi, oʻz hisobi bilan kiradi, faqat oʻz
  naryadlarini koʻradi. Holatlar: berildi → tayyor → topshirildi + «qaytarildi»
- **QR navbat** 1-versiyada: ochiq sahifa, kutish xonasi ekrani, SSE
- Yuridik tekshiruv **toʻlov integratsiyasi bosqichiga** qoldirilgan

## Texnologiyalar

Node 22 + TypeScript + Fastify · PostgreSQL 16 + Prisma · Redis (sessiya) ·
MinIO (fayllar) · React 18 + Vite · Docker Compose.

Monorepo, npm workspaces: `apps/api`, `apps/cabinet`, `apps/admin`,
`packages/shared`, `packages/ui`, `packages/teeth`.

## Eng xavfli joy: koʻp ijarachilik

Bitta unutilgan `clinicId` boshqa klinikaning bemorlarini koʻrsatib yuboradi.
Uch qatlamli himoya majburiy:

1. Repozitoriya qatlami — har soʻrovga `clinicId` **avtomatik** qoʻshiladi, qoʻlda emas
2. Postgres RLS — sessiya oʻzgaruvchisiga bogʻlangan siyosatlar
3. Har modul uchun test: «A klinikaning tokeni bilan B ning bemorini soʻrash»

Bu qatlam `auth` modulidan **oldin** quriladi. Keyin qoʻshilsa, yozilgan har bir
soʻrovni qayta koʻrib chiqishga toʻgʻri keladi.

Modul chegarasi: **bir modul boshqa modulning jadvaliga soʻrov yubormaydi** —
faqat oʻsha modulning `service.ts` iga murojaat qiladi.

## Yozuv qoidalari (oflayn ilovadan koʻchadi)

- Barcha matn oʻzbek lotinida, ʻ (U+02BB) bilan: «oʻ», «gʻ», «maʼlumot»
- Pul — **butun son** (soʻm). Sana bazada `DATE`, ekranda **doim DD/MM/YYYY**
- API javobi bir xil shaklda: `{ok: true, data}` / `{ok: false, error: {code, message}}`
- Xato matnlari oʻzbekcha va foydalanuvchi tushunadigan tilda; texnik tafsilot logga

## Oflayn loyihadan koʻchiriladigan kod

`~/Documents/projects/e-dentist` dan qaytadan yozmasdan olinadi:

- `src/renderer/src/lib/teeth.js` — odontogramma geometriyasi
- `src/renderer/src/lib/format.js` — sana va pul formati
- `src/renderer/src/lib/validation.js` — telefon maskasi, forma tekshiruvi
- `components/ToothChart.jsx`, `Modal`, `Field`, `MoneyInput`, `DateInput`
- Sahifalar tuzilishi va oʻzbekcha matnlar
- `src/renderer/src/styles.css` — dizayn tokenlari (indigo palitra)

Almashtiriladigan yagona qatlam — `window.api.*` oʻrniga HTTP soʻrovlar.

## Infratuzilma

Contabo VPS (Germaniya), Ubuntu 24.04, 8 GB RAM, 100 GB SSD.
Domen `e-dentist.uz`: apex va `www` — Netlify'dagi landing (tegilmaydi),
`kabinet.` va `admin.` — shu server.

Joylashtirish **koʻchma** boʻlishi shart: hech qanday provayderga xos xizmat
ishlatilmaydi, hammasi Docker Compose da. Server Oʻzbekistonga koʻchirilishi
kerak boʻlib qolsa, bu bir kunlik ish boʻlsin.
