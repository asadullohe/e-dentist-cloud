# E-Dentist Bulut

Stomatologiya klinikalari uchun brauzerda ishlaydigan obunali xizmat (SaaS).
Oʻzbek tilida, koʻp ijarachili.

## Hujjatlar — har sessiya boshida shu uchtasi

| Fayl | Nima uchun |
|---|---|
| [`docs/tz.md`](docs/tz.md) | **Nima quriladi.** Bosh nusxa: arxitektura, maʼlumotlar modeli, rollar, modullar, API. Qaror oʻzgarsa shu fayl yangilanadi |
| [`docs/reja.md`](docs/reja.md) | **Nima navbatda.** Mayda tasklarga boʻlingan reja. Holatning yagona manbai — task tugagach shu yerda belgilanadi |
| [`docs/ish-tartibi.md`](docs/ish-tartibi.md) | **Qanday ishlaymiz.** Task sikli, git tartibi, «tayyor» mezoni, foydalanuvchiga topshiriq berish shakli |

Ish `reja.md` dagi keyingi belgilanmagan taskdan boshlanadi. Bir vaqtda bitta task.

## Kelishilgan qarorlar

Bular muhokama qilinib tasdiqlangan — qayta ochmang, faqat foydalanuvchi soʻrasa:

- **Modulli monolit**, mikroservis emas (bitta dasturchi)
- Oflayn ilovalar (`e-dentist` repo) — **alohida mahsulot**, maʼlumot koʻchmaydi
- Klinika **oʻzi roʻyxatdan oʻtadi** + 14 kunlik sinov
- Toʻlov **qoʻlda**, Telegram orqali. Payme/Click — 2-bosqich
- Faqat **oʻzbek tili**, lekin barcha matnlar `packages/shared/strings.ts` da
- **Filial yoʻq**: bitta klinika = bitta joy
- Rollar **5 ta** tayyor shablon: Egasi · Shifokor · Qabulxona · Texnik · Kuzatuvchi.
  Klinika ruxsatlarni oʻzgartira oladi, lekin 1-versiyada yangi rol yarata olmaydi
- Bemorlarni **Excel/CSV dan yuklash** shablon orqali; chiqarilgan fayl = shablon
- **Texnik** (protez ustasi) klinika xodimi, oʻz hisobi bilan kiradi, faqat oʻz
  naryadlarini koʻradi. Holatlar: berildi → tayyor → topshirildi + «qaytarildi»
- **QR navbat** 1-versiyada: ochiq sahifa, kutish xonasi ekrani, SSE
- Yuridik tekshiruv **toʻlov integratsiyasi bosqichiga** qoldirilgan

## Texnologiyalar

Node 22 + TypeScript + Fastify · PostgreSQL 16 + Prisma · Redis (sessiya) ·
MinIO (fayllar) · React 19 + Vite + Tailwind 4 + shadcn/ui · TanStack Query ·
Docker Compose · Biome (format va lint, Prettier/ESLint emas) · Vitest.

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

## Kod yozish qoidalari

**Kodda hamma narsa ingliz tilida:** fayl nomlari, funksiyalar, oʻzgaruvchilar,
tiplar, enum qiymatlari, baza ustunlari. Oʻzbekcha faqat ikki joyda:

- **foydalanuvchi koʻradigan matn** — `packages/shared/src/strings.ts` da
- **izohlar** — nima uchun shunday qilinganini tushuntiradi

```ts
// ✅ toʻgʻri
export async function withClinic<T>(db: Db, clinicId: string, fn: …)
export const AUTH_TEXT = { login_failed: 'Pochta yoki parol notoʻgʻri' }

// ❌ notoʻgʻri
export async function klinikaSessiyasi(...)
```

### Frontend tuzilishi — Feature-Sliced Design

```
apps/cabinet/src/
├─ app/         providers, router, layouts, styles/index.css
├─ pages/       har sahifa oʻz papkasida
│  └─ Login/
│     ├─ index.ts            // export { Login } from './Login'
│     └─ Login.tsx
├─ widgets/     Sidebar, TrialBanner
├─ features/    auth: login, logout, register
├─ entities/    session, patient, tooth
└─ shared/      api, ui (shadcn), lib, config
```

Qatlam qoidasi: yuqoridagi pastdagini import qiladi, teskarisi **yoʻq**.
`pages` → `widgets` → `features` → `entities` → `shared`.

- Stillar — **Tailwind 4**. Dizayn tokenlari `app/styles/index.css` da,
  shadcn kutgan nomlarda (`--background`, `--primary`…) va oflayn ilovaning
  indigo palitrasidan olingan. Alohida CSS fayl yozilmaydi
- Komponentlar — **shadcn/ui**: `npx shadcn@latest add <nom> --cwd apps/cabinet`.
  Ular `shared/ui/` ga tushadi va bizniki hisoblanadi — tahrirlash mumkin
- API bilan ishlash — **TanStack Query** (`useQuery` / `useMutation`),
  qoʻlbola `useState` + `useEffect` emas
- Formalar — **react-hook-form + zod**, shadcn `Form` komponenti bilan.
  Serverdan kelgan maydon xatolari `applyServerErrors` orqali formaga tushadi
- Har papkada `index.ts` — tashqariga nima chiqishini oʻsha belgilaydi

## Matn va format qoidalari (oflayn ilovadan koʻchadi)

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

**Hozircha server yoʻq va kerak emas.** Bosqich 5.6 gacha hamma narsa foydalanuvchining
notebookida Docker da ishlaydi: `postgres`, `redis`, `minio` konteynerlari, API va
kabinet `npm run dev` bilan. Lokalda ham baza konteynerda turadi — notebookga
toʻgʻridan-toʻgʻri Postgres oʻrnatilmaydi, aks holda «menda ishlayapti» muammosi chiqadi.

Keyin: **Hetzner Cloud**, Ubuntu 24.04, tavsiya CX32 (4 vCPU / 8 GB / 80 GB),
Falkenstein yoki Helsinki. Konteynerlar: api · postgres · redis · minio · caddy.

Domen `e-dentist.uz`: apex va `www` — Netlify'dagi landing (tegilmaydi),
`kabinet.` va `admin.` — shu server.

Joylashtirish **koʻchma** boʻlishi shart: hech qanday provayderga xos xizmat
ishlatilmaydi, hammasi Docker Compose da. Server Oʻzbekistonga koʻchirilishi
kerak boʻlib qolsa, bu bir kunlik ish boʻlsin.
