`Ish rejasi · 1-tahrir`

# Ish rejasi

> Bu fayl — **holatning yagona manbai**. Qaysi task tayyor, qaysi biri navbatda —
> shu yerdan koʻriladi. Ish tartibi: [`ish-tartibi.md`](ish-tartibi.md).
> Nima qurilishi: [`tz.md`](tz.md).

**Belgilar:** `[ ]` boshlanmagan · `[~]` jarayonda · `[x]` tayyor

**Hozirgi task: 1.5**

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

- [ ] **1.5 Prisma sxema, 1-qism** — `clinics`, `users`, `roles`, `invites`, `audit_log`.
      Pul — `Int`, sanalar — `DATE`
      → `npx prisma validate` oʻtadi
- [ ] **1.6 Birinchi migratsiya va seed** — 5 rol shabloni (Egasi, Shifokor, Qabulxona,
      Texnik, Kuzatuvchi) va 16+3 ruxsat roʻyxati
      → bazada jadvallar bor, seed shablonlarni yozadi
- [ ] **1.7 Repozitoriya qatlami** — Prisma kengaytmasi har soʻrovga `clinicId` ni
      **avtomatik** qoʻshadi. Qoʻlda yozish imkoniyati yopiladi
      → `clinicId` siz soʻrov yozib boʻlmaydi (kompilyator yoki runtime rad etadi)
- [ ] **1.8 Postgres RLS** — har ijarachi jadvali uchun siyosat, `app.clinic_id`
      sessiya oʻzgaruvchisiga bogʻlanadi
      → toʻgʻridan-toʻgʻri SQL da ham begona qator qaytmaydi
- [ ] **1.9 Koʻp ijarachilik testi** — ikkita klinika yaratiladi, A ning sessiyasi bilan
      B ning yozuvi soʻraladi
      → test yashil: boʻsh natija yoki `not_found`. Bu test har yangi modulda takrorlanadi

### auth moduli

- [ ] **1.10 Roʻyxatdan oʻtish** — `POST /api/auth/register`: klinika + egasi yaratiladi,
      `is_trial = true`, `expires_at = +14 kun`, 5 rol shabloni nusxalanadi
      → yangi klinika bazada, egasi `is_owner` roli bilan
- [ ] **1.11 Pochtani tasdiqlash** — `POST /api/auth/verify`. Lokalda xat konsolga
      chiqadi (SMTP hali kerak emas)
      → tasdiqlanmagan hisob kira olmaydi
- [ ] **1.12 Kirish, chiqish, me** — `argon2id` parol, Redis sessiya,
      `httpOnly` + `sameSite=lax` cookie
      → `GET /api/me` foydalanuvchi va ruxsatlarini qaytaradi
- [ ] **1.13 Ruxsat tekshiruvi** — `requirePermission('patients.read')` koʻrinishidagi guard.
      Egasi `staff.manage` va `billing.manage` ni yoʻqota olmaydi
      → ruxsatsiz soʻrov `403` va oʻzbekcha xato beradi
- [ ] **1.14 Cheklovlar** — kirish urinishlari (IP va hisob boʻyicha),
      roʻyxatdan oʻtish bitta IP dan kuniga 3 ta, bir martalik pochta rad etiladi
      → 6-urinishdan keyin vaqtincha bloklanadi
- [ ] **1.15 `audit_log`** — kirish, roʻyxatdan oʻtish, xodim oʻzgarishi yoziladi
      → jadvalda yozuvlar koʻrinadi

### Kabinet skeleti

- [ ] **1.16 `apps/cabinet` skeleti** — Vite + React 18 + router, oflayn loyihadan
      `styles.css` dizayn tokenlari koʻchiriladi
      → `npm run dev` boʻsh sahifani ochadi, indigo palitra joyida
- [ ] **1.17 Kirish va roʻyxatdan oʻtish sahifalari** — forma tekshiruvi,
      xato matnlari `strings.ts` dan
      → brauzerdan roʻyxatdan oʻtib, kirib boʻladi
- [ ] **1.18 Boʻsh kabinet** — yon menyu, «Chiqish», rolga qarab boʻlimlar koʻrinadi/yashiriladi,
      sinov muddati banneri
      → kirgandan keyin kabinet ochiladi, ruxsatsiz boʻlim menyuda yoʻq

**Bosqich natijasi:** roʻyxatdan oʻtish → pochta tasdiqlash → kirish → boʻsh kabinet.
Koʻp ijarachilik testi yashil.

---

## Bosqich 2 — Asosiy ish oqimi · ~3 hafta

_Mahsulotning yuragi. Oxirida klinika haqiqatan ishlata boshlashi mumkin._

- [ ] **2.1 Prisma sxema, 2-qism** — `patients`, `visits`, `teeth`, `bridges`,
      `payments`, `appointments`, `services`, `images`. RLS siyosatlari ham darhol
- [ ] **2.2 `patients` moduli** — CRUD, qidiruv (F.I.O. va telefon boʻyicha), sahifalash,
      + koʻp ijarachilik testi
- [ ] **2.3 Bemorlar sahifasi** — roʻyxat, qidiruv, ustun filtrlari, yangi bemor formasi
- [ ] **2.4 `packages/teeth`** — `lib/teeth.js` TypeScript ga oʻtkaziladi
      (FDI, sut tishlari, `archLayout`, `bridgeSpan`, materiallar)
- [ ] **2.5 `ToothChart` komponenti** — oflayn loyihadan koʻchiriladi,
      maʼlumot manbai HTTP ga almashtiriladi
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
