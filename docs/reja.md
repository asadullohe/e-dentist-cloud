`Ish rejasi · 1-tahrir`

# Ish rejasi

> Bu fayl — **holatning yagona manbai**. Qaysi task tayyor, qaysi biri navbatda —
> shu yerdan koʻriladi. Ish tartibi: [`ish-tartibi.md`](ish-tartibi.md).
> Nima qurilishi: [`tz.md`](tz.md).

**Belgilar:** `[ ]` boshlanmagan · `[~]` jarayonda · `[x]` tayyor

**Hozirgi task: 2.6** — bosqich 1 tugadi, `master` da

---

## Bosqich 0 — Lokal muhit · 1-2 kun

_Maqsad: notebookda bitta buyruq bilan baza, Redis va fayl saqlagich koʻtariladi.
Server hali kerak emas._

- [x] **0.1 Asboblarni tekshirish** — Node 22.22, npm 10.9, git 2.50, Docker 29.7.
      Demon ishlayapti, 12 vCPU / 8 GB ajratilgan
- [x] **0.2 Birinchi commit** — `5d4ca95`. Diqqat: eski holat commit boʻlgan
      (fayllar tahrirdan oldin `git add` qilingan), hujjat yangilanishlari keyingi commitda
- [x] **0.3 `docker-compose.yml`** — `postgres:16-alpine`, `redis:7-alpine`,
      `minio:latest`. Nomlangan volume (macOS da bind mount dan tez), healthcheck bilan
- [x] **0.4 `.env.example` va lokal `.env`** — `.env` git ga tushmaydi, `.env.example` tushadi
- [x] **0.5 Ulanishni tekshirish** — Postgres 16.15 (aarch64), Redis, MinIO S3 API va
      konsoli — hammasi javob beradi. Oʻzbekcha `ʻ` belgisi bazada toʻgʻri ishlanadi

**Bosqich natijasi ✓** — `docker compose up -d` → uch konteyner `healthy`.

> **Lokal port oʻzgarishi**
>
> Notebookda Homebrew PostgreSQL 14 oʻrnatilgan va 5432-portni egallagan. Shuning uchun
> konteyner **5433** ga chiqarildi (`POSTGRES_PORT` `.env` da). Konteyner ichida va
> serverda port baribir 5432 — kod bunga bogʻliq emas, `DATABASE_URL` orqali ishlaydi.

---

## Bosqich 1 — Poydevor · ~2 hafta

_Maqsad: klinika roʻyxatdan oʻtadi, egasi kiradi, boʻsh kabinet ochiladi.
Koʻp ijarachilik qatlami `auth` dan **oldin** quriladi._

### Skelet

- [x] **1.1 Monorepo skeleti** — npm workspaces (`apps/*`, `packages/*`),
      `tsconfig.base.json` (qatʼiy rejim + `noUncheckedIndexedAccess`),
      Biome 2.5 — format va lint bitta asbobda (nuqtali vergulsiz, bir tirnoq —
      oflayn loyiha uslubi), Vitest, tsx. `@e-dentist/api` `@e-dentist/shared` dan
      import qila oladi
- [x] **1.2 `packages/shared`** — `strings.ts`, `format.ts`, `validation.ts`, `types.ts`.
      39 ta test oʻtadi. Ikkita ataylab qilingan oʻzgarish: `soum()` endi «summalarni
      yashirish» sozlamasiga bogʻliq emas (u koʻrinish masalasi → `packages/ui`), va
      raqam guruhlash `toLocaleString` oʻrniga qoʻlda — server va brauzer bir xil
      matn chiqarishi uchun. Maydon nomi `full_name` → `fio` (tz.md modeliga mos)
- [x] **1.3 `apps/api` skeleti** — Fastify 5, `platform/` qatlami: `config.ts`
      (muhit oʻzgaruvchilari zod bilan tekshiriladi — notoʻgʻri boʻlsa server
      koʻtarilmaydi), `tz.ts`, `errors.ts`, `javob.ts`, `server.ts`.
      `GET /api/health` sana va vaqtni ham qaytaradi — vaqt zonasini bir qarashda
      tekshirish uchun. Vaqt zonasi muhitdan keladi (`TZ=Asia/Tashkent`) va ishga
      tushishda tasdiqlanadi: ESM da importlar modul tanasidan oldin bajarilgani
      uchun uni kod ichida oʻrnatib boʻlmaydi
- [x] **1.4 Javob shakli va xato ishlovchisi** — `AppXato` sinfi, xato kodi → HTTP
      holati moslashuvi bir joyda. Mavjud boʻlmagan manzil, buzuq JSON va kutilmagan
      xato — hammasi bir xil shaklda. Texnik tafsilot javobga chiqmasligini test
      qorovullaydi (baza paroli bor xato otiladi, javobda yoʻqligi tekshiriladi)

> **Modul chegarasi endi lint bilan majburlanadi**
>
> `biome.json` da `noRestrictedImports`: bir modul boshqa modulning `repo.ts`,
> `routes.ts` yoki `schema.ts` iga import qila olmaydi — faqat `service.ts` ga.
> TZ ning eng muhim arxitektura qoidasi kod koʻrigida qidirilmaydi, lint ushlaydi.

### Koʻp ijarachilik — eng xavfli qatlam

- [x] **1.5 Prisma sxema, 1-qism** — `clinics`, `users`, `roles`, `invites`, `audit_log`.
      Identifikatorlar UUID v7 (vaqt boʻyicha tartiblangan — indeks uchun yaxshi,
      ketma-ket son esa umumiy bemorlar sonini oshkor qiladi). Ish sanalari `DATE`,
      texnik vaqt belgilari `timestamptz`
- [x] **1.6 Birinchi migratsiya va seed** — `20260907104315_boshlangich`. Rol shablonlari
      **bazada emas, kodda** (`packages/shared/rollar.ts`): ular har klinikaga nusxalanadi
      va oʻshaniki boʻlib qoladi, shuning uchun «umumiy shablon qatori» kerak emas.
      Seed takrorlanadi — ikki marta ishlatilsa ham bitta klinika, beshta rol

> **Sxemada tz.md dan farq qiladigan joylar**
>
> Hammasi `tz.md` 5-boʻlimiga yozib qoʻyildi. Eng muhimlari:
>
> · `invites.token` oʻrniga `token_hash` — baza sizib chiqsa taklifnoma ishlamasin
> · `roles.template` qoʻshildi — texnikning boshlangʻich sahifasini aniqlash uchun
> · `audit_log.entity_id` qoʻshildi — 12-boʻlim «qaysi bemor yozuvi» deb talab qiladi
> · `users.email` butun tizimda yagona — 1-versiyada bitta odam ikki klinikada
>   ishlay olmaydi. Kirish faqat pochta bilan boʻlgani uchun shu sodda yoʻl tanlandi
>
> **Ruxsat toʻplamlari** `packages/shared/rollar.ts` da, 10 ta test bilan. Texnikka
> `patients.read` **berilmadi**: u butun kartotekani ochib yuboradi, texnikka kerak
> boʻlgan yagona narsa — bemorning ismi — naryadning oʻzida keladi (tz.md 7-boʻlim).
> Toʻplamlar sizga mos kelmasa ayting, bitta fayl oʻzgaradi.
- [x] **1.7 Repozitoriya qatlami** — `platform/tenant.ts`. `klinikaSessiyasi()`
      tranzaksiya ochadi, `app.clinic_id` ni oʻrnatadi va Prisma kengaytmasi orqali
      har soʻrovga `clinicId` qoʻshadi. Boshqa klinika qoʻlda yozilsa **jimgina
      tuzatilmaydi, xato beriladi** — jim tuzatish soʻrovni boshqa klinikaga burib
      yuborardi va xato koʻrinmay qolardi
- [x] **1.8 Postgres RLS** — beshta jadvalga siyosat, `app_clinic_id()` funksiyasi orqali.
      Kontekst oʻrnatilmagan boʻlsa **hech narsa koʻrinmaydi** (yopiq qolish, ochiq emas).
      Bazada ikkita rol: `edentist` (migratsiya, RLS dan ozod) va `edentist_app`
      (ishga tushirish, RLS ostida) — batafsil `tz.md` 5-boʻlimda
- [x] **1.9 Koʻp ijarachilik testi** — 12 ta test, haqiqiy bazaga ulanadi.
      Ichida **nazorat testi** ham bor: A oʻz yozuvini oʻzgartira olishi tekshiriladi —
      busiz «begona yozuvni oʻzgartirib boʻlmaydi» testi `update` umuman ishlamagan
      taqdirda ham oʻtib ketardi

> **Identifikatorlar `TEXT` dan `uuid` ga oʻtkazildi**
>
> RLS siyosati `clinic_id = app_clinic_id()` deb solishtiradi, Postgres esa `text`
> va `uuid` ni solishtira olmaydi. Prisma `String @id` ni sukut boʻyicha `TEXT`
> qiladi — `@db.Uuid` qoʻshildi va migratsiya qoʻlda yozildi (Prisma bu oʻtishni
> oʻzi yoza olmaydi). Yon foyda: 16 bayt, 36 emas.

### auth moduli

- [x] **1.10 Roʻyxatdan oʻtish** — `POST /api/auth/register`. Klinika `id` si kodda
      yaratiladi (`platform/uuid.ts`, uuid v7) va sessiya oʻsha id bilan ochiladi —
      RLS `WITH CHECK` shuni talab qiladi. Parol `argon2id`. Takror pochta → `409`
- [x] **1.11 Pochtani tasdiqlash** — `POST /api/auth/verify`. Bazada kalitning oʻzi
      emas, `sha256` xeshi. Ishlatilgan kalit oʻchiriladi — ikki marta ishlamaydi.
      Lokalda xat konsolga chiqadi
- [x] **1.12 Kirish, chiqish, me** — Redis sessiya, `httpOnly` + `sameSite=lax` cookie.
      Ikkita `SECURITY DEFINER` funksiya (`auth_find_user`, `auth_verify_email`):
      kirish paytida klinika hali nomaʼlum va RLS `users` ni yopib turadi. Funksiyalar
      faqat kerakli maydonlarni qaytaradi, `search_path` qatʼiy belgilangan

> **Sana ustunlarida bir kunlik xato topildi**
>
> Sinov muddati 14 kun oʻrniga 13 kun boʻlib chiqdi. Sabab: `DATE` ustuniga
> **mahalliy** yarim tun yozilardi, Toshkent esa UTC+5 — 21-sentabr 00:00 mahalliy
> = 20-sentabr 19:00 UTC, baza esa kunni 20-sentabr deb saqlaydi.
>
> Yechim `packages/shared` da: `bazaSanasi()` va `kunQoshib()` kunni mahalliy
> vaqtdan oladi, lekin UTC yarim tunini yozadi. **Har bir `DATE` ustunida shu
> funksiyalar ishlatiladi** — tashrif, qabul, toʻlov sanalarida ham.

> **Migratsiyadan keyin klient qayta yaratilishi shart**
>
> `prisma migrate dev` klientni har doim ham yangilamaydi. Sxemaga qoʻshilgan
> maydonlar klientda yoʻq boʻlsa, Prisma tushunarsiz «unknown argument» xatosini
> beradi. `npm run db:migrate` endi `prisma generate` ni ham chaqiradi.
- [x] **1.13 Ruxsat tekshiruvi** — `app.talabRuxsat('patients.read')`. Rol ham,
      ruxsatlar ham **har soʻrovda bazadan** oʻqiladi. Egasi `staff.manage` va
      `billing.manage` ni yoʻqota olmaydi (`clinics.tekshirRolRuxsatlari`)
- [x] **1.14 Cheklovlar** — hisob boʻyicha 5/15daq, IP boʻyicha 20/15daq,
      roʻyxatdan oʻtish 3/kun. Muvaffaqiyatli kirish hisoblagichni tozalaydi.
      Bir martalik pochta domenlari rad etiladi (`packages/shared/pochta.ts`)
- [x] **1.15 `audit_log`** — roʻyxatdan oʻtish, tasdiqlash, kirish, kirish xatosi,
      chiqish. Test yozuvlarda parol yoki xesh yoʻqligini ham tekshiradi

> **Sessiyada `roleId` saqlanmaydi**
>
> Dastlab sessiyaga `roleId` yozilgan edi. Test uni ushladi: egasi xodimning
> rolini almashtirsa, sessiyadagi nusxa eskirib qolardi va xodim **qayta
> kirmaguncha eski huquqlari bilan ishlab turardi**.
>
> Endi sessiyada faqat `userId` va `clinicId`. Har ruxsat tekshiruvida
> foydalanuvchi va uning roli bazadan oʻqiladi. Yon foyda: faolsizlantirilgan
> xodimning **ochiq sessiyasi ham** oʻsha zahoti toʻxtaydi.

> **`clinics` moduli ajratildi**
>
> Ruxsatlar `roles` jadvalida, u esa `clinics` moduliniki. `auth` unga
> toʻgʻridan-toʻgʻri murojaat qilayotgan edi — CLAUDE.md dagi asosiy qoida
> buzilardi. Endi chegara aniq:
>
> · `auth` — `users` jadvali: hisob, parol, pochta tasdigʻi
> · `clinics` — `clinics` va `roles` jadvallari
>
> `auth` `clinics/service.ts` ni chaqiradi, tranzaksiya esa umumiy: roʻyxatdan
> oʻtishda klinika, rollar va egasi bitta tranzaksiyada yaratiladi.

### Kabinet skeleti

- [x] **1.16 `apps/cabinet` skeleti** — Vite 8 + React 18.3.1 + react-router 7.
      `styles.css` oflayn loyihadan **aynan** koʻchirildi (1005 qator, indigo palitra)
      va tekshiruvdan chiqarildi — ikkala loyihadagi dizayn ajralib ketmasin.
      Vebga xos tuzatishlar alohida `kabinet.css` da
- [x] **1.17 Kirish, roʻyxatdan oʻtish va tasdiqlash sahifalari** — forma xatolari
      maydon boʻyicha koʻrsatiladi, telefon maskasi `shared` dan
- [x] **1.18 Boʻsh kabinet** — yon menyu ruxsatlarga qarab shakllanadi, sinov
      muddati banneri, «Chiqish». Brauzerda tekshirildi: rol «Texnik» ga
      almashtirilganda menyu bitta boʻlimga qisqaradi, qayta kirish shart emas

> **Kod ingliz tiliga oʻtkazildi, frontend FSD boʻyicha qayta qurildi**
>
> Dastlab identifikatorlar oʻzbekcha yozilgan edi va frontend tuzilishi
> oʻzboshimchalik bilan tanlangan edi. Qoidalar `CLAUDE.md` ga yozib qoʻyildi:
>
> · kodda hamma narsa **inglizcha** — fayl nomlari, funksiyalar, oʻzgaruvchilar,
>   tiplar, enum qiymatlari. Oʻzbekcha faqat `strings.ts` dagi matn va izohlar
> · frontend — **Feature-Sliced Design**: `app · pages · widgets · features ·
>   entities · shared`
> · har sahifa oʻz papkasida: `index.ts`, `<Name>.tsx`, `<Name>.module.scss`
> · API bilan ishlash — **TanStack Query**, qoʻlbola `useState` + `useEffect` emas
>
> Tasdiqlash havolasi ham oʻzgardi: `/tasdiqlash?kalit=` → `/verify?token=`.

> **Tailwind + shadcn/ui, React 19**
>
> Tayyor komponentlar kutubxonasi qoʻshildi: 25 ta shadcn komponenti
> `shared/ui/` da (forma, jadval, oyna, kalendar, bildirishnoma). Ranglar
> oflayn ilovaning indigo palitrasiga ulangan — tashqi koʻrinish oʻzgarmadi,
> tungi rejim ham ishlaydi.
>
> Yoʻlda React 18 dan 19 ga oʻtishga toʻgʻri keldi: shadcn ning **barcha 25**
> komponenti `forwardRef` siz yozilgan, ular React 19 ning «ref oddiy prop»
> xulqiga tayanadi. 18 da `react-hook-form` maydonga `ref` yubora olmasdi —
> xato boʻlganda kursor maydonga tushmasdi. Sabab `tz.md` 3-boʻlimiga yozildi.
>
> `*.module.scss` fayllar olib tashlandi, `sass` paketi ham.

> **Lokalda CORS kerak emas**
>
> Vite `/api` ni `localhost:3000` ga uzatadi. Brauzer uchun kabinet ham, API ham
> bitta manzil — xuddi serverdagidek (u yerda Caddy shu ishni qiladi). CORS
> sozlamasi ham, `credentials` bilan ovoragarchilik ham yoʻq.

> **React nusxasi ikkita boʻlib qolgan edi**
>
> `prisma` CLI ichidagi Prisma Studio ildizga React 19 ni tortib keladi, kabinet
> esa React 18 da (tz.md). Natijada `react-router` bitta nusxani, bizning kod
> boshqasini koʻrdi va hooklar umuman ishlamadi.
>
> Ikki joyda tuzatildi: `vite.config.ts` da `resolve.dedupe`, va
> `apps/cabinet/tsconfig.json` da React tiplarining yoʻli. Shu bilan birga har
> ilovaga oʻz `tsconfig` i berildi — API Node uchun, kabinet brauzer uchun.

> **Tasdiqlash havolasi ikki marta ochilishi mumkin**
>
> Brauzerdagi sinov nuqsonni ochdi: React StrictMode effektni ikki marta
> chaqiradi, birinchi soʻrov kalitni ishlatib yuboradi, ikkinchisi «Havola
> yaroqsiz» deydi. Bu faqat ishlab chiqish muammosi emas — baʼzi pochta
> mijozlari havolani foydalanuvchidan oldin ochib koʻradi.
>
> `auth_verify_email` endi takrorlansa ham bir xil natija beradi (`COALESCE`),
> mijoz tomonida esa ikkinchi soʻrov umuman yuborilmaydi.

**Bosqich natijasi:** roʻyxatdan oʻtish → pochta tasdiqlash → kirish → boʻsh kabinet.
Koʻp ijarachilik testi yashil.

---

## Bosqich 2 — Asosiy ish oqimi · ~3 hafta

_Mahsulotning yuragi. Oxirida klinika haqiqatan ishlata boshlashi mumkin._

- [x] **2.1 Prisma sxema, 2-qism** — `patients`, `visits`, `teeth`, `bridges`,
      `payments`, `appointments`, `services`, `images` + RLS siyosatlari.
      `TENANT_MODELS` ham yangilandi

> **Qamrovni qorovullaydigan test qoʻshildi**
>
> Yangi jadval qoʻshilganda ikki joyni yangilash kerak: RLS siyosati va
> `TENANT_MODELS`. Bittasi unutilsa **hech qanday xato koʻrinmaydi**, faqat
> himoya bir qatlamga tushadi.
>
> `tenant.test.ts` endi ikkalasini ham tekshiradi: `clinic_id` ustuni bor har
> bir jadvalda siyosat borligini, va `TENANT_MODELS` soni bazadagi ijarachi
> jadvallari soniga tengligini. Nazorat qilib koʻrildi — modelni ataylab
> olib tashlaganda test qizaradi.
- [x] **2.2 `patients` moduli** — CRUD, qidiruv, sahifalash. 18 ta test, shundan
      4 tasi koʻp ijarachilikka. Sinov muhiti `test-support/harness.ts` ga chiqarildi —
      keyingi modullar ham shundan foydalanadi

> **Qidiruv apostrofsiz ham topadi**
>
> Oʻzbekcha ismlarda apostrof uch xil yoziladi (`Gʻ`, `G'`, `G’`), ustiga odam
> uni umuman yozmasligi ham mumkin — klaviaturada topish qiyin. Shuning uchun
> bemorda `fio_search` ustuni bor: `searchKey()` apostrofni butunlay olib
> tashlaydi. `normalizeName` esa oʻzgarmadi — u takrorlarni aniqlashda
> ishlatiladi va u yerda apostrof farqi saqlangani maʼqul.
- [x] **2.3 Bemorlar sahifasi** — roʻyxat, qidiruv (kechiktirilgan), sahifalash,
      qoʻshish/tahrirlash oynasi, oʻchirishni tasdiqlash. shadcn `Table`, `Dialog`,
      `AlertDialog` bilan. Sana KK/OO/YYYY koʻrinishida kiritiladi va koʻrsatiladi
      (`maskDisplayDate` / `parseDisplayDate`)

> **Ustun filtrlari keyinroq**
>
> TZ da «ustun filtrlari» ham bor. Hozircha bitta umumiy qidiruv qilindi —
> F.I.O. va telefon boʻyicha. Ustun boʻyicha alohida filtrlar qarzdorlik va
> tashrif sanasi qoʻshilgandan keyin (2.10) maʼnoli boʻladi.

> **Yon menyu mobil ekranda hali yigʻilmaydi**
>
> Jadval va sarlavha tor ekranga moslashdi, lekin yon menyu 224px joy egallab
> turaveradi. Telefonda kabinetni ochish uchun uni yigʻiladigan qilish kerak —
> alohida task sifatida bosqich 2 oxirida.
- [x] **2.4 `packages/teeth`** — FDI raqamlash, tish turlari, ravoq geometriyasi,
      holat va material ranglari. 14 ta test. Oʻzbekcha nomlar bu paketda emas,
      `shared/strings.ts` da (`TOOTH_STATUS_LABELS`, `CROWN_MATERIAL_LABELS`) —
      qoidaga koʻra barcha matn bir joyda
- [x] **2.5 `ToothChart` komponenti** — `entities/tooth/ui/`. Faqat chizadi:
      maʼlumotni props orqali oladi, bosilganini `onPick` bilan xabar qiladi.
      Tahrirlash oynasi 2.7 da (`features/tooth-edit`).
      Brauzerda tekshirildi: doimiy xaritada 32 tish, sut xaritasida 20 tish,
      koʻprik yoʻlagi va 8 bandli izoh

> **Koʻprik modeli oflayndan farq qiladi**
>
> Oflayn ilovada koʻprik `from_tooth` va `to_tooth` bilan saqlanardi, oraliq
> esa `bridgeSpan` bilan hisoblanardi. Bizning sxemada `teeth: Int[]` — toʻliq
> roʻyxat saqlanadi. Shuning uchun komponent oraliqni hisoblamaydi, tayyor
> roʻyxatni chizadi.
- [ ] **2.6 `visits` moduli** — tashriflar, muolajalar, tish xaritasi API
      (`GET/PUT /api/patients/:id/teeth`)
- [ ] **2.7 Bemor kartochkasi** — Tashriflar va Tish xaritasi boʻlimlari
- [ ] **2.8 MinIO fayl qatlami** — yuklash, imzolangan vaqtinchalik havola
      (ochiq URL emas)
- [ ] **2.9 Bemor rasmlari** — kartochkadagi Rasmlar boʻlimi
- [ ] **2.10 `payments` moduli** — toʻlov qabul qilish, qarz hisobi, qarzdorlar roʻyxati
- [ ] **2.11 Toʻlovlar boʻlimi va Qarzdorlar sahifasi**
- [ ] **2.12 `services` moduli** — narxnoma (tashrifga narx tanlash uchun kerak)
- [ ] **2.13 Excel: shablon va chiqarish** — `GET /api/patients/import/template`,
      `GET /api/patients/export`. Chiqarilgan fayl = shablon, `id` ustuni bilan
- [ ] **2.14 Excel: import preview** — sarlavha nomi boʻyicha ustun tanish, sana tuzoqlari,
      telefon normallashtirish, takrorlarni topish, birinchi 20 qator jadvalda
- [ ] **2.15 Excel: import commit** — yozish, hisobot (qoʻshildi / yangilandi / oʻtkazildi),
      xatolar alohida faylga, `audit_log` ga bitta yozuv
- [ ] **2.16 `schedule` moduli va Qabul jadvali sahifasi** — oylik kalendar, kunlik roʻyxat
- [ ] **2.17 Mobil koʻrinish** — yon menyuni yigʻiladigan qilish (shadcn `Sheet`),
      jadvallarni tor ekranga moslash

---

## Bosqich 3 — Pul, hisobot, texnik · ~2 hafta

- [ ] **3.1 `expenses` moduli va Xarajatlar sahifasi**
- [ ] **3.2 `reports` moduli** — oylik tushum, sof foyda, 12 oylik grafik
- [ ] **3.3 Xodimlar va rollar** — taklifnoma oqimi (7 kun), ruxsat matritsasi UI,
      qulflanib qolishdan himoya
- [ ] **3.4 Prisma: `lab_orders`** + RLS
- [ ] **3.5 `lab` moduli** — naryad CRUD, holatlar (berildi → tayyor → topshirildi),
      «qaytarildi» amali va sababi
- [ ] **3.6 Lab bogʻlanishlari** — «topshirildi» da tish xaritasi yangilanadi,
      texnik narxi xarajatga tushadi
- [ ] **3.7 «Texnik ishlari» sahifasi** — filtrlar, muddati oʻtganlari tepada.
      Texnik kirganda boshlangʻich sahifasi shu
- [ ] **3.8 Toʻliq eksport** — «Barcha maʼlumotni yuklab olish», zip formatida

---

## Bosqich 4 — Navbat va QR · ~2 hafta

_Alohida boʻlim. Muddat qisqarsa — birinchi qisqartiriladigan joy._

- [ ] **4.1 Sxema** — `appointments` ga `queue_number`, `queue_status`;
      klinikaga 8 belgili tasodifiy kod
- [ ] **4.2 Ochiq sahifa `/n/<kod>`** — shifokorlar, navbatdagilar soni, taxminiy vaqt,
      yozilish formasi. Loginsiz
- [ ] **4.3 SSE jonli yangilanish** — bir tomonlama oqim, proxy orqali oʻtadi
- [ ] **4.4 Kutish xonasi ekrani `/n/<kod>/ekran`** — katta shrift, faqat raqamlar, ismsiz
- [ ] **4.5 Kabinetdagi navbat** — toʻliq roʻyxat, chaqirish / keldi / kelmadi / yakunlandi,
      `queue.manage` ruxsati
- [ ] **4.6 Suiisteʼmoldan himoya** — qurilmadan kuniga 2 ta, IP dan soatiga 5 ta,
      «tasdiqlanmagan» holat, klinika navbatni butunlay oʻchira oladi

---

## Bosqich 5 — Boshqaruv paneli va chiqarish · ~2 hafta

_Bu bosqichda birinchi marta haqiqiy server kerak boʻladi._

### Dastur

- [ ] **5.1 `billing` moduli** — `expires_at` tekshiruvi, muddat tugasa faqat-oʻqish rejimi.
      Maʼlumot hech qachon oʻchirilmaydi
- [ ] **5.2 `apps/admin` skeleti** — kirish, platforma admini roli
      (`clinic_id` boʻsh, `patients` moduli umuman ochilmaydi)
- [ ] **5.3 Klinikalar roʻyxati va kartochkasi** — muddatni uzaytirish, bloklash, tarix
- [ ] **5.4 Statistika va hodisalar**
- [ ] **5.5 Telegram xabarnoma** — yangi roʻyxatdan oʻtish haqida xabar
- [ ] **5.5b SMTP** — hozir xat konsolga chiqadi (`platform/pochta.ts`). Serverda
      haqiqiy pochta kerak, aks holda hech kim roʻyxatdan oʻta olmaydi

### Server — Hetzner

- [ ] **5.6 Serverni olish** _(siz qilasiz, qadamma-qadam koʻrsataman)_ — Hetzner Cloud,
      Ubuntu 24.04. Tavsiya: CX32 (4 vCPU / 8 GB / 80 GB) yoki CPX31.
      Joylashuv: Falkenstein yoki Helsinki
- [ ] **5.7 Serverni sozlash** — ssh kalit, root ni yopish, `ufw` firewall,
      `fail2ban`, Docker oʻrnatish
- [ ] **5.8 DNS** — `kabinet.e-dentist.uz` va `admin.e-dentist.uz` → server IP.
      Apex va `www` Netlify'da qoladi, **tegilmaydi**
- [ ] **5.9 Caddy va HTTPS** — Let's Encrypt avtomatik
- [ ] **5.10 Prod `docker-compose.yml`** — lokaldan ajratilgan, portlar tashqariga ochiq emas,
      faqat Caddy orqali
- [ ] **5.11 GitHub Actions** — test → qurish → `docker compose pull && up -d`.
      Migratsiya ishga tushishdan oldin. Orqaga qaytarish: oldingi image tegi
- [ ] **5.12 Zaxira** — kunlik `pg_dump` (30 kun), MinIO nusxasi,
      **tiklashni bir marta sinab koʻrish** — sinalmagan zaxira zaxira emas
- [ ] **5.13 Kuzatuv** — Uptime Kuma, Postgres loglari
- [ ] **5.14 Birinchi mijoz** — haqiqiy klinikani joylashtirish

---

## Ochiq savollar

Kod yozishga halaqit bermaydi, lekin bosqich 5 gacha javob kerak:

1. **Obuna narxi qancha?** — `billing` modulining tuzilishiga taʼsir qiladi (5.1)
2. **Xodimlar soni tarifga bogʻlanadimi?** — bogʻlansa, xodim qoʻshishda chegara
   tekshiriladi (3.3 va 5.1)
3. **Maʼlumot Oʻzbekistonda turishi shartmi?** — yuridik tekshiruv toʻlov integratsiyasi
   bosqichiga qoldirilgan. Shu sabab joylashtirish koʻchma quriladi: Hetzner ga
   bogʻlanmaymiz, hammasi Docker Compose da
