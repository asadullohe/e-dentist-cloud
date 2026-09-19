`Ish rejasi · 1-tahrir`

# Ish rejasi

> Bu fayl — **holatning yagona manbai**. Qaysi task tayyor, qaysi biri navbatda —
> shu yerdan koʻriladi. Ish tartibi: [`ish-tartibi.md`](ish-tartibi.md).
> Nima qurilishi: [`tz.md`](tz.md).

**Belgilar:** `[ ]` boshlanmagan · `[~]` jarayonda · `[x]` tayyor

**Hozirgi task:** yoʻq — 10-bosqich yopildi _(17/09/2026)_

0 dan 8 gacha barcha tasklar yopiq _(14/09/2026)_. Server ishlayapti: kabinet,
boshqaruv paneli va landing ochiq _(09/09/2026)_. 9-bosqich 15/09/2026 da boshlandi

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
- [x] **2.6 `visits` moduli** — tashriflar CRUD, tish xaritasi (`GET/PUT`).
      16 ta test

> **RLS tashqi kalitlarni himoya qilmaydi**
>
> Postgres tashqi kalit tekshiruvini RLS siyosatlarini chetlab oʻtib bajaradi.
> Tekshirib koʻrildi: `assertPatient` olib tashlansa, API begona klinikaning
> bemoriga tashrif yozishga **ruxsat beradi** va `200` qaytaradi.
>
> Endi boshqa modulning yozuviga havola qiladigan har bir amal
> `patients.existsInClinic` orqali tekshiradi. `payments` (2.10),
> `appointments` (2.16) va naryadlarda (3.5) ham shunday boʻlishi shart.
> Sabab `tz.md` 5-boʻlimiga yozildi.
- [x] **2.7 Bemor kartochkasi** — `/patients/:id`. Ikki boʻlim: Tashriflar
      (jadval, jami summa, qoʻshish/tahrirlash/oʻchirish) va Tish xaritasi
      (odontogramma, tishni bosib holat va material belgilash).
      Brauzerda tekshirildi: tashrif yozildi, 16-tishga sirkoniy koronka
      qoʻyildi va xaritada darhol koʻrindi

> **Koʻprik tahrirlash hali yoʻq**
>
> Xarita koʻpriklarni **chizadi**, lekin ularni yaratish/oʻchirish oynasi
> qurilmagan. Oflayn ilovada bu bor edi. Reja roʻyxatida alohida task yoʻq
> edi — 2.7a sifatida qoʻshildi.

- [x] **2.7a Koʻprik tahrirlash** — yaratish va oʻchirish. Oraliqdagi har tishga
      rol tanlanadi: tayanch **koronka** yoki **quyma tish**. Sukut rol tishning
      holatiga qarab: tishi yoʻq joyga quyma tish. Oʻchirilganda holatlar
      qaytariladi — quyma tish oʻrni «olib tashlangan», tayanchlar «sogʻlom».
      6 ta test. Brauzerda tekshirildi: 45–42 koʻprigi qoʻyildi (43 quyma),
      keyin oʻchirildi va holatlar toʻgʻri qaytdi
- [x] **2.8 Fayl qatlami** — `platform/storage.ts`. MinIO S3 mos, shuning uchun
      standart S3 mijozi ishlatiladi — provayder almashsa faqat endpoint
      oʻzgaradi. Havolalar 5 daqiqalik imzolangan; ochiq URL bilan kirib
      boʻlmaydi (test buni tekshiradi: imzosiz murojaat 403). 6 ta test
- [x] **2.9 Bemor rasmlari** — kartochkada Rasmlar boʻlimi: yuklash, izoh,
      kattalashtirib koʻrish, oʻchirish. 5 ta test. Rasmlar `patients`
      modulida (tz.md 8-boʻlim). Brauzerda tekshirildi: rasm yuklandi,
      imzolangan havola bilan koʻrindi, oʻchirilganda saqlagichdan ham ketdi
- [x] **2.10 `payments` moduli** — toʻlov CRUD, hisob (`/balance`), qarzdorlar
      roʻyxati. 13 ta test

> **Qarzdorlar uch modulning maʼlumotidan yigʻiladi**
>
> Qarz = tashriflar − toʻlovlar, bemor nomi esa uchinchi modulda. Bitta SQL
> bilan qilish tezroq boʻlardi, lekin modul chegarasini buzardi. Shuning uchun
> har biri oʻz servisidan soʻraladi (`visits.chargeTotals`,
> `patients.findByIds`) va birlashtirish `payments` da boʻladi.
>
> Klinikada bemorlar soni mingdan oshmaydi — bu hajmda farq sezilmaydi.
> Sekinlashsa, chegarani buzmasdan tezlashtirish yoʻli bor: `reports`
> moduliga koʻchirish yoki koʻrinish (view) yasash.
- [x] **2.11 Toʻlovlar boʻlimi va Qarzdorlar sahifasi** — kartochkada hisob
      (tashriflar / toʻlangan / qarz) va toʻlovlar jadvali; alohida Qarzdorlar
      sahifasi jami qarz bilan. Brauzerda tekshirildi: 100 000 toʻlov qabul
      qilindi, qarz 250 000 dan 150 000 ga tushdi va qarzdorlar roʻyxatida ham
      oʻsha koʻrindi
- [x] **2.12 `services` moduli va Narxnoma sahifasi** — CRUD, klinika ichida
      nom takrorlanmaydi. Tashrif formasida «Narxnomadan tanlash» — muolaja
      nomi va narxni oʻzi toʻldiradi, keyin qoʻlda oʻzgartirsa ham boʻladi.
      10 ta test

> **Narxnomani oʻqish uchun alohida ruxsat yoʻq**
>
> Yozish `services.manage` talab qiladi, oʻqish esa faqat klinikaga kirgan
> boʻlishni. Sabab: shifokor tashrif yozayotganda narxni tanlashi kerak,
> lekin unga `services.manage` berilmagan. Bu bemor maʼlumoti emas —
> klinikaning oʻz sozlamasi.
>
> Xizmat oʻchirilsa tashriflardagi nom va narx **saqlanib qoladi**
> (`serviceId` `null` boʻladi) — narxnoma oʻzgarsa tarix buzilmasin.
- [x] **2.13 Excel: shablon va chiqarish** — shablonda toʻgʻri ustunlar, ikkita
      namuna qator va ikkinchi varaqda qoʻllanma. Chiqarilgan fayl aynan
      shablon — uni tahrirlab qaytadan yuklash mumkin. 6 ta test

> **SheetJS oʻrniga boshqa kutubxona**
>
> TZ da SheetJS (`xlsx`) aytilgan edi, lekin uning npm dagi nusxasi
> (`0.18.5`) tashlab qoʻyilgan: ikkita **yuqori** darajali zaiflik —
> prototype pollution va ReDoS, **tuzatish yoʻq**. SheetJS oʻz CDN siga
> koʻchgan.
>
> Bu import bosqichida (2.14) muhim: biz **foydalanuvchi yuklagan faylni**
> tahlil qilamiz — tahlilchidagi zaiflik aynan oʻsha yerda ishlaydi.
>
> Tanlandi: `write-excel-file` + `read-excel-file` — ogohlantirish yoʻq,
> bogʻliqligi bitta, faol qoʻllab-quvvatlanadi. Sabab `tz.md` 3-boʻlimiga
> yozildi.
- [x] **2.14 Excel: import preview** — ustunlar sarlavha nomi boʻyicha tanaladi
      (tartib oʻzgarsa ham, ortiqcha ustun boʻlsa ham), sana uch koʻrinishda
      oʻqiladi, telefondagi yoʻqolgan nol tiklanadi, takrorlar telefon va ID
      boʻyicha topiladi. 25 ta tahlil testi + oqim testlari

> **TZ dagi bitta raqam notoʻgʻri edi**
>
> «Excel seriya raqami `32915` = 12/05/1990» deyilgan edi. Test buni ushladi:
> `32915` aslida **1990-02-11**, 12-may esa **33005**. Boshlangʻich nuqta
> 1899-12-30 (Excel 1900-yilni kabisa deb hisoblaydi). Nazorat nuqtasi bilan
> tasdiqlandi: `25569` → 1970-01-01. `tz.md` toʻgʻrilandi.
- [x] **2.15 Excel: import commit** — yozish, hisobot, xatolar alohida Excel
      faylga, audit'ga bitta yozuv. Takror bilan uch tanlov: oʻtkazib yuborish ·
      mavjudini yangilash · baribir qoʻshish.
      Brauzerda tekshirildi: 3 qatorli fayldan 1 ta qoʻshildi, 2 ta oʻtkazildi

> **Fayl bir marta yuklanadi**
>
> Tahlil natijasi Redis da yarim soat saqlanadi va «Yuklash» bosilganda
> token boʻyicha oʻqiladi — fayl ikkinchi marta yuborilmaydi. Kalitga
> `clinicId` kiradi, shuning uchun boshqa klinikaning tokeni ishlamaydi.
- [x] **2.16 `schedule` moduli va Qabul jadvali sahifasi** — oylik kalendar, kunlik roʻyxat

> **Jadvalni oʻqish `patients.read` talab qiladi**
>
> Qabul roʻyxatida bemor ismi va telefoni koʻrinadi, shuning uchun `GET
> /api/appointments` shunchaki kirganlarga emas, `patients.read` boriga
> ochiq — texnik jadvalni koʻrmaydi. Yozish uchun `schedule.write`.
> Bemor ismlari `patients.findByIds` orqali olinadi: `schedule` repozitoriyasi
> boshqa modul jadvaliga soʻrov yubormaydi.
- [x] **2.17 Mobil koʻrinish** — yon menyuni yigʻiladigan qilish (shadcn `Sheet`),
      jadvallarni tor ekranga moslash

> **Tor ekranda ustun yashiriladi, jadval siljitilmaydi**
>
> Yon menyu `md` dan pastda `Sheet` ichiga kiradi, oʻrnida menyu tugmasi
> chiqadi. Jadvallarda ikkinchi darajali ustunlar (`yosh`, `manzil`,
> `hisoblandi`, `toʻlandi`) yashiriladi, telefon esa ism ostiga tushadi —
> foydalanuvchi yon tomonga siljitmaydi. Dialog balandligi `100dvh` bilan
> cheklandi: past ekranda ichi aylanadi.

---

## Bosqich 3 — Pul, hisobot, texnik · ~2 hafta

- [x] **3.1 `expenses` moduli va Xarajatlar sahifasi**

> **Xarajat uchun bitta ruxsat**
>
> Ruxsatlar roʻyxatida `expenses.read` bitta (tz.md 6-boʻlim) — u boʻlimni
> butunlay ochadi: xarajatni koʻrgan odam uni yoza ham oladi. Boʻlim egasiga
> tegishli, shuning uchun oʻqish/yozish ajratilmadi.
>
> Turkumlar oflayn ilovadan koʻchdi, ustiga `lab` qoʻshildi: naryad
> topshirilganda texnik narxi shu turkumda xarajatga tushadi (3.6).
> `lab` moduli `expenses` jadvaliga tegmaydi — `expenses.addTx` ni chaqiradi.
- [x] **3.2 `reports` moduli** — oylik tushum, sof foyda, 12 oylik grafik

> **Hisobotning oʻz jadvali yoʻq**
>
> `reports` uchta modulning xizmat qatlamidan kunlik jamlanma soʻraydi
> (`visits.dailyTotalsTx`, `payments.dailyTotalsTx`, `expenses.dailyTotalsTx`)
> va oyga oʻzi yigʻadi. Prisma `groupBy` oy kesimini bilmaydi, xom SQL esa
> ijarachi kengaytmasini chetlab oʻtardi — kunlik guruhlashda bir yilga
> koʻpi bilan 366 qator qaytadi.
>
> **Sof foyda = tushum − xarajat**, qilingan ish narxi emas: hali toʻlanmagan
> ish foyda emas. Oy chegarasi `created_at` uchun klinika vaqtida olinadi
> (jarayon TZ si Asia/Tashkent) — UTC da olinsa 1-may soat 01:00 da qoʻshilgan
> bemor aprelga tushib qolardi. Buni test ushlab turadi.
- [x] **3.3 Xodimlar va rollar** — taklifnoma oqimi (7 kun), ruxsat matritsasi UI,
      qulflanib qolishdan himoya

> **Xodim marshrutlari `auth` da, taklifnoma yozuvi `clinics` da**
>
> `users` jadvali `auth` niki, `invites` va `roles` — `clinics` niki. Agar
> `/api/staff` marshrutlari `clinics` ga qoʻyilsa, u `auth` ni import qilardi
> va ikki modul bir-birini chaqirib halqa hosil qilardi. Shuning uchun
> yoʻnalish bitta: `auth` → `clinics`. Rol marshrutlari (`/api/roles`)
> esa `clinics` da.
>
> Havoladagi kalit bazada saqlanmaydi — faqat sha256 xeshi. Kalitni sessiyasiz
> topish uchun `invite_find` SECURITY DEFINER funksiyasi (auth_find_user bilan
> bir xil uslub): RLS `invites` ni yopib turadi, funksiya esa faqat kerakli
> maydonlarni qaytaradi.
>
> **Uch qulf:** oʻzini oʻzgartira olmaydi · oxirgi faol egani tushirib
> boʻlmaydi · egasi roli `staff.manage` va `billing.manage` ni yoʻqotmaydi.
> Nazorat testi: oxirgi qulf olib tashlanganda egasi faolsizlantirildi va
> keyingi testlar 403 ga uchradi — yaʼni test haqiqatan ushlaydi.
- [x] **3.4 Prisma: `lab_orders`** + RLS
- [x] **3.5 `lab` moduli** — naryad CRUD, holatlar (berildi → tayyor → topshirildi),
      «qaytarildi» amali va sababi

> **Texnik faqat oʻzinikini koʻradi — buni marshrut emas, xizmat qatlami hal qiladi**
>
> `GET /api/lab-orders` ga `lab.own` **yoki** `lab.write` bilan kiriladi
> (`requireAnyPermission` shu uchun qoʻshildi). `lab.write` yoʻq boʻlsa
> xizmat qatlami `techId` ni majburan foydalanuvchining oʻziga tenglaydi —
> soʻrovdagi filtr eʼtiborga olinmaydi. Nazorat testi: bu qator olib
> tashlanganda texnik begona naryadlarni koʻrib qoldi.
>
> Texnik **oʻz** naryadining narxini koʻradi (tz.md 7-boʻlim), boshqalarniki
> uchun `lab.cost` kerak; yozish esa faqat `lab.cost` bilan.
- [x] **3.6 Lab bogʻlanishlari** — «topshirildi» da tish xaritasi yangilanadi,
      texnik narxi xarajatga tushadi

> **Ikkala bogʻlanish ham bitta tranzaksiyada**
>
> Naryad «topshirildi» boʻlganda `visits.setToothTx` tishlarni koronka
> (koʻprikda «quyma tish») holatiga oʻtkazadi va materialini yozadi,
> `expenses.addTx` esa texnik narxini `lab` turkumiga qoʻshadi. Ikkalasi
> ham `setStatus` ning oʻz tranzaksiyasida: «topshirildi» yozilib, xarajat
> yozilmay qolishi mumkin emas.
>
> Olinadigan protez, kappa va ortodontik plastinka tish xaritasiga
> tegmaydi — ular tishga oʻrnatilmaydi. Narx 0 boʻlsa xarajat yozilmaydi.
> Naryadni ikki marta topshirib boʻlmagani uchun xarajat ham takrorlanmaydi
> (test buni tekshiradi).
- [x] **3.7 «Texnik ishlari» sahifasi** — filtrlar, muddati oʻtganlari tepada.
      Texnik kirganda boshlangʻich sahifasi shu

> **Ismlar uchun alohida marshrut**
>
> Shifokor naryadga texnik tayinlaydi, lekin unda `staff.manage` yoʻq —
> toʻliq xodimlar roʻyxatida esa pochta, holat va oxirgi kirish bor.
> Shuning uchun `GET /api/staff/names` qoʻshildi: faqat id va ism,
> `staff.manage` **yoki** `lab.write` bilan ochiladi.
>
> Boshlangʻich sahifa rol nomiga emas, ruxsatga qarab tanlanadi:
> `patients.read` yoʻq, `lab.own` bor boʻlsa — «Texnik ishlari».
> Klinika rol shablonini oʻzgartirsa ham toʻgʻri ishlaydi.
>
> Frontendda qatlam qoidasi endi biome bilan tekshiriladi: `features`
> yonidagi featureni, `entities` esa featureni import qila olmaydi
> (`PatientPicker` shu sabab `entities/patient` ga koʻchdi).
- [x] **3.8 Toʻliq eksport** — «Barcha maʼlumotni yuklab olish», zip formatida

> **Arxivda maʼlumot bor, rasm yoʻq**
>
> Har boʻlim alohida `.xlsx` fayl: bemorlar (import shabloni bilan bir xil),
> tashriflar, tish xaritasi, koʻpriklar, toʻlovlar, qabullar, xarajatlar,
> naryadlar, narxnoma va `malumot.txt`. Modul oʻz jadvaliga ega emas —
> hammasi boshqa modullarning `export*Tx` funksiyalari orqali oʻqiladi.
>
> Rasmlar qoʻshilmadi: ular MinIO da va arxivni oʻn barobar kattalashtiradi.
> Kartochkadan alohida yuklab olinadi. Kerak boʻlsa keyin qoʻshiladi.
>
> `adm-zip` 0.6.0 ishlatildi (0.5.x da yuqori darajali zaiflik bor edi).
> Biz faqat arxiv yaratamiz, begona arxivni ochmaymiz.

---

## Bosqich 4 — Navbat va QR · ~2 hafta

_Alohida boʻlim. Muddat qisqarsa — birinchi qisqartiriladigan joy._

- [x] **4.1 Sxema** — `appointments` ga `queue_number`, `queue_status`;
      klinikaga 8 belgili tasodifiy kod

> **Ikki oʻq — ikki ustun**
>
> `queue_status` (tasdiqlanmagan → kutmoqda → chaqirildi → tugadi) bemor
> navbatning qayerida ekanini aytadi, `status` esa qabul nima bilan
> tugaganini (keldi/kelmadi/yakunlandi). Ikkalasini bitta ustunga tiqish
> «chaqirildi, lekin kelmadi» kabi holatlarni yoʻqotardi.
>
> `patient_id` endi boʻsh boʻla oladi: ochiq sahifadan yozilgan odam
> kartotekada boʻlmasligi mumkin, ism va telefoni `guest_name`/`guest_phone`
> da turadi va qabulxona tasdiqlaganda kartotekaga bogʻlanadi.
>
> Kod `crypto.randomInt` bilan, chalkashmaydigan alifbodan (0/O, 1/l/I yoʻq)
> — u ochiq sahifaning yagona himoyasi. Mavjud klinikalarga migratsiya
> ichida tarqatildi.
- [x] **4.2 Ochiq sahifa `/n/<kod>`** — shifokorlar, navbatdagilar soni, taxminiy vaqt,
      yozilish formasi. Loginsiz

> **Navbat alohida modul emas**
>
> Navbat — «bugungi, vaqti belgilanmagan qabul», yaʼni ayni `appointments`
> jadvali. Shuning uchun mantiq jadval egasi — `schedule` modulida, faqat
> alohida fayllarda (`queue.ts`, `queueRoutes.ts`). Alohida modul qilinsa
> u boshqa modulning jadvaliga tegishga majbur boʻlardi.
>
> **Ochiq sahifa kartotekaga tegmaydi.** Yozilgan odam `guest_name` bilan
> saqlanadi, `patient_id` boʻsh qoladi — bogʻlash qabulxonada (4.5). Shu
> sababli ochiq marshrut orqali bemorlar jadvalini ochib ham, tekshirib
> ham boʻlmaydi.
>
> **Raqam berish qulf ostida:** `pg_advisory_xact_lock` bilan. Nazorat
> testi — qulfsiz bir vaqtda kelgan 6 ta soʻrovdan atigi 2 xil raqam
> chiqdi, qulf bilan hammasi har xil.
>
> Kutish vaqti oxirgi 20 ta yakunlangan navbatning oʻrtacha oraligʻidan
> hisoblanadi; namuna kam boʻlsa 15 daqiqa deb olinadi.
- [x] **4.3 SSE jonli yangilanish** — bir tomonlama oqim, proxy orqali oʻtadi

> **Oqimda maʼlumot yurmaydi**
>
> Server faqat «shu klinikada navbat oʻzgardi» degan boʻsh hodisa yuboradi,
> sahifa esa kerakli soʻrovni oʻzi qaytadan yuboradi. Shu sababli maxfiylik
> filtrlari bitta joyda — marshrutlarda qoladi va oqimga bemor maʼlumoti
> tushib ketishi mumkin emas.
>
> Xabar **Redis pub/sub** orqali tarqaladi, jarayon ichidagi emitter bilan
> emas: SSE ulanishi bitta jarayonga bogʻlanadi, server ikkinchi nusxada
> koʻtarilsa mijozlarning yarmi yangilanishni jimgina olmay qolardi.
>
> Marshrut avval obuna boʻladi, keyin sarlavha yozadi. Boshida teskari edi —
> test notoʻgʻri kod bilan ulanish javobsiz osilib qolishini koʻrsatdi
> («Cannot write headers after they are sent»).
>
> Har 25 soniyada izohli qator (`: ping`) yuboriladi: jim turgan oqimni
> proxy uzib yuboradi.
- [x] **4.4 Kutish xonasi ekrani `/n/<kod>/ekran`** — katta shrift, faqat raqamlar, ismsiz

> **Ekran javobida ism umuman yoʻq**
>
> Marshrut chaqirilgan raqamlar (shifokor nomi bilan) va keyingi uchtasini
> qaytaradi — bemor ismi, telefoni va id si javobga kirmaydi. Test buni
> tekshiradi: javob matnida bemor ismi ham, `guestName`/`patientId`
> maydonlari ham topilmasligi kerak.
>
> Oʻlchamlar `vh` da: ekran televizorga chiqariladi va uzoqdan oʻqilishi
> kerak. Yangilanish oʻsha SSE oqimidan.
- [x] **4.5 Kabinetdagi navbat** — toʻliq roʻyxat, chaqirish / keldi / kelmadi / yakunlandi,
      `queue.manage` ruxsati

> **Tasdiqlash kartoteka bilan bogʻlaydi**
>
> Qabulxona «Tasdiqlash» ni bosganda telefon boʻyicha kartotekadan
> qidiriladi: topilsa yozuv oʻsha bemorga bogʻlanadi, topilmasa yangi
> bemor ochiladi (tz.md 14-boʻlim). Telefon `normalizePhone` bilan
> saqlanadi — boshida ochiq sahifa xom matnni yozar edi va test
> kartotekadagi `+998…` bilan mos kelmasligini koʻrsatdi.
>
> Amallar oqimi serverda: `unconfirmed → waiting → called → finished`,
> natija esa `status` da (keldi / kelmadi / yakunlandi). Bosqichni sakrab
> boʻlmaydi.
- [x] **4.6 Suiisteʼmoldan himoya** — qurilmadan kuniga 2 ta, IP dan soatiga 5 ta,
      «tasdiqlanmagan» holat, klinika navbatni butunlay oʻchira oladi.
      Bir IP dan ochiladigan SSE ulanishlari soniga ham chegara qoʻyiladi

> **Toʻrt qatlam, hech biri yolgʻiz yetarli emas**
>
> Kod taxmin qilib boʻlmaydi · IP dan soatiga 5 ta va qurilmadan kuniga
> 2 ta yozuv · yozuv «tasdiqlanmagan» holatda tushadi va navbat sanogʻiga
> kirmaydi · klinika navbatni butunlay yopa oladi.
>
> Qurilma `ed_device` cookie si bilan belgilanadi — u login emas, faqat
> hisob uchun. Cookie tozalansa aylanib oʻtiladi, shuning uchun bu yagona
> toʻsiq emas.
>
> Ochiq SSE marshrutida bitta IP dan 3 tadan koʻp oqim ochilmaydi.
> Test bir xatoni ushladi: hisob obunadan **oldin** oshirilar edi, kod
> notoʻgʻri boʻlganda esa yopilish hodisasi kelmay, oʻsha IP uchun joy
> abadiy band boʻlib qolardi.

---

## Bosqich 5 — Boshqaruv paneli va chiqarish · ~2 hafta

_Bu bosqichda birinchi marta haqiqiy server kerak boʻladi._

### Dastur

- [x] **5.1 `billing` moduli** — `expires_at` tekshiruvi, muddat tugasa faqat-oʻqish rejimi.
      Maʼlumot hech qachon oʻchirilmaydi

> **Tekshiruv bitta joyda — yozuv metodlari ustidagi ilgak**
>
> Har modulga alohida qoʻshilsa bittasi unutilardi va bu jimgina yuz
> berardi. Shuning uchun `preHandler` ilgagi: POST/PATCH/PUT/DELETE
> soʻrovlari, sessiyada klinika bor boʻlsa, `billing.assertWritable` dan
> oʻtadi.
>
> Ochiq qoladiganlar: **oʻqish** (maʼlumot koʻrinadi), **eksport**
> («maʼlumot mening qoʻlimda» kafolati), **chiqish** (yopiq kabinetdan
> chiqa olmaslik maʼnosiz) va ochiq navbat marshrutlari.
>
> Muddat har soʻrovda bazadan oʻqiladi: boshqaruv panelidan uzaytirilsa
> darhol kuchga kiradi — test buni tekshiradi. `expires_at` «shu kungacha»:
> oxirgi kunning oʻzida yozish hali ochiq.
- [x] **5.2 `apps/admin` skeleti** — kirish, platforma admini roli
      (`clinic_id` boʻsh, `patients` moduli umuman ochilmaydi)

> **Admin qatori ilovaga koʻrinmaydi — bu xususiyat, xato emas**
>
> Adminda `clinic_id` boʻsh, RLS siyosati esa `clinic_id = app_clinic_id()`
> ni talab qiladi va boʻsh ustun hech qachon mos kelmaydi. «`clinic_id IS
> NULL` boʻlsa ochiq» degan siyosat yozib boʻlmaydi: u holda admin qatorlari
> **har qanday** klinika soʻroviga koʻrinardi. Shuning uchun boshqa
> joylardagidek tor `admin_find` SECURITY DEFINER funksiyasi.
>
> Klinika marshrutlari adminga oʻzidan-oʻzi yopiq: ular ruxsat talab
> qiladi, ruxsat roldan keladi, rol esa klinikaniki. Test buni tekshiradi —
> bemorlar, navbat, hisobot va eksport hammasi 403.
>
> Admin qoʻlda yaratiladi: `npm run admin:create -w @e-dentist/api --
> pochta parol "Ism"`. Parol kamida 12 belgi.
- [x] **5.3 Klinikalar roʻyxati va kartochkasi** — muddatni uzaytirish, bloklash, tarix

> **Panel bemor maʼlumotini koʻrmaydi — bu baza kafolati**
>
> Panelga ilova ulanishini egasi huquqiga oʻtkazish oson yoʻl edi, lekin
> u holda paneldagi bitta xato butun kartotekani ochib yuborardi. Oʻrniga
> har bir soʻrov tor SECURITY DEFINER funksiya: `admin_clinics`,
> `admin_clinic`, `admin_clinic_staff`, `admin_clinic_history`,
> `admin_extend_clinic`, `admin_set_clinic_status`. Ular faqat klinika
> darajasidagi ustunlarni qaytaradi.
>
> Tarix `entity_id` va `meta` ni **qaytarmaydi**: ularda bemor yozuvining
> identifikatori boʻlishi mumkin. Test javob matnida bemor ismi yoʻqligini
> tekshiradi.
>
> Muddat uzaytirilganda `is_trial` oʻchadi (toʻlov qilindi degani) va yangi
> muddat `greatest(expires_at, current_date)` dan hisoblanadi — muddati
> oʻtgan klinikada uzaytirish oʻtmishga tushib qolmasin.
>
> Paneldagi har amal klinikaning **oʻz** audit tarixiga yoziladi: egasi
> ham koʻra oladi.
- [x] **5.4 Statistika va hodisalar**

> **Daromad hisobi qoʻshilmadi — narx modeli hali yoʻq**
>
> tz.md statistikada «oylik daromad» ni soʻraydi, lekin bir obuna qancha
> turishi hali belgilanmagan (ochiq savol 2). Shu sababli oylar kesimida
> **roʻyxatdan oʻtganlar va uzaytirishlar soni** koʻrsatiladi; narx
> belgilangach summa shu qatordan hisoblanadi. Sahifada shu yozib qoʻyilgan.
>
> Hodisalar sukut boʻyicha faqat platformaga aloqador amallarni koʻrsatadi
> (roʻyxatdan oʻtish, kirish urinishi, bloklash, muddat) — aks holda
> roʻyxat klinika ichidagi shovqinga toʻlib ketadi. «Klinika amallari
> bilan» tugmasi hammasini ochadi, lekin u yerda ham faqat vaqt, amal,
> klinika nomi va xodim pochtasi bor.
- [x] **5.5 Telegram xabarnoma** — yangi roʻyxatdan oʻtish haqida xabar

> **Xodim taklifnomasi oʻrniga parol — qaror 09/09/2026**
>
> Taklifnoma havolasi pochta orqali ketardi, SMTP esa yoʻq. Endi egasi
> «Xodim qoʻshish» oynasida ism, pochta, rol va boshlangʻich parolni
> kiritadi — hisob darhol ishlaydi. Xodim kirgach «Hisobim» boʻlimida
> parolni almashtiradi, joriy parol soʻraladi.
>
> `invites` jadvali va `invite_find` funksiyasi bazada qoldi: SMTP
> qoʻshilganda taklifnoma oqimini qaytarish oson boʻlsin.

> **Xabar hech qachon asosiy oqimni buzmaydi**
>
> Telegram yotgan boʻlsa ham roʻyxatdan oʻtish tugaydi: xabar yuborish
> `register` ning oxirida va `try/catch` ichida. Nazorat testi ataylab
> yiqiladigan xabarnoma bilan roʻyxatdan oʻtadi va 200 kutadi.
> Sozlanmagan boʻlsa (lokalda) hech narsa yuborilmaydi.
- [x] **5.5b SMTP** — lokalda xat konsolga chiqadi (`platform/mailer.ts`), serverda
      Resend orqali yuboriladi. Domen tasdiqlangan, roʻyxatdan oʻtish va
      tasdiqlash xati serverda sinaldi _(09/09/2026)_

> **SMTP hozircha ixtiyoriy — qaror 09/09/2026**
>
> Birinchi versiyada SMTP sozlanmaydi. Server usiz ham koʻtariladi, xat
> esa server logiga chiqadi: roʻyxatdan oʻtgan klinikaning tasdiqlash
> havolasini logdan olib qoʻlda yuborish mumkin
> (`docker compose logs api | grep token=`).
>
> Buning ikkita oqibati bor:
> 1. Ochiq roʻyxatdan oʻtish amalda ishlamaydi — klinikalarni siz qoʻlda
>    tasdiqlaysiz
> 2. Xodim taklifnomasi oʻrniga egasi hisobni oʻzi ochadi va parolni
>    belgilaydi (quyida)
>
> SMTP qoʻshilgach ikkalasi ham asl holiga qaytariladi — kod joyida.

### Server — Hetzner

- [x] **5.6 Serverni olish** — Hetzner Cloud, Ubuntu 24.04, 4 GB, Nürnberg (`nbg1`)
- [x] **5.7 Serverni sozlash** — `deploy/server-setup.sh`: `edentist` foydalanuvchisi,
      root va parol bilan kirish yopiq, `ufw`, `fail2ban`, Docker.
      Eslatma: shu serverda `sudo` ishlamay qoldi, shuning uchun zaxira
      taymer emas, `crontab` orqali qoʻyildi
- [x] **5.8 DNS** — Cloudflare (proxy yoqilgan): apex, `www`, `cabinet.`
      va `admin.` → server IP. NS lar ahost'dan Cloudflare'ga oʻtkazildi.
      Netlify'dan voz kechildi _(qaror 09/09/2026)_

> **Cloudflare proxy IP ni yashiradi**
>
> Proxy orqasida barcha soʻrovlar Cloudflare IP laridan kelayotgandek
> koʻrinadi. Busiz navbatdagi «bir IP dan soatiga 5 ta yozuv» cheklovi
> butun mamlakatga **bitta** boʻlib qolardi va navbat ishlamay qoʻyardi.
>
> Ikki qatlam qoʻshildi: Caddy da `trusted_proxies` (Cloudflare
> oraliqlari roʻyxati) va API da `trustProxy` — endi `true` emas, faqat
> **bevosita qoʻshni** (Caddy) ishonchli. `true` boʻlsa mijoz yuborgan
> soxta `X-Forwarded-For` bilan cheklovni aylanib oʻtish mumkin edi.
> Uchta test buni tekshiradi.
- [x] **5.9 Caddy va HTTPS** — Let's Encrypt avtomatik. Serverda sinaldi:
      `www` → apex 301, HTTP → HTTPS 308, uchala nom sertifikat oldi _(09/09/2026)_

> **SSE uchun bitta muhim sozlama**
>
> `reverse_proxy` da `flush_interval -1`: aks holda proxy oqimni buferlab
> qoʻyadi va navbatdagi «chaqirildi» xabari kech keladi. Shuningdek
> `X-Forwarded-For` uzatiladi — cheklovlar IP boʻyicha ishlaydi.
>
> Kabinet va panel bitta tasvirda: ular bitta koddan quriladi va birga
> yangilanadi. SPA marshrutlari (`/n/<kod>`) uchun `try_files … /index.html`.
- [x] **5.10 Prod `docker-compose.yml`** — lokaldan ajratilgan, portlar tashqariga ochiq emas,
      faqat Caddy orqali

> **Migratsiya alohida konteynerda**
>
> `migrate` bir marta ishlab toʻxtaydi, `api` esa
> `service_completed_successfully` bilan uni kutadi — eski kod yangi
> sxemani koʻrib qolmaydi.
>
> Postgres, Redis va MinIO portlari **umuman** chiqarilmagan: tashqi
> dunyoga ochiq yagona joy — Caddy (80/443).
>
> Tasvir lokalda sinovdan oʻtkazildi: migratsiya bajarildi, API konteyner
> tarmogʻi orqali bazaga ulandi va healthcheck yashil boʻldi. Yoʻl-yoʻlakay
> uchta narsa tuzatildi — `prisma.config.ts` konteynerda `.env` topolmay
> yiqilardi, `tsx` va `prisma` dev bogʻliqlikda edi (prod tasvirida
> boʻlmasdi), va vite qurishi uchun `tsconfig.base.json` kerak edi.

> **Qadamlar `docs/server.md` da:** birinchi koʻtarish, yangilash,
> admin yaratish va tekshirish roʻyxati.
- [x] **5.11 GitHub Actions** — test → qurish → `docker compose pull && up -d`.
      Migratsiya ishga tushishdan oldin. Orqaga qaytarish: oldingi image tegi.
      _(yoqildi va sinaldi 10/09/2026: sirlar qoʻyildi, server GHCR dan tortadi)_

> **CI haqiqiy bazada ishlaydi**
>
> Koʻp ijarachilik himoyasi RLS ga tayanadi, uni soxta baza bilan sinab
> boʻlmaydi. Shuning uchun CI lokaldagi oʻsha `docker compose` ni
> koʻtaradi — notebook va CI bir xil muhitni ishlatadi.
>
> Deploy `ci.yml` ni `workflow_call` orqali qayta ishlatadi: sinovdan
> oʻtmagan kod serverga chiqmaydi. Chiqarishdan keyin API `healthy`
> boʻlishini kutadi va boʻlmasa loglarni koʻrsatib yiqiladi.
>
> Orqaga qaytarish — «Run workflow» tugmasi va oldingi commit sha si.
> Migratsiyalar esa orqaga qaytmaydi: sxemani buzadigan oʻzgarish ikki
> bosqichda chiqariladi (docs/server.md).
- [x] **5.12 Zaxira** — kunlik `pg_dump` (30 kun), MinIO nusxasi,
      **tiklashni bir marta sinab koʻrish** — sinalmagan zaxira zaxira emas

> **Sinov avtomatik, har hafta**
>
> «Bir marta sinab koʻrish» yetarli emas: zaxira bugun ishlagani ertaga
> ham ishlashini kafolatlamaydi. Shuning uchun `backup-check.sh` haftada
> bir marta oxirgi dumpni **alohida vaqtinchalik bazaga** tiklaydi,
> klinika/xodim/bemor sonini va **RLS siyosatlari** joyidaligini
> tekshiradi, keyin oʻsha bazani oʻchiradi.
>
> RLS ni ham tekshirish muhim: siyosatlarsiz tiklangan baza koʻrinishdan
> toʻgʻri, aslida esa butun kartoteka ochiq boʻladi.
>
> Skriptlar lokal stekda sinaldi: zaxira olindi (dump + rasmlar), tiklash
> sinovi 7 klinika · 16 migratsiya · 15 siyosat topdi. Nazorat sinovi —
> boʻsh dump berilganda skript «ZAXIRA YAROQSIZ» deb 1 kod bilan
> yiqildi.
- [x] **5.13 Kuzatuv** — Uptime Kuma, Postgres loglari. Serverda sozlandi
      _(10/09/2026)_: beshta monitor (API tashqi va ichki, kabinet, panel,
      landing) va Telegram xabarnomasi. Zanjir nazorat monitori bilan
      sinaldi — qizarganda xabar keldi

> **`/api/health` yetarli emas edi**
>
> Eski manzil faqat «API javob beryapti» deb aytardi. Baza yoki Redis
> yiqilganda kuzatuv yashil turaverardi. Yangi `/api/health/ready`
> ikkalasini ham tekshiradi va yiqilganda 503 beradi — compose dagi
> healthcheck ham shunga oʻtdi.
>
> Javobda tafsilot yoʻq: manzil ochiq, qaysi qism yiqilgani faqat logda.
> Test buni tekshiradi (parol va xost nomi javobga tushmasligi).
>
> Uptime Kuma serverning oʻzida, lekin `127.0.0.1` da — internetda yana
> bitta kirish oynasi turmasin. SSH tunneli bilan ochiladi. Server
> butunlay yiqilsa Kuma ham yiqiladi, shuning uchun tashqi bepul kuzatuv
> ham tavsiya qilingan (docs/server.md).
>
> Loglar 10 MB × 3 fayl bilan chegaralandi — 40 GB diskda cheklanmagan
> log bir necha oyda hammasini yeb qoʻyardi. Postgres endi sekin
> soʻrovlarni (>500 ms), ulanish va qulflarni yozadi.
- [x] **5.14 Birinchi mijoz** — haqiqiy klinika joylashtirildi _(11/09/2026)_

---

## Bosqich 6 — Panelidan klinika ochish va logotip · ~1 hafta

- [x] **6.1 Taklifnoma oqimi (API)** — `POST /api/admin/clinics` klinika, beshta rol
      va taklifnomani bitta tranzaksiyada yaratadi; `POST /api/admin/clinics/:id/invite`
      qayta yuboradi. Kabinet tomonida `GET /api/auth/invite/:token` va
      `POST /api/auth/invite`. 12 ta test
> **Hisob taklifnoma qabul qilinganda yaratiladi**
>
> Klinika darrov paydo boʻladi, foydalanuvchi esa yoʻq: `invites` da faqat
> pochta, rol va kalit xeshi turadi. Sabab — parolsiz hisob. Agar hisobni
> darrov ochsak, unga qandaydir parol yozish kerak boʻlardi; tasodifiy
> boʻlsa ham, u bazada «kirish mumkin» degan yozuv boʻlib turadi.
>
> Shu sababli panelda klinika «Taklif yuborilgan» holatida, xodimlar soni
> nol boʻlib koʻrinadi.
>
> Uch himoya: qabul qilingan havola ikkinchi marta ishlamaydi, muddati
> oʻtgani ishlamaydi (7 kun), qayta yuborilganda eskisi **oʻchiriladi** —
> pochtada bir vaqtda ikkita amal qiluvchi havola yotmasin. Nazorat
> sinovi: «ishlatilgan» tekshiruvi olib tashlanganda test yiqildi.
>
> Band pochta oldindan tekshiriladi: aks holda klinika yaratilib, qabul
> qilish bosqichida yiqilardi va bazada egasiz klinika qolib ketardi.

- [x] **6.2 Panelda «Yangi klinika»** — nom, egasining pochtasi, sinov muddati.
      Roʻyxatda «Taklif yuborilgan» holati va «Qayta yuborish» tugmasi
- [x] **6.3 Kabinetda taklifnoma sahifasi** — `/taklif?token=…`: klinika nomi
      koʻrsatiladi, egasi ism va parolni oʻzi qoʻyadi, keyin darrov kiradi.
      Parol ikki marta soʻraladi
> **Pochta maydoni sahifada oʻzgartirilmaydi**
>
> Taklifnoma aynan bitta manzilga yozilgan va kalit oʻsha yozuvga
> bogʻlangan. Pochtani sahifada tahrirlashga ruxsat berilsa, havolaga ega
> odam istalgan manzilga hisob ochib olardi. Shuning uchun u faqat
> koʻrsatiladi.
>
> Parol ikki marta soʻraladi: bir marta yozilib xato qolsa, odam oʻz
> kabinetiga kira olmaydi va yangi havola soʻrashga majbur boʻladi.

- [x] **6.4 Klinika logotipi** — `clinics.logo_key`, yuklash klinikaning oʻzida
      (Sozlamalar → Klinika) ham, panelda ham. Koʻrinadi: kabinet yon menyusi,
      navbat sahifasi, kutish xonasi ekrani, paneldagi roʻyxat va kartochka.
      8 ta test
- [x] **6.5 Bemor rasmlari serverda koʻrinmaydi** — rasm endi
      `GET /api/images/:id/file` orqali beriladi: sessiya va klinika har
      soʻrovda tekshiriladi. `signedUrl` butunlay olib tashlandi — u
      serverda ishlamaydigan havola yasardi va xato qaytadan kirib
      qolishi mumkin edi

> **Ochiq roʻyxatdan oʻtish qoladi _(qaror 10/09/2026)_**
>
> Klinika oʻzi ham roʻyxatdan oʻta oladi, siz ham panelidan ocha olasiz.
> Ikkala yoʻl bir xil natijaga olib keladi: klinika, beshta rol, egasi va
> 14 kunlik sinov. Farqi faqat parolda — oʻzi roʻyxatdan oʻtsa darrov
> qoʻyadi, siz ochsangiz taklifnoma havolasi orqali qoʻyadi.
>
> Parol hech qachon panelda koʻrinmaydi va admin uni bilmaydi.

> **Logotip imzolangan havola bilan berilmaydi**
>
> Bemor rasmlari `signedUrl` qaytaradi va bu lokalda ishlaydi, chunki
> `S3_ENDPOINT=http://localhost:9000`. Serverda esa u `http://minio:9000`
> — Docker tarmogʻi ichidagi nom, brauzer uni topa olmaydi.
>
> Shuning uchun logotip API orqali beriladi: `GET /api/n/<kod>/logo`.
> Manzilda klinika raqami emas, navbat kodi — sahifa loginsiz ochiladi va
> klinika raqami koʻrinmasligi kerak (tz.md 14-boʻlim).
>
> Xuddi shu muammo bemor rasmlarida ham bor — 6.5 da tuzatiladi.

> **Excel ichidagi logotip — hozircha yoʻq**
>
> Eksport `write-excel-file` bilan yoziladi, u rasm qoʻya olmaydi. Logotip
> uchun `exceljs` ga oʻtish kerak: bemorlar eksporti, xatolar fayli, shablon
> va toʻliq zip — hammasi qayta yoziladi. Foydasi kichik, narxi katta,
> shuning uchun kutadi. Ekrandagi hisobot sarlavhasiga qoʻyish mumkin.

---

## Bosqich 7 — Kabinet dizayni · ~3 kun

Panel bilan bitta tizim: neytral slate palitra, Inter, `0.625rem`, lucide
ikonkalar. Farqi — asosiy rang logotipdagi koʻk _(qaror 12/09/2026)_.

- [x] **7.1 Tokenlar va qobiq** — palitra, shrift, radius; och va yigʻiladigan yon
      menyu (klinika logotipi bilan), tepa panel; emoji oʻrniga lucide — menyuda
      ham, boʻsh holatlarda ham
- [x] **7.2 Sahifalar** — 18 sahifa koʻrib chiqildi. Sozlamalar va bemor
      kartochkasi yon menyuli tartibda (har boʻlim oʻz manzilida); data-table
      (TanStack Table): Bemorlar, Xarajatlar, Texnik ishlari, Qarzdorlar,
      Xizmatlar, Tashriflar, Toʻlovlar — qator bosilsa kartochka ochiladi;
      sana maydonlari kalendardan; Bosh sahifa haqiqiy koʻrinish (bugungi
      qabullar, bemorlar, tushum, qarzdorlik); Hisobotlar recharts bilan;
      kirish sahifalari logotip bilan; sinov banneri tepa panelda
- [x] **7.3 Maxsus qismlar** — kalendar kataklari va roʻyxatdan holat
      almashtirish; navbat taxtasi holat ustunlari bilan; tish xaritasi ikki
      rejimda tekshirildi — tibbiy ranglar oʻzgarmadi, tegilmadi

- [x] **7.4 Tema** — kabinetda yorugʻ/tungi rejim tugmasi (panelda bor edi), tanlov
      brauzerda saqlanadi
- [x] **7.5 Tillar — tuzilma** — matnlar `locales/uz.ts` ga koʻchdi, `ru.ts` boʻsh
      shablon, `strings.ts` jonli eksportlar beradi. Til tanlash kabinet va panel
      tepasida. 6 ta test. Import vaqtida muzlab qoladigan joylar tuzatildi:
      navigatsiya konfiguratsiyalari funksiya boʻldi, zod xato matnlari `{ error: () => … }`
- [x] **7.6 Server tili** — `Accept-Language` ga qarab xato matnlari, xat va
      Excel sarlavhalari. Til AsyncLocalStorage da (parallel soʻrovlar
      aralashmaydi), shared unga resolver orqali qaraydi. Server zod
      sxemalari `{ error: () => … }` ga oʻtdi (61 joy). Kabinet va panel
      sarlavhani ilova tilidan qoʻyadi. Import ruscha shablon sarlavhalarini
      ham taniydi. 7 + 4 test
- [x] **7.7 Ruscha tarjima** — `ru.ts` toʻliq: 62 toʻplam. Ruscha koʻplik
      (`plural`: 1 пациент · 2 пациента · 5 пациентов). Test: uz.ts dagi har
      kalit ru.ts da ham bor — yangi matn ikkala tilga birga qoʻshiladi. Rol
      nomlari bazadagi emas, shablon boʻyicha joriy tilda (`roleLabel`).
      Ochiq navbat sahifasida til tugmasi

> **Nega Proxy, nega `t('kalit')` emas** _(qaror 14/09/2026)_
>
> 80 ta fayl `AUTH_TEXT.login` koʻrinishida import qiladi. i18n kutubxonasi
> hammasini `t('auth.login')` ga oʻzgartirishni talab qilardi va kalitlar
> tip tekshiruvidan chiqib ketardi. Jonli eksport shu importlarni saqlab
> qoladi: `AUTH_TEXT` — Proxy, har oʻqish joriy tilga boradi.
>
> Narxi: import vaqtida oʻqilgan qiymat muzlab qoladi. Shunday joylar
> topilib tuzatildi (navigatsiya, zod). Yangi kod yozganda qoida —
> matn funksiya ichida oʻqilsin.
>
> Til almashganda butun daraxt `key={locale}` bilan qayta yaratiladi —
> forma holati yoʻqoladi, lekin til bir umrda bir marta almashadi.

> **Ommaviy sahifalar tegilmaydi**
>
> Navbat sahifasi va kutish xonasi ekrani bemorlar uchun: klinika logotipi,
> katta raqamlar, qorongʻi fon. Ular kabinet dizayni emas, klinika brendi.

---

## Bosqich 8 — Fayl ombori: MinIO → Garage · ~2 kun

> **Nega** _(qaror 14/09/2026)_
>
> MinIO jamoat nashri amalda toʻxtadi: 2025-yil may nashridan boshlab
> konsol olib tashlandi, keyin Docker Hub dagi `minio/minio` va `minio/mc`
> rasmlari oʻchirildi (14/09/2026 da CI shundan yiqildi), yangi nashrlar
> chiqmayapti — kompaniya pullik AIStor ga oʻtdi. Biz quay.io dagi
> RELEASE.2025-09-07 ga qotirib turibmiz. Bu vaqtinchalik chora: zaiflik
> topilsa tuzatish kelmaydi, quay.io dagi rasm ham bir kun yoʻqolishi
> mumkin. Omborda bemorlarning rentgen rasmlari — tibbiy maʼlumot.
>
> **Garage** (Deuxfleurs): ochiq kodli (AGPL), S3-mos, aynan bitta-ikkita
> serverli oʻz-oʻzini hosting uchun yaratilgan, bitta yengil binar
> (Rust, ~50 MB xotira), faol rivojlanadi, Docker Hub da muntazam
> nashrlar. Bizga kerak boʻlgan hamma narsa bor: PutObject, GetObject,
> DeleteObject, HeadBucket/CreateBucket, path-style manzil. Imzolangan
> havolalar ishlatilmaydi (6.5 dan beri rasm API orqali beriladi) —
> koʻchish faqat `S3_ENDPOINT` va kalitlarni almashtirish.
>
> Koʻrilgan boshqa yoʻllar: SeaweedFS — katta klasterlar uchun, bizga
> ortiqcha; RustFS — juda yangi, tarixi yoʻq; oddiy fayl tizimi — S3
> qatlamini yoʻqotadi, keyin Oʻzbekistondagi bulut omboriga koʻchish
> qiyinlashadi («koʻchma joylashtirish» talabi, CLAUDE.md).

- [x] **8.1 Lokalda Garage** — `docker-compose.yml` da `garage` (dxflrs/garage
      v2.4.1, teg qotirilgan) + `garage-init` bir martalik konteyner
      (`docker/garage/`): rasmiy rasmda shell yoʻq, shuning uchun binar alpine ga
      koʻchirilgan; `init.sh` idempotent — rol, `.env` dagi kalitni import,
      bucket, ruxsatlar, `--create-bucket` (testlar oʻz bucketini S3 orqali
      yaratadi). `S3_REGION` sozlamasi (Garage imzo regionini tekshiradi).
      Lokal MinIO dagi 21 obyekt `mc mirror` bilan koʻchirildi — 8.3 mashqi.
      496 test Garage bilan oʻtdi
- [x] **8.2 CI** — GitHub Actions Garage bilan (`GARAGE_RPC_SECRET`, GK kalitlar)
- [x] **8.3 Serverga koʻchirish** — ikki bosqichli: Garage MinIO yonida
      (`garage-init` rasmi GHCR dan), `deploy/garage-migrate.sh` (`mc mirror` +
      obyektlar soni), `deploy/garage-switch.sh` (`.env` → Garage, `api` qayta
      ishga tushadi, ~20 s). API Garage da 14/09/2026. Keyingi push MinIO ni
      olib tashladi; volume bir hafta turadi (docs/server.md)
- [x] **8.4 Zaxira va kuzatuv** — `backup.sh` Garage dan (`mc` istalgan S3 bilan
      ishlaydi); Kuma monitori `http://garage:3903/health` — qoʻlda qoʻshiladi
- [x] **8.5 Hujjatlar** — tz.md, CLAUDE.md, server.md, birinchi-chiqarish.md,
      make-env.sh (yangi server Garage bilan), .env.example

---

## Bosqich 9 — Ish haqi: foiz va oylik · ~1 hafta

> **Nega** _(qaror 15/09/2026, tz.md 15-boʻlim)_
>
> Klinikada shifokor foizga ishlaydi (plomba 300 000 → 150 000 klinikaga,
> 150 000 shifokorga), administrator oylikka. Tizimda buning oʻrni yoʻq edi:
> `visits` da shifokor yoʻq, xodimda shart yoʻq, hisobotda maosh koʻrinmaydi.
>
> Qarorlar: foiz **qilingan ish narxidan** (toʻlangan puldan emas — toʻlov
> tashrifga bogʻlanmagan); xodimga **bitta foiz** (xizmat boʻyicha emas);
> shifokor **oʻz** ulushini koʻradi; toʻlab berish **tugma bilan** xarajatga
> tushadi (qoʻlda yozilsa hisob va xarajat ajralib ketadi).

- [x] **9.1 `visits.doctor_id`** — ustun + indeks; API: `doctorId` ixtiyoriy,
      berilmasa yozgan odam (`visits.write` bilan kirgan — demak shifokor);
      faqat faol va `visits.write` li xodim; `GET /staff/doctors`; tashrif
      formasida «Shifokor» tanlovi (sukut — oʻzi); jadvalda ustun; eksportda
      ustun. Eski yozuvlar `null`. Testlar: sukut, begona klinika xodimi rad
- [x] **9.2 Xodimda ish haqi sharti** — `users.salary_amount`, `users.pay_percent`
      (CHECK 0..100); `PATCH /staff/:id` da ikkalasi (oʻzinikini ham
      oʻzgartira oladi — rol/holat cheklovi bunga tegmaydi); Sozlamalar →
      Xodimlar da «Ish haqi» ustuni va tahrirlash oynasi; yangi xodim
      oynasida ham
- [x] **9.3 Ulush snapshoti** — `visits.doctor_percent`, `visits.doctor_share`;
      yozishda shifokorning joriy foizi, narx tahririda saqlangan foiz bilan
      qayta hisob, shifokor almashsa yangi foiz. Testlar: yaxlitlash, tahrir

> **Yoʻl-yoʻlakay topilgan xato**
>
> `visitUpdateSchema = createSchema.partial()` edi, lekin `.partial()`
> `price` dagi `.default(0)` ni olib tashlamaydi — narxsiz `PATCH` narxni
> 0 ga tushirardi. Forma doim hamma maydonni yuborgani uchun koʻrinmagan.
> Endi narx yangilash sxemasida sukutsiz; test bor.
- [x] **9.4 `payroll` moduli va «Ish haqi» sahifasi** — `payroll.own` /
      `payroll.manage` ruxsatlari (mavjud rollarga migratsiya: egasi ikkalasi,
      shifokor shabloni `own`); `GET /payroll?month` — xodim boʻyicha
      tashriflar, ish summasi, ulush, oylik, jami; «Shifokor koʻrsatilmagan»
      qatori; `GET /payroll/visits?month&userId` — shifokorning oʻsha oydagi
      ishlari roʻyxati (sana · bemor · muolaja · narx · ulush) — qator
      ochilganda koʻrinadi, shifokor oʻzinikini koʻradi; `POST
      /payroll/recalculate`; sahifa oy almashtirgich bilan; yon menyuda
      «Ish haqi». Testlar: koʻp ijarachilik, `own` faqat oʻzini
- [x] **9.5 Toʻlab berish** — `staff_payouts` (user_id, month, expense_id,
      RLS) — summa va sana xarajatda; `POST /payroll/payouts` →
      `expenses.addTx(salary)` + bogʻlanish bir tranzaksiyada;
      `DELETE /payroll/payouts/:id` → xarajat ham oʻchadi; sahifada
      «toʻlangan / qoldiq» ustunlari va «Toʻlash» oynasi (toʻlovlar roʻyxati,
      qoʻshish, oʻchirish). Testlar: xarajat oʻchsa bogʻlanish ketadi
- [x] **9.5a Eksport va tuzatishlar** — arxivga `ish-haqi.xlsx` (oy × xodim);
      oylik hisob ochilgan oydan; yuklab olish xatosi: server
      `filename="…"` yuborar, kabinet faqat `filename*=` ni oʻqirdi — zip
      `export.xlsx` nomi bilan saqlanib Excel ochmasdi. Endi `attachment()`
      yordamchisi `platform/response.ts` da, kabinet ikkala shaklni oʻqiydi
- [x] **9.5b Kartochkada ruxsatga qarab boʻlimlar** — «Toʻlovlar» boʻlimi
      faqat `payments.read` bilan (shifokor koʻrmaydi); «Toʻlov qabul qilish»
      va qator amallari — `payments.write`; tashrif qoʻshish/tahrir —
      `visits.write`. Avval hammaga koʻrinar, server 403 berardi
- [x] **9.5c Ruxsatlar auditi (kabinet)** — server marshrutlari ↔ kabinet
      tugmalari solishtirildi. Topilgan va tuzatilgani:
      · marshrut darajasida himoya yoʻq edi — `/expenses`, `/services`,
        `/settings/xodimlar` … ni manzil yozib ochish mumkin edi (server 403,
        sahifa boʻsh). Endi `RequirePermission` — ruxsatsiz bosh sahifaga
      · Sozlamalar butunlay `staff.manage` ostida edi — shifokor/qabulxona/
        texnik **oʻz parolini almashtira olmasdi** (tz.md 6-boʻlim buzilgan).
        Endi Sozlamalar hammaga, ichida faqat ruxsatli boʻlimlar; foydalanuvchi
        menyusida ham «Hisobim»
      · Bemorlar: shablon/import/yangi bemor/tahrir/oʻchirish — `patients.write`
        (kuzatuvchi koʻrardi); kartochkada «Tahrirlash» ham
      · Tish xaritasi: koʻprik qoʻshish/oʻchirish, tishni bosib tahrirlash —
        `teeth.write`
      · Rasmlar: yuklash/oʻchirish — `patients.write`
      · Bosh sahifa: bugungi qabullar `schedule.write` **va** `patients.read`
        (server GET /appointments `patients.read` talab qiladi)
      Toʻgʻri boʻlgani: Texnik ishlari (lab.write/lab.cost/lab.own toʻliq
      ajratilgan), Xarajatlar, Narxnoma, Hisobotlar, Navbat, Qarzdorlar — sahifa
      ruxsati bilan amal ruxsati bir xil
- [x] **9.6 Hujjatlar va chiqarish** — tz.md/CLAUDE.md yangilandi;
      16/09/2026 `master` ga qoʻshildi → avtomatik chiqarish; 5 ta migratsiya
      (tashrif shifokori, ish haqi sharti, shifokor ulushi, ish haqi
      ruxsatlari, ish haqi toʻlovlari) `migrate` konteynerida oʻzi oʻtadi,
      hammasi orqaga mos
- [x] **9.7 Toast bildirishlar** _(foydalanuvchi taklifi, 16/09/2026)_ —
      `<Toaster />` ulangan, lekin 35 mutatsiyaning birortasi ishlatmasdi.
      Markazlashtirildi: `QueryClient` ning `MutationCache` da bitta joy —
      muvaffaqiyat matnini mutatsiya `meta.success` (funksiya — joriy tilda)
      beradi, xato avtomatik. Maydon xatolari (formada koʻrinadi) va
      `meta.inlineErrors` li formalar toast bermaydi — bir xato ikki joyda
      chiqmasin. Matnlar `TOAST_TEXT` (uz/ru). Inline «saqlandi» yozuvlari
      (rol, parol, qayta hisoblash) toastga koʻchdi. Navbat amallari
      muvaffaqiyatda jim (roʻyxat oʻzi oʻzgaradi), xatoda toast.
      Matn **aniq amalga** mos (foydalanuvchi eslatmasi): qoʻshish ≠ tahrirlash
      («Tashrif qoʻshildi» / «Tashrif tahrirlandi»); bitta soʻrov bir necha
      amalga xizmat qilsa argumentlardan tanlanadi — xodim holati
      («faolsizlantirildi» / «faollashtirildi»), roli, ish haqi sharti;
      qabul va naryad holatlari («Bemor keldi deb belgilandi», «Naryad
      topshirildi»); navbat yoqildi/oʻchirildi
- [x] **9.8 Yuklanish splashi** _(foydalanuvchi taklifi, 17/09/2026)_ —
      koʻk tish (Tabler `dental`, inline SVG — lucide da tish yoʻq) suzadi,
      ostida soyasi, nom, uch nuqta. Uch tur variantdan (12 ta koʻrinish)
      tanlandi.

> **Splash `index.html` da, React da emas**
>
> Birinchi urinish React komponenti edi — JS yuklanguncha oq ekran qolardi
> (foydalanuvchi my.adliya.uz ni misol keltirdi: u yerda yuklanish darhol
> koʻrinadi). Endi belgi va CSS `index.html` ning oʻzida: HTML kelishi bilan
> koʻrinadi. `shared/ui/splash.tsx` faqat boshqaradi — `<Splash/>` chizilib
> turgan ekan ekran ochiq (sessiya kutilmoqda), App birinchi chizilgach
> hech kim ushlamagan boʻlsa yopiladi. Belgi ikki joyda takrorlanmaydi,
> almashinuvda animatsiya sakramaydi. Yoʻl-yoʻlakay: tema klassi ham
> inline skriptda birinchi boʻyoqdan oldin — qorongʻi rejimda oq
> miltillash yoʻqoldi.
>
> Nom «e-dentist» — Inter 900, kichik harflar, qiya (payme belgisi uslubi,
> foydalanuvchi tanlovi). SVG matn: har harf ketma-ket koʻk kontur bilan
> chiziladi (bitta uzluksiz chiziq — dash uzunligi harf konturidan katta),
> keyin toʻladi; jami ~2 s. Ilova tayyor boʻlishi bilan yopiladi —
> animatsiya tugashini kutmaydi (foydalanuvchi qarori: «kutish shart
> emas»). `prefers-reduced-motion` da hammasi darhol, harakatsiz

---

## Bosqich 10 — Bemor → shifokor → navbat/qabul · ~3 kun

> **Nega** _(qaror 17/09/2026)_
>
> Qabulxona bemorni yaratganda uni shifokorga yoʻnaltiradi — lekin tizimda
> bemorda shifokor yoʻq edi, qabul formasi shifokorni soʻramas edi (bazada
> `doctor_id` bor, ishlatilmagan), navbatga faqat QR sahifadan yozilardi —
> kabinetdan qoʻshib boʻlmasdi. Mavjud bemor kelganda «kimning bemori»
> koʻrinmasdi.
>
> Qarorlar: shifokor bemorga **biriktiriladi** (`patients.doctor_id`,
> kartochkada oʻzgartirish mumkin); tashrif va qabulda shu **sukut**, lekin
> har safar boshqasini tanlash mumkin (shifokor taʼtilda). Yangi bemor
> oynasida «Bugun navbatga qoʻshish» belgisi — qabulxona uchun sukut
> **yoqilgan** (bemor odatda oldida turadi); mavjud bemorga alohida amal.

- [x] **10.1 Bemorga shifokor** — `patients.doctor_id` (ixtiyoriy, faol
      `visits.write` li xodim); bemor oynasida «Shifokor» tanlovi; roʻyxatda
      ustun va filtr; kartochka sarlavhasida ism; API javobida `doctorName`.
      Testlar: begona klinika xodimi rad, koʻp ijarachilik
- [x] **10.2 Qabulda shifokor** — `POST/PATCH /appointments` da `doctorId`
      (sukut — bemorning shifokori); formada tanlov; kunlik roʻyxatda ism;
      shifokor boʻyicha filtr; bosh sahifadagi bugungi qabullarda ism
- [x] **10.3 Kabinetdan navbatga qoʻshish** — `POST /queue` (`queue.manage`):
      bemor + shifokor → bugungi navbat, tasdiqlangan holatda (qabulxona
      oʻzi qoʻshdi); yangi bemor oynasida «Bugun navbatga qoʻshish» belgisi;
      bemorlar roʻyxati va kartochkada «Navbatga qoʻshish» amali; SSE
      orqali ekran yangilanadi. Testlar: navbat yopiq boʻlsa rad, ikki marta
      qoʻshib boʻlmaydi
- [x] **10.4 Tashrifda sukut shifokor** — bemorning shifokori, boʻlmasa
      yozayotgan odam
- [x] **10.5 Hujjatlar va chiqarish** — tz.md (5, 14-boʻlim), CLAUDE.md; 17/09/2026 `master` ga
- [x] **10.6 Yakunlash = tashrif** — «Yakunlandi» jadvalda ham, navbat
      taxtasida ham tashrif formasini ochadi (sana va shifokor qabuldan);
      `POST /appointments/:id/complete` bitta tranzaksiyada tashrif + `done`
      + navbat `finished`; `PATCH {status: done}` va navbatdagi `done` amali
      rad etiladi. Testlar: ulush snapshot, ikkinchi marta yakunlab
      boʻlmaydi, yaroqsiz shifokorda hech narsa yozilmaydi, kelajakdagi
      qabul → bugungi tashrif, begona klinika
- [x] **10.7 Shifokor faqat oʻz jadvalini koʻradi** — yangi ruxsat
      `schedule.all` (egasi, qabulxona; mavjud rollarga migratsiya). Usiz
      roʻyxat, bosh sahifa faqat oʻz qabullari; yangi qabul oʻziga; boshqaning
      qabuli «topilmadi»; kabinetda shifokor filtri va formadagi tanlov
      yashiriladi. Testlar: roʻyxat, filtr eʼtiborsiz, POST oʻziga, PATCH/
      complete/DELETE 404, ruxsat berilsa hammasi
- [x] **10.8 Eshik uchun QR** — Sozlamalar → Navbat da QR koʻrinishi
      (`qrcode.react`, brauzerda), «Chop etish — A4 varaq»: yon menyusiz
      sahifa `/navbat-varaq` (klinika nomi, logotip, katta QR, yoʻriqnoma,
      manzil), `@page A4`; navbat yopiq boʻlsa ogohlantirish
- [x] **10.9 Landing (e-dentist.uz)** — oflayn ilova sahifasi onlayn versiya
      uchun qayta yozildi (`apps/landing/`, serverda Caddy tarqatadi): CTA →
      `cabinet…/register`, boʻlimlar: imkoniyatlar, QR navbat, jamoa,
      xavfsizlik, narx (raqamsiz — Telegram), savollar. Skrinshotlar demo
      maʼlumot bilan — `scripts/landing/` (seed + Playwright). 18/09/2026
- [x] **10.10 Landing SEO** — title/description kalit soʻzlar bilan, H1,
      canonical + hreflang, Open Graph/Twitter (`img/og.png` 1200×630),
      JSON-LD (Organization, WebSite, SoftwareApplication, FAQPage),
      `robots.txt`, `sitemap.xml`, shrift preload; kabinet va panel
      `X-Robots-Tag: noindex`
- [x] **10.11 Ruscha landing `/ru/`** — toʻliq tarjima, ruscha interfeys
      skrinshotlari (`img/ru/`), `og-ru.png`, `hreflang` juftligi ikkala
      sahifada va sitemap da, JSON-LD (FAQPage ru), sarlavhada UZ ↔ RU
      almashtirgich; `app.js` tish nomlarini `<html lang>` dan oladi

---

## Bosqich 11 — Shifokorning oʻz bemorlari, toʻlovlar oʻzgarmas · ~1 kun

> **Nega** _(qaror 19/09/2026)_
>
> Shifokor boshqa shifokorning bemorini, muolajasini va narxini koʻrardi.
> Toʻlov oʻchirilishi mumkin edi — pul yozuvi izsiz yoʻqolardi. Kichik
> klinikada pulni shifokorning oʻzi oladi — shablonda toʻlov yopiq edi.

- [x] **11.1 Toʻlov bekor qilinadi, oʻchirilmaydi** — `POST /payments/:id/cancel`
      sabab bilan (`cancelled_at/by`, `cancel_reason`), `created_by`; bekor
      qilingani hisob, qarzdorlar, hisobotga kirmaydi, roʻyxatda chizilgan
      holda; PATCH faqat izoh, DELETE yoʻq. Eksportda «Qabul qildi», «Holat»,
      «Bekor sababi». Testlar: sabab majburiy, ikki marta bekor 409, summa
      oʻzgarmas
- [x] **11.2 Shifokor toʻlov qabul qiladi** — shablonga `payments.read/write`,
      mavjud rollarga migratsiya
- [x] **11.3 Shifokor faqat oʻz bemorlarini koʻradi** — `patients.all` (egasi,
      qabulxona, kuzatuvchi; migratsiya). Usiz: biriktirilgan / davolagan /
      qabulga yozilgan / biriktirilmagan; kartochkada oʻz tashriflari va oʻz
      rasmlari (`images.uploaded_by`), tish xaritasi umumiy; tashrif oʻz
      nomidan; boshqaning tashrifi, rasmi, bemori — 404; qarzdorlar ham
      shu doirada. Kabinetda tashrif formasida shifokor tanlovi va roʻyxatda
      shifokor filtri yashiriladi. Testlar: `visibility.test.ts` (12)

---

## Ochiq savollar

Kod yozishga halaqit bermaydi, lekin bosqich 5 gacha javob kerak:

1. **Obuna narxi qancha?** — `billing` modulining tuzilishiga taʼsir qiladi (5.1)
2. **Xodimlar soni tarifga bogʻlanadimi?** — bogʻlansa, xodim qoʻshishda chegara
   tekshiriladi (3.3 va 5.1)
3. **Maʼlumot Oʻzbekistonda turishi shartmi?** — yuridik tekshiruv toʻlov integratsiyasi
   bosqichiga qoldirilgan. Shu sabab joylashtirish koʻchma quriladi: Hetzner ga
   bogʻlanmaymiz, hammasi Docker Compose da
