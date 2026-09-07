`Texnik topshiriq · 1-tahrir`

# E-Dentist Bulut

> Bu hujjat — loyihaning **asosiy nusxasi**. Oʻzgarishlar shu faylga kiritiladi va git
> tarixida qoladi. Artefakt koʻrinishi (koʻrish uchun qulay) bilan farq chiqsa, shu fayl
> haqiqiy hisoblanadi.

_Stomatologiya klinikalari uchun brauzerda ishlaydigan obunali xizmat. Mavjud oflayn ilovalarni almashtirmaydi — ular oʻz yoʻlida davom etadi. Bu alohida repozitoriya, alohida mahsulot._

- **Arxitektura:** Modulli monolit
- **Kirish:** Oʻzi roʻyxatdan oʻtadi
- **Sinov:** 14 kun
- **Toʻlov:** Qoʻlda, Telegram orqali
- **Server:** Hetzner (Yevropa) — joylashtirish koʻchma
- **Rollar:** Klinika oʻzi boshqaradi
- **Jamoa:** 1 dasturchi

## 1. Maqsad va qamrov

_Nima quriladi, nima qurilmaydi. Qamrovni boshida qatʼiy belgilash — loyihaning choʻzilib ketmasligining yagona kafolati._

### Muammo

Hozirgi oflayn ilovalar Google Play va App Store'ga chiqarilishi uchun yillik toʻlovli dasturchi hisoblari kerak. Brauzerda ishlaydigan versiya bu toʻsiqni butunlay chetlab oʻtadi: mijoz havolani ochadi va ishlaydi — hech narsa oʻrnatmaydi.

### Kim foydalanadi

Klinika **oʻzini oʻzi boshqaradi**: egasi xodim qoʻshadi, oʻchiradi va huquqini oʻzgartiradi — sizsiz. Quyidagilar tayyor shablonlar, ularning ruxsatlarini klinika oʻzgartira oladi (batafsil 6-boʻlim).

| Rol | Kim | Nima qiladi |
|---|---|---|
| **Egasi** | Klinika rahbari | Hammasi + xodimlar va obuna. Bu rol hech qachon oʻchirilmaydi |
| **Shifokor** | Stomatolog | Bemorlar, tashriflar, tish xaritasi, qabullar |
| **Qabulxona** | Administrator | Bemorlar, qabullar, toʻlovlar |
| **Texnik** | Protez ustasi | Faqat oʻziga biriktirilgan naryadlar. Bemorning puliga aloqasi yoʻq |
| **Kuzatuvchi** | Buxgalter, stajyor | Faqat oʻqiydi, hech narsa oʻzgartirmaydi |
| **Platforma admini** | Siz | Klinikalar va obunalar. Bemor maʼlumotini **koʻrmaydi** |

### 1-versiyaga kiradi

- Oʻzi roʻyxatdan oʻtish va 14 kunlik bepul sinov
- Bemorlar kartotekasi: qidiruv, filtr, kartochka, rasmlar
- Bemorlarni **Excel yoki CSV dan yuklash** va roʻyxatni Excelga chiqarish
- Tashriflar va muolajalar tarixi
- Tish xaritasi (odontogramma) — mavjud `lib/teeth.js` dan koʻchiriladi
- Qabul jadvali
- Toʻlovlar va qarzdorlik
- Narxnoma
- Xarajatlar va oylik hisobot
- Xodimlar, rollar va ruxsatlar — klinikaning oʻzi boshqaradi
- Texnik ishlari: naryadlar, texnik roli, xarajatga bogʻlanishi
- QR orqali navbat: ochiq sahifa, kutish xonasi ekrani, jonli yangilanish
- Boshqaruv paneli: klinikalar, obunalar, toʻlov tarixi

### 1-versiyaga kirmaydi

- Oflayn ilovalar bilan sinxronizatsiya — ular alohida mahsulot boʻlib qoladi
- Kompyuterdagi zaxira zipni import qilish — bulut yangi mijozlar uchun
- Bir klinika ichida bir nechta filial
- Avtomatik toʻlov (Payme/Click) — 2-bosqichda
- SMS eslatmalar va bemor kabineti
- Mobil ilova — brauzer moslashuvchan boʻladi, alohida ilova emas

> **Qaror**
>
> Oflayn ilovalar va bulut — **ikki alohida mahsulot**. Ular orasida maʼlumot koʻchmaydi: bulut yangi mijozlar uchun, mavjud mijozlar oflayn ilovada qoladi.
>
> Buning narxi bor: kelajakda oflayn mijoz «men ham vebga oʻtaman» desa, unga yoʻl yoʻq — maʼlumotni qoʻlda kiritishga toʻgʻri keladi. Zip formati va uni oʻqiydigan kod allaqachon mavjud, shuning uchun import keyin qoʻshilsa ham arzon boʻladi.

## 2. Arxitektura qarori

_Nega modulli monolit, va bu amalda nimani anglatadi._

Backend — **bitta ishga tushiriladigan ilova**, lekin ichida qatʼiy ajratilgan modullar. Har modulning oʻz papkasi, oʻz servis qatlami va oʻz jadvallari bor; modullar bir-birining bazasiga toʻgʻridan-toʻgʻri murojaat qilmaydi, faqat eksport qilingan servis funksiyalari orqali gaplashadi.

### Nega mikroservis emas

Mikroservis masshtab muammosini emas, **jamoa muammosini** hal qiladi: bir necha guruh bir-birini kutmasdan deploy qilishi uchun kerak. Bitta dasturchida u faqat narx keltiradi — bir necha deploy, tarmoq xatolari, taqsimlangan tranzaksiya, loglarni bir joyga yigʻish. «Bemorni yaratish» kabi oddiy amal ikki servisga boʻlinsa, tranzaksiya oʻrniga kompensatsiya mantigʻi yozishga toʻgʻri keladi.

Klinikalar soni mingga yetganda ham bitta Postgres va bitta Node jarayoni yetadi. Muammo paydo boʻlsa, modul chegaralari allaqachon tayyor — istalgan modulni alohida servisga ajratish bir kunlik ish boʻladi.

> **Chegarani buzmang**
>
> Yagona qoida: **bir modul boshqa modulning jadvaliga soʻrov yubormaydi.** Buni buzsangiz monolit «katta loyga» aylanadi va keyin ajratib boʻlmaydi. Kod koʻrigida faqat shu bitta narsani tekshiring.

## 3. Texnologiyalar

_Tanlovlar sizning hozirgi bilimingizga suyanadi — React va Node allaqachon qoʻlingizda._

| Qatlam | Tanlov | Sabab |
|---|---|---|
| Til | TypeScript | Tibbiy maʼlumot bilan ishlaganda tip xatolari qimmatga tushadi. Prisma bilan birga sxema oʻzgarsa kod darhol qizaradi |
| Server | Node 22 + Fastify | Express'dan tez, sxema tekshiruvi ichida. Nest kabi ogʻir emas |
| Baza | PostgreSQL 16 | Qator darajasidagi xavfsizlik (RLS) bor — koʻp ijarachi uchun ikkinchi himoya qatlami |
| ORM | Prisma | Migratsiya, tip xavfsizligi, oʻqiladigan sxema fayli |
| Frontend | React 18 + Vite | Mavjud ilovalar bilan bir xil — sahifalar va komponentlarni koʻchirish mumkin |
| Fayllar | MinIO (S3 mos) | Oʻsha serverda turadi — maʼlumot mamlakatdan chiqmaydi |
| Sessiya | Cookie + Redis | JWT emas: brauzer ilovasi uchun httpOnly cookie xavfsizroq va bekor qilish oson |
| Excel | SheetJS (`xlsx`) | Oʻqish ham, yozish ham. Tahlil serverda — brauzerga ishonib boʻlmaydi |
| Matnlar | Bitta modul, oʻzbekcha | Barcha yozuvlar `packages/shared/strings.ts` da. Rus tili keyin qoʻshilsa — bitta fayl nusxalanadi, kodga tegilmaydi |
| Deploy | Docker Compose | Bitta `docker compose up`. Kubernetes bu hajmda ortiqcha |
| Format va lint | Biome | Prettier va ESLint oʻrniga bitta asbob: bitta konfiguratsiya fayli, sezilarli darajada tez. Modul chegarasini `noRestrictedImports` bilan majburlab boʻladi |

> **Ochiq eslatma**
>
> TypeScript sizga yangi boʻlsa, birinchi haftada sekinlashtiradi. Lekin koʻp ijarachili tibbiy bazada `clinicId` ni bir joyda unutib qoʻyish boshqa klinikaning bemorlarini koʻrsatib yuboradi — kompilyator buni ushlab qoladi. Shuning uchun tavsiya qilyapman.

## 4. Repozitoriya tuzilishi

_Bitta repozitoriya, uchta ilova. npm workspaces yetadi — Turborepo yoki Nx shart emas._

```
e-dentist-cloud/
├─ apps/
│  ├─ api/                    # Fastify serveri (modulli monolit)
│  │  ├─ src/
│  │  │  ├─ modules/
│  │  │  │  ├─ auth/          # kirish, sessiya, parol
│  │  │  │  ├─ clinics/       # klinika, xodimlar, rollar
│  │  │  │  ├─ patients/      # bemorlar, rasmlar
│  │  │  │  ├─ visits/        # tashriflar, tish xaritasi
│  │  │  │  ├─ payments/      # toʻlovlar, qarzdorlik
│  │  │  │  ├─ schedule/      # qabul jadvali
│  │  │  │  ├─ services/      # narxnoma
│  │  │  │  ├─ expenses/      # xarajatlar
│  │  │  │  ├─ reports/       # hisobotlar
│  │  │  │  └─ billing/       # obuna, tarif, muddat
│  │  │  ├─ platform/         # baza, log, xatolar, konfiguratsiya
│  │  │  └─ server.ts
│  │  └─ prisma/schema.prisma
│  │
│  ├─ cabinet/                # klinika kabineti (React)
│  └─ admin/                  # boshqaruv paneli (React)
│
├─ packages/
│  ├─ ui/                     # umumiy komponentlar: tugma, modal, jadval
│  ├─ shared/                 # tiplar, validatsiya, sana/pul formati
│  │  └─ strings.ts           # BARCHA oʻzbekcha matnlar shu yerda
│  └─ teeth/                  # odontogramma — mavjud loyihadan koʻchiriladi
│
└─ docker-compose.yml
```

Har modul ichida bir xil tuzilish: `routes.ts` (HTTP), `service.ts` (mantiq), `repo.ts` (baza), `schema.ts` (kirish-chiqish tekshiruvi). Boshqa modul faqat `service.ts` ga murojaat qiladi.

## 5. Maʼlumotlar modeli

_Koʻp ijarachilik — loyihaning eng xavfli joyi. Bitta xato boshqa klinikaning bemorlarini koʻrsatadi._

### Ijarachilik sxemasi

Bitta baza, har jadvalda `clinic_id` ustuni. Alohida sxema yoki alohida baza emas — ular migratsiya va zaxirani bir necha barobar murakkablashtiradi.

Uch qatlamli himoya:

1. **Repozitoriya qatlami** — har soʻrovga `clinicId` avtomatik qoʻshiladi. Qoʻlda yozilmaydi
2. **Postgres RLS** — sessiya oʻzgaruvchisidagi klinikaga tegishli boʻlmagan qator umuman qaytmaydi
3. **Integratsiya testi** — «A klinikaning tokeni bilan B ning bemorini soʻrash» har modul uchun majburiy test

### Asosiy jadvallar

| Jadval | Muhim ustunlar | Izoh |
|---|---|---|
| `clinics` | name, phone, status, plan, expires_at, is_trial | Ijarachi. Sinov ham shu qator, faqat `is_trial = true` |
| `users` | clinic_id, role_id, email, password_hash, status | Platforma admini uchun `clinic_id` boʻsh. Oʻchirilmaydi — `status` bilan faolsizlantiriladi |
| `roles` | clinic_id, name, permissions[], is_owner | Har klinikaning oʻz rollari. Yaratilishda 5 ta shablon nusxalanadi |
| `invites` | clinic_id, role_id, email, token, expires_at | Xodimni taklif qilish havolasi, 7 kun amal qiladi |
| `patients` | clinic_id, fio, phone, birth_date, note | Qidiruv uchun `fio` va `phone` ga indeks |
| `visits` | patient_id, date, treatment, tooth, price |  |
| `teeth` | patient_id, tooth, status, material, note | FDI raqamlash, sut tishlari alohida |
| `bridges` | patient_id, teeth[], material | Koʻprik: tayanch va oraliq tishlar |
| `payments` | patient_id, date, amount | Qarz = tashriflar summasi − toʻlovlar |
| `appointments` | clinic_id, patient_id, at, status |  |
| `services` | clinic_id, name, price | Narxnoma |
| `expenses` | clinic_id, date, category, amount |  |
| `lab_orders` | clinic_id, patient_id, doctor_id, tech_id, teeth[], work_type, material, shade, due_date, tech_price, status, returns | Naryad. `returns` — necha marta qaytgani |
| `images` | patient_id, key, caption | `key` — MinIO dagi obyekt nomi |
| `audit_log` | clinic_id, user_id, action, entity, at | Tibbiy maʼlumot uchun kim nima qilgani yozilishi shart |

Pul **butun songda** saqlanadi (soʻm), sanalar `DATE` tipida. Bu mavjud ilovaning qoidasi — koʻchirishda mos kelishi uchun oʻzgartirilmaydi.

## 6. Rollar va ruxsatlar

_Klinika oʻzini toʻliq qamrab oladi. Siz xodim qoʻshish-oʻchirishga aralashmaysiz — bu 30 mijozdan keyin kuningizni yeb qoʻyadi._

### Model

Rol — **ruxsatlar roʻyxati**. Har klinika roʻyxatdan oʻtganda unga beshta tayyor rol nusxalanadi va ular **oʻsha klinikaga tegishli** boʻlib qoladi: egasi istalganini tahrirlashi mumkin, bu boshqa klinikalarga taʼsir qilmaydi.

### Ruxsatlar roʻyxati

| Ruxsat | Nimaga ochadi |
|---|---|
| `patients.read` | Bemorlar roʻyxati va kartochkasi |
| `patients.write` | Bemor qoʻshish, tahrirlash, oʻchirish, Exceldan yuklash |
| `visits.write` | Tashrif va muolaja yozish |
| `teeth.write` | Tish xaritasini oʻzgartirish |
| `payments.read` | Toʻlovlar va qarzdorlik |
| `payments.write` | Toʻlov qabul qilish |
| `schedule.write` | Qabul jadvali |
| `services.manage` | Narxnoma |
| `expenses.read` | Xarajatlar |
| `reports.read` | Hisobotlar, tushum, foyda |
| `lab.own` | Oʻz naryadlari, holatni oʻzgartirish |
| `lab.write` | Naryad yozish va texnik tayinlash |
| `lab.cost` | Texnik narxlari |
| `staff.manage` | Xodimlar va rollar |
| `billing.manage` | Obuna va toʻlov |
| `data.export` | Barcha maʼlumotni yuklab olish |

Roʻyxat ataylab qisqa — 16 ta ruxsat. Har boʻlim uchun alohida «koʻrish/qoʻshish/oʻchirish» uchligini yasash matritsani uch barobar kattalashtiradi va hech kimga kerak boʻlmaydi.

> **Qaror**
>
> 1-versiyada klinika **yangi rol yarata olmaydi**, lekin mavjud beshtasining ruxsatlarini oʻzgartira oladi. Sabab: toʻliq konstruktor interfeys, test va qoʻllab-quvvatlash yukini bir necha barobar oshiradi, amalda esa stomatologiyada 3-4 xil roldan koʻpi kerak boʻlmaydi.
>
> Muhimi: baza birinchi kundanoq `roles.permissions[]` bilan quriladi. Yangi rol yaratish keyin qoʻshilsa — bu **bitta tugma**, qaytadan yozish emas.

### Qulflanib qolishdan himoya

- `is_owner` roli `staff.manage` va `billing.manage` ruxsatini **yoʻqota olmaydi** — interfeys ham, server ham buni rad etadi
- Klinikada kamida bitta faol egasi qolishi shart: oxirgisini oʻchirib boʻlmaydi
- Foydalanuvchi oʻz rolini oʻzgartira olmaydi

### Xodim qoʻshish oqimi

1. Egasi: Sozlamalar → Xodimlar → «Taklif qilish», pochta va rolni tanlaydi
2. Server `invites` ga yozuv qoʻshadi va havola beradi (7 kun amal qiladi)
3. Xodim havolani ochib parol qoʻyadi — hisob faollashadi
4. Ishdan boʻshasa: hisob **oʻchirilmaydi**, `status = disabled` boʻladi. Uning tashriflari va `audit_log` dagi yozuvlari joyida qoladi

> **Hal qilinmagan**
>
> Xodimlar soni tarifga bogʻlanadimi? Agar «5 xodimgacha — bir narx, undan koʻpi — boshqa narx» boʻlsa, `billing` moduli xodim qoʻshishda chegarani tekshirishi kerak. Narx modelini belgilamaguningizcha bu ochiq qoladi.

## 7. Texnik ishlari

_Shifokor naryad yozadi, texnik bajaradi. Texnik bemor bilan ishlamaydi — u faqat ish, tish raqamlari va material bilan ishlaydi._

### Texnik nimani koʻradi

Texnik — klinikaning oddiy xodimi, alohida rol shabloni. Oʻz hisobi bilan kiradi va **faqat oʻziga biriktirilgan naryadlarni** koʻradi.

| Koʻradi | Koʻrmaydi |
|---|---|
| Bemorning F.I.O. si, tish raqamlari, ish turi, material, rang, muddat, oʻz narxi | Bemorning telefoni, manzili, toʻlovlari, qarzi, boshqa tashriflari, hisobotlar, narxnoma |

Bemorning ismi kerak — busiz ishni aniqlab boʻlmaydi. Qolgan hamma narsa yopiq: texnikka bemorning pul masalasi ham, boshqa muolajalari ham aloqador emas.

### Naryad maydonlari

| Maydon | Qiymatlar |
|---|---|
| Bemor | Kartotekadan tanlanadi |
| Shifokor | Naryadni yozgan xodim, avtomatik |
| Texnik | Klinika xodimlaridan tanlanadi |
| Tishlar | FDI raqamlari, bir nechta tanlanadi. Koʻprikda tayanch va oraliq ajratiladi |
| Ish turi | Koronka · Koʻprik · Olinadigan protez · Bugel · Vinir · Inley/onley · Kappa · Ortodontik plastinka |
| Material | Metall-keramika · Sirkoniy · Press-keramika · Plastmassa · Quyma metall · Neylon |
| Rang | VITA Classical: A1–A4, B1–B4, C1–C4, D2–D4 |
| Muddat | Topshirish sanasi. Oʻtib ketgani roʻyxatda qizil |
| Texnik narxi | Klinika texnikka toʻlaydigan summa |
| Bemor narxi | Tashrifga yoziladi, bemor hisobiga tushadi |
| Izoh | Erkin matn |

### Holatlar

Uchta holat: **Berildi** → **Tayyor** → **Topshirildi**. Texnik «Tayyor» ni oʻzi belgilaydi, «Topshirildi» ni shifokor yoki qabulxona.

> **Qaytarildi**
>
> Bosqichlar qoʻshilmaydi, lekin **«Qaytarildi»** amali kerak: naryad «Tayyor» dan «Berildi» ga qaytadi, sababi (oʻlchov · rang mos emas · sindi · boshqa) va izoh yoziladi, qaytishlar soni oshadi.
>
> Sababi amaliy: metall-keramika koronka deyarli har doim bir marta oʻlchovga qaytadi. Busiz naryad «Tayyor» da qotib qoladi yoki soxta yopiladi. Qaytishlar soni esa vaqt oʻtib texnikning ish sifatini koʻrsatadi.

### Boshqa boʻlimlar bilan bogʻlanish

- **Tish xaritasi.** Naryad «Topshirildi» boʻlganda oʻsha tishlar avtomatik «koronka» holatiga oʻtadi va materiali yoziladi. Shifokor qoʻlda ikkinchi marta kiritmaydi
- **Xarajatlar.** Texnik narxi «Texnik ishlari» turkumida xarajat sifatida yoziladi. Busiz hisobotdagi sof foyda yolgʻon chiqadi — protez ishlarida texnikning ulushi katta
- **Bemor kartochkasi.** Yangi «Texnik ishlari» boʻlimi: shu bemorga qilingan barcha naryadlar

### Yangi ruxsatlar

| Ruxsat | Nimaga ochadi |
|---|---|
| `lab.own` | Faqat oʻziga biriktirilgan naryadlar, holatni oʻzgartirish |
| `lab.write` | Naryad yozish, texnik tayinlash, topshirilganini belgilash |
| `lab.cost` | Texnik narxlarini koʻrish va oʻzgartirish |

«Texnik» shabloni: faqat `lab.own` va `patients.read`ning cheklangan koʻrinishi. «Shifokor» shabloni: `lab.write`. «Egasi»: uchalasi ham.

### Sahifa

Kabinetda yangi «Texnik ishlari» boʻlimi: naryadlar roʻyxati, holat va texnik boʻyicha filtr, muddati oʻtganlari tepada. Texnik kirganda uning boshlangʻich sahifasi shu boʻladi — bemorlar roʻyxati emas.

## 8. Backend modullari

_Har modul mustaqil ishlab chiqiladi va alohida testlanadi._

| Modul | Javobgarligi | Boshqalarga bogʻliqligi |
|---|---|---|
| `auth` | Kirish, chiqish, sessiya, parolni tiklash | — |
| `clinics` | Klinika profili, xodimlar, rollar, ruxsatlar, taklifnomalar | auth |
| `patients` | Kartoteka, qidiruv, rasmlar, Excel yuklash va chiqarish | clinics |
| `visits` | Tashriflar, muolajalar, tish xaritasi | patients, services |
| `payments` | Toʻlovlar, qarzdorlar roʻyxati | patients, visits |
| `schedule` | Qabullar, kunlik eslatma | patients |
| `services` | Narxnoma | clinics |
| `expenses` | Xarajatlar | clinics |
| `lab` | Naryadlar, texnik ishlari, holatlar | patients, expenses, visits |
| `reports` | Oylik tushum, sof foyda, statistika | visits, payments, expenses |
| `billing` | Obuna holati, muddat, bloklash | clinics |

### Bemorlarni Excel dan yuklash

Klinikaning bemorlari koʻpincha Excelda yoki daftarda boʻladi. Qoʻlda 800 ta bemorni kiritish — mijozni yoʻqotishning eng ishonchli yoʻli. Shuning uchun bu 1-versiyada boʻlishi kerak.

1. **Shablonni yuklab olish.** Toʻgʻri ustunlar, ikkita namuna qator va ikkinchi varaqda qoʻllanma: qaysi maydon majburiy, sana qanday yoziladi. Mijoz oʻz roʻyxatini shu shaklga koʻchiradi
2. **Fayl tanlash.** `.xlsx` va `.csv`. Eng koʻpi 5000 qator, 5 MB
3. **Oldindan koʻrish.** Birinchi 20 qator jadvalda koʻrsatiladi: qaysilari toʻgʻri, qaysilarida xato va nima xato
4. **Takrorlar.** Telefon raqami boʻyicha tekshiriladi. Uch tanlov: oʻtkazib yuborish · mavjudini yangilash · baribir qoʻshish
5. **Yuklash.** Toʻgʻri qatorlar yoziladi, xatolilari oʻtkazib yuboriladi. Oxirida hisobot: nechta qoʻshildi, nechta yangilandi, nechta oʻtkazib yuborildi. Xatolar alohida Excel faylga chiqariladi — mijoz uni tuzatib qayta yuklaydi

> **Soddalashtirish**
>
> Ustunlarni qoʻlda moslash oynasi **qilinmaydi**. Shablon bor ekan, u ortiqcha interfeys va ortiqcha xato manbai.
>
> Oʻrniga ustunlar **sarlavha nomi boʻyicha** tanaladi — tartibi oʻzgarsa ham, ortiqcha ustun qoʻshilsa ham ishlayveradi. Majburiy ustun topilmasa xato aniq boʻladi: «F.I.O. ustuni topilmadi. Shablonni yuklab olib, sarlavhalarni solishtiring.»

> **Chiqarilgan fayl = shablon**
>
> Excelga chiqarish **aynan shu ustunlar bilan** yozadi. Demak chiqarilgan faylni tahrirlab, qaytadan yuklash mumkin — bu koʻp yozuvni birdaniga tuzatishning eng oson yoʻli (chiqarish → Excelda tuzatish → «mavjudini yangilash» rejimida yuklash).
>
> Shu sabab chiqarilgan faylda bemor `id` si ham boʻladi: takrorni telefon emas, id boʻyicha aniqlash aniqroq ishlaydi.

| Maydon | Majburiy | Qabul qilinadigan koʻrinish |
|---|---|---|
| ID | Yoʻq | Faqat chiqarilgan faylda boʻladi. Bor boʻlsa — mavjud bemor yangilanadi |
| F.I.O. | Ha | Matn, kamida 3 belgi |
| Telefon | Yoʻq | `901234567`, `+998901234567`, `90 123 45 67` — hammasi bir koʻrinishga keltiriladi |
| Tugʻilgan sana | Yoʻq | Excel sana katagi yoki matn: `12/05/1990` (kun/oy/yil) |
| Manzil | Yoʻq | Matn |
| Izoh | Yoʻq | Matn — allergiya, surunkali kasalliklar |

> **Excel tuzoqlari**
>
> Bular ishni koʻpaytiradigan, lekin oʻtkazib boʻlmaydigan joylar:
>
> **Sana raqam boʻlib keladi.** Excel sanani seriya raqami sifatida saqlaydi (`32915` = 12/05/1990). Katak turini tekshirib, ikkala koʻrinishni ham oʻqish kerak.
>
> **Kun/oy chalkashligi.** `05/12/1990` — 5-dekabrmi yoki 12-maymi? Bizda hamma joyda kun/oy/yil, shuning uchun matn sanalar shu tartibda oʻqiladi va oldindan koʻrishda toʻliq koʻrsatiladi — foydalanuvchi xatoni oʻsha yerda koʻradi.
>
> **Telefon nol bilan boshlanadi.** Excel `0901234567` dagi nolni yeb qoʻyadi. Raqam 9 xonadan kam boʻlsa oldiga nol qoʻshib koʻriladi.
>
> **Birinchi qator sarlavhami yoki maʼlumotmi?** Foydalanuvchi belgilaydi, taxmin qilinmaydi.

Yuklash `patients.write` ruxsatini talab qiladi va `audit_log` ga bitta yozuv sifatida tushadi: kim, qachon, nechta qator. Roʻyxatni Excelga chiqarish esa `patients.read` bilan ishlaydi.

### Roʻyxatdan oʻtish va sinov

1. Klinika egasi saytda pochta, klinika nomi va parol kiritadi
2. Pochtaga tasdiqlash havolasi boradi — tasdiqlanmaguncha kabinet ochilmaydi
3. Tasdiqlangach klinika yaratiladi: `is_trial = true`, `expires_at = +14 kun`, beshta rol shabloni nusxalanadi, egasi birinchi foydalanuvchi boʻladi
4. Sizga Telegramga xabar keladi — nomi, pochtasi, vaqti
5. Toʻlovdan keyin siz boshqaruv panelida muddatni uzaytirasiz, `is_trial` oʻchadi. Mijoz hech narsa kiritmaydi

> **Suiisteʼmoldan himoya**
>
> Oʻzi roʻyxatdan oʻtish ochiq boʻlgani uchun kerak: bitta IP dan kuniga nechta roʻyxat (masalan 3 ta), bir martalik pochta xizmatlarini rad etish, va boshqaruv panelida bloklash tugmasi. Murakkab tizim shart emas, lekin umuman himoyasiz qoldirib boʻlmaydi.

### Obuna qanday ishlaydi

Har soʻrovda `billing` moduli klinikaning `expires_at` sanasini tekshiradi. Muddat tugagan boʻlsa — faqat oʻqish rejimi: maʼlumot koʻrinadi, eksport qilinadi, lekin yangi yozuv qoʻshilmaydi. Maʼlumot hech qachon oʻchirilmaydi.

Toʻlov hozircha qoʻlda: mijoz Telegram orqali yozadi, siz boshqaruv panelida muddatni uzaytirasiz. `billing` moduli shundayki, keyinchalik Payme yoki Click webhook'i qoʻshilganda faqat bitta funksiya oʻzgaradi.

## 9. API shartnomasi

_REST, JSON, cookie sessiya. Har javob bir xil shaklda._

```
GET    /api/patients?q=karimov&page=1
POST   /api/patients
GET    /api/patients/:id
PATCH  /api/patients/:id
DELETE /api/patients/:id

POST   /api/patients/import/preview   # fayl → tahlil, xatolar, takrorlar
POST   /api/patients/import/commit    # tasdiqlangach yozish
GET    /api/patients/import/template  # namuna .xlsx
GET    /api/patients/export           # roʻyxat .xlsx

GET    /api/patients/:id/visits
POST   /api/visits
GET    /api/patients/:id/teeth
PUT    /api/patients/:id/teeth/:tooth

GET    /api/lab-orders?status=berildi&tech=:id
POST   /api/lab-orders
PATCH  /api/lab-orders/:id/status     # tayyor | topshirildi | qaytarildi

GET    /api/appointments?from=2026-09-01&to=2026-09-30
POST   /api/payments
GET    /api/debtors
GET    /api/reports/monthly?ym=2026-09

GET    /api/staff
POST   /api/staff/invite
PATCH  /api/staff/:id            # rol, status
GET    /api/roles
PATCH  /api/roles/:id            # ruxsatlar roʻyxati

POST   /api/auth/register        # klinika + egasi, sinov boshlanadi
POST   /api/auth/verify          # pochtani tasdiqlash
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/me

# faqat platforma admini
GET    /api/admin/clinics
POST   /api/admin/clinics/:id/extend
```

Javob shakli hamma joyda bir xil — mavjud ilovadagi `{ok, data|error}` qoidasining davomi:

```
{ "ok": true,  "data": { … } }
{ "ok": false, "error": { "code": "not_found", "message": "Bemor topilmadi" } }
```

Xato matnlari **oʻzbekcha** va foydalanuvchi tushunadigan tilda. Texnik tafsilot logga yoziladi, javobga emas.

## 10. Kabinet

_Klinika kundalik ishlaydigan asosiy ilova. Mavjud desktop ilovaning tuzilishini takrorlaydi._

### Sahifalar

| Sahifa | Mazmuni | Kim koʻradi |
|---|---|---|
| Bemorlar | Roʻyxat, qidiruv, ustun filtrlari, yangi bemor, Exceldan yuklash, Excelga chiqarish | Hammasi |
| Bemor kartochkasi | Tashriflar · Tish xaritasi · Toʻlovlar · Rasmlar | Hammasi |
| Qabul jadvali | Oylik kalendar, kunlik roʻyxat | Hammasi |
| Texnik ishlari | Naryadlar roʻyxati, holat va texnik boʻyicha filtr, muddati oʻtganlari tepada | Shifokor, texnik, egasi |
| Qarzdorlar | Qarzi bor bemorlar, jami summa | Egasi, qabulxona |
| Narxnoma | Xizmatlar va narxlari | Egasi |
| Xarajatlar | Oylik xarajatlar, turlari boʻyicha | Egasi |
| Hisobotlar | Tushum, sof foyda, 12 oylik grafik | Egasi |
| Sozlamalar | Klinika, xodimlar, obuna, eksport | Egasi |

### Nimalarni koʻchirish mumkin

Mavjud loyihadagi tayyor kod — qaytadan yozish shart emas:

- `lib/teeth.js` — odontogramma geometriyasi va tish yoʻllari
- `lib/format.js` — sana va pul formati (DD/MM/YYYY, soʻm)
- `lib/validation.js` — telefon maskasi, forma tekshiruvi
- `ToothChart.jsx`, `Modal`, `Field`, `MoneyInput`, `DateInput`
- Sahifalarning tuzilishi va oʻzbekcha matnlar

Almashtiriladigan yagona qatlam — maʼlumot manbai: `window.api.*` oʻrniga HTTP soʻrovlar. Sahifalarning oʻzi deyarli oʻzgarmaydi.

> **Eksport majburiy**
>
> Kabinetda «Barcha maʼlumotni yuklab olish» tugmasi **birinchi versiyadan** boʻlishi kerak — mavjud zip formatida. Bu mijozning ishonchini oshiradi («maʼlumot mening qoʻlimda») va obuna tugaganda ham u maʼlumotsiz qolmaydi.

## 11. Boshqaruv paneli

_Faqat siz ishlatasiz. Kichik, lekin sotuvning butun boshqaruvi shu yerda._

| Ekran | Nima koʻrsatadi |
|---|---|
| Klinikalar | Roʻyxat: nomi, tarif, muddat, xodimlar soni, oxirgi faollik. Sinovdagilar alohida belgi bilan |
| Klinika kartochkasi | Muddatni uzaytirish, bloklash, xodimlarni koʻrish, tarixi |
| Yangi klinika | Qoʻlda yaratish — mijoz oʻzi roʻyxatdan oʻta olmagan holatlar uchun |
| Statistika | Nechta klinika faol, nechtasi sinovda, oylik daromad |
| Hodisalar | Kirish urinishlari, muddat tugashi, xatolar |

> **Qatʼiy chegara**
>
> Boshqaruv paneli **bemor maʼlumotini koʻrsatmaydi** — na ism, na tashrif, na rasm. Faqat sonlar va klinika darajasidagi maʼlumot. Bu texnik cheklov sifatida yozilsin: admin roli uchun `patients` moduli umuman ochilmaydi. Tibbiy maʼlumotga kirish huquqi faqat oʻsha klinikaning xodimlarida.

## 12. Xavfsizlik va qonun

_Bu boʻlim loyihaning eng jiddiy qismi. Oflayn ilovada bu masalalar yoʻq edi — bulutda ular sizning javobgarligingiz._

> **Server Yevropada**
>
> Server Hetzner Cloud dan olinadi (Falkenstein yoki Helsinki) — bosqich 5.6 da. Undan oldin hamma narsa notebookda Docker da ishlaydi. Oʻzbekiston qonuni (ZRU-547) fuqarolarning shaxsiy maʼlumatlarini mamlakat hududida saqlashni talab qiladi, tibbiy maʼlumot esa alohida himoyalangan toifa.
>
> Yuridik tekshiruv toʻlov integratsiyasi bosqichiga qoldirilgan — **foydalanuvchining qarori**. Agar oʻshanda maʼlumot mamlakat ichida turishi kerak deb chiqsa, koʻchirish kerak boʻladi.
>
> **Shu sabab joylashtirish koʻchma boʻlishi shart:** hamma narsa Docker Compose da, hech qanday provayderga xos xizmat ishlatilmaydi (Hetzner ning boshqariladigan bazasi, obyekt saqlagichi, yuk taqsimlagichi va h.k.). Shunda koʻchirish bir kunlik ish boʻladi.

> **Toʻlov integratsiyasida qayta koʻriladi**
>
> Payme yoki Click ulanganda **alohida talablar toʻplami** paydo boʻladi: toʻlov tizimi bilan shartnoma, moliyaviy hisobot, chek va qaytarish tartibi. Yuridik tekshiruvni oʻsha bosqichda qilish kelishildi — hozir shart emas, chunki toʻlov tizimda umuman yoʻq.

### Texnik talablar

- Barcha aloqa HTTPS. Sertifikat — Let's Encrypt, avtomatik yangilanadi
- Parollar — `argon2id`. Mavjud ilovadagi scrypt ham boʻladi, lekin yangi loyihada argon2
- Sessiya cookie: `httpOnly`, `secure`, `sameSite=lax`
- Kirish urinishlari cheklovi: IP va hisob boʻyicha
- Bemor rasmlari — imzolangan vaqtinchalik havola orqali, ochiq URL emas
- Bazada shifrlash: disk darajasida (LUKS) yoki Postgres TDE
- `audit_log` — kim, qachon, qaysi bemor yozuvini koʻrgani/oʻzgartirgani

### Zaxira

- Kunlik `pg_dump`, 30 kunlik saqlash
- Haftalik toʻliq nusxa — boshqa jismoniy joyga. Maʼlumot qaysi yurisdiksiyada tursa, zaxira ham **oʻsha yurisdiksiyada**
- Oyiga bir marta tiklashni sinab koʻrish. Sinalmagan zaxira — zaxira emas

## 13. Infratuzilma

_Bitta server yetadi. Boshidan ortiqcha murakkablik qurmang._

| Nima | Talab | Izoh |
|---|---|---|
| Server | Hetzner Cloud (Yevropa) | Bosqich 5.6 da olinadi. Tavsiya: CX32 — 4 vCPU / 8 GB / 80 GB. Kechikish ~100 ms — CRUD uchun sezilarli, lekin toʻsiq emas |
| OS | Ubuntu 24.04 LTS |  |
| Konteynerlar | api · postgres · redis · minio · caddy | Docker Compose, bitta fayl |
| Proxy | Caddy | HTTPS avtomatik, sozlash nginx'dan sodda |
| Domen | `e-dentist.uz` | Asosiy manzil va `www` — Netlify'dagi landing, tegilmaydi. Serverga faqat `kabinet.` va `admin.` qaratiladi |
| Kuzatuv | Uptime Kuma + Postgres loglar | Boshida shu yetadi |

> **Landing alohida qoladi**
>
> Mavjud sayt (`web/`, oflayn ilovalar repozitoriyasida) Netlify'da qolaveradi va `e-dentist.uz` ni egallaydi. Bulut ilovasi `kabinet.e-dentist.uz` ga chiqadi.
>
> Sabab: marketing sahifasi ilovadan mustaqil boʻlishi kerak. Serverni yangilayotganda yoki u yiqilganda ham sayt ochiladi — mijoz «umuman ishlamayapti» degan xulosaga kelmaydi.

### Chiqarish tartibi

GitHub Actions: test → qurish → serverga `docker compose pull && up -d`. Migratsiya ishga tushishdan oldin avtomatik bajariladi. Orqaga qaytarish — oldingi image tegi bilan.

## 14. Navbat va QR

_Bemor eshikdagi QR ni skanerlaydi, shifokorni tanlaydi, navbatda nechta odam borligini koʻradi va xohlasa yoziladi._

> **Bu boʻlim nima turadi**
>
> Navbat — tizimning **birinchi loginsiz sahifasi**. Qolgan hamma narsa qulf ortida edi, bu esa yangi hujum yuzasi ochadi: ochiq sahifa, suiisteʼmoldan himoya, jonli yangilanish, kutish xonasi ekrani.
>
> Amalda bu **2-3 hafta qoʻshimcha ish** va umumiy muddatni 8 haftadan 11 ga koʻtaradi.

### Navbat va qabul jadvali — bitta model

Ikkita parallel tizim qurilmaydi. Navbat — bu **«bugungi, vaqti belgilanmagan qabul»**: `appointments` jadvaliga ikkita ustun qoʻshiladi (`queue_number`, `queue_status`), sana bugungi, vaqt boʻsh qoladi. Oldindan yozilgan qabullar oʻz vaqti bilan qolaveradi.

### Uchta koʻrinish

| Sahifa | Kim koʻradi | Nima koʻrsatadi |
|---|---|---|
| `/n/<kod>`  
telefon | Bemor, loginsiz | Shifokorlar roʻyxati, har birida navbatdagilar soni va taxminiy kutish vaqti. «Navbatga yozilish» tugmasi |
| `/n/<kod>/ekran`  
televizor | Kutish xonasi | Katta shriftda: hozir chaqirilgan raqam va keyingi uchtasi. **Ismlar yoʻq** |
| Kabinetdagi «Navbat» | Qabulxona, shifokor | Toʻliq roʻyxat ismlari bilan. Amallar: chaqirish · keldi · kelmadi · yakunlandi |

### Bemor tomonidagi oqim

1. Eshikdagi QR ni skanerlaydi — brauzer ochiladi, hech narsa oʻrnatmaydi
2. Shifokorni tanlaydi. Har birida: «navbatda 4 kishi · taxminan 50 daqiqa»
3. Ism va telefonini kiritadi
4. Raqam oladi: «Sizning raqamingiz 7. Oldingizda 3 kishi.» Sahifa oʻzi yangilanib turadi
5. Navbati kelganda sahifada «Sizni chaqirishmoqda» yoziladi

> **Maxfiylik chegarasi**
>
> Kutish xonasidagi ekranda va ochiq sahifada **bemor ismlari koʻrsatilmaydi** — faqat raqamlar. Kutayotgan odamlar bir-birining ismini bilmasligi kerak: stomatologiyaga murojaat ham tibbiy maʼlumot.
>
> Ismlar faqat kabinet ichida, xodimlarga koʻrinadi.

> **Suiisteʼmoldan himoya**
>
> Ochiq sahifada istalgan odam navbatga yozila oladi — soxta yozuvlar muammosi paydo boʻladi. SMS tasdiqlash pul turadi, shuning uchun boshqacha yechim:
>
> **Klinika kodi taxmin qilib boʻlmaydi** — 8 belgili tasodifiy, URL da klinika raqami koʻrinmaydi. QR faqat eshikda.
>
> **Cheklov:** bitta qurilmadan kuniga 2 ta, bitta IP dan soatiga 5 ta yozuv.
>
> **Tasdiqlash qabulxonada.** Yozilgan bemor «tasdiqlanmagan» holatda turadi, qabulxona uni koʻradi va tasdiqlaydi. Soxta yozuv navbatni buzmaydi.
>
> **Oʻchirib qoʻyish** — klinika navbat tizimini butunlay yopa oladi.

### Texnik tomoni

- **Jonli yangilanish:** SSE (Server-Sent Events). WebSocket shart emas — maʼlumot bir tomonga oqadi va SSE proxy orqali muammosiz oʻtadi
- **Taxminiy vaqt:** oxirgi 20 ta qabulning oʻrtacha davomiyligi × oldindagi odamlar soni. Aniq emas, lekin «10 daqiqa» deb yolgʻon aytishdan yaxshi
- **Yangi ruxsatlar:** `queue.manage` — chaqirish va holatni oʻzgartirish
- **Bogʻlanish:** navbatdagi bemor kartotekada bor boʻlsa telefon boʻyicha topiladi; yoʻq boʻlsa qabulxona tasdiqlaganda yangi bemor yaratiladi

## 15. Bosqichlar

_Har bosqich oxirida ishlaydigan narsa boʻlishi kerak. Muddatlar yolgʻiz, toʻliq bandlik uchun._

**1–2 hafta — Poydevor**

Repozitoriya, Docker, Postgres, Prisma sxema, auth moduli, roʻyxatdan oʻtish, koʻp ijarachilik va RLS. Oxirida: klinika yaratiladi, egasi kiradi, boʻsh kabinet ochiladi.

**3–5 hafta — Asosiy ish oqimi**

Bemorlar, tashriflar, tish xaritasi, toʻlovlar, qabul jadvali va Exceldan yuklash. Bu — mahsulotning yuragi. Oxirida klinika haqiqatan ishlata boshlashi mumkin.

**6–7 hafta — Pul, hisobot, texnik**

Narxnoma, xarajatlar, hisobotlar, qarzdorlar, rollar va xodimlar, texnik ishlari (naryadlar), maʼlumotni eksport qilish.

**8–9 hafta — Navbat va QR**

Ochiq sahifa, kutish xonasi ekrani, jonli yangilanish (SSE), suiisteʼmoldan himoya, qabulxona uchun navbat boshqaruvi.

**10–11 hafta — Boshqaruv paneli va chiqarish**

Klinikalar roʻyxati, obuna boshqaruvi, zaxira, kuzatuv, domen, HTTPS. Birinchi mijozni joylashtirish.

> **Xavf**
>
> Bu muddatlar **faqat dasturlash** uchun va toʻliq bandlikda. Server sotib olish, domen, birinchi mijozlar bilan ishlash — alohida vaqt. Ustiga hozirgi oflayn ilovalarni qoʻllab-quvvatlash ham davom etadi.
>
> Real rejaga **11 hafta emas, 4-5 oy** deb qarang. Qamrovni qisqartirish kerak boʻlsa, birinchi nomzod — navbat va QR: u alohida boʻlim, qolganiga bogʻliq emas.

## 16. Ochiq savollar

_Kod yozishdan oldin javob berilishi kerak boʻlgan narsalar._

1. **Mijoz bilan shartnoma.** Klinika bilan tuziladigan shartnomada maʼlumot kimga tegishli, zaxira va uzilish boʻyicha javobgarlik qanday yozilishi kerak? Yurist bilan — toʻlov integratsiyasi bosqichida.
2. **Narx.** Oylik obuna qancha? Sinovdan keyin qanday tarif taklif qilinadi? Bu `billing` modulining tuzilishiga taʼsir qiladi.
3. ~~**Server provayderi.**~~ Hal qilindi: Hetzner Cloud, Ubuntu 24.04. Server bosqich 5.6 da olinadi — undan oldin ishlab chiqish notebookda, Docker da.
4. ~~**Domen.**~~ Hal qilindi: `e-dentist.uz`. Landing Netlify'da apex'da qoladi, ilova `kabinet.e-dentist.uz`, panel `admin.e-dentist.uz`.
5. **Xodim soni tarifga taʼsir qiladimi?** Cheklovsizmi yoki «5 xodimgacha» kabi bosqichlarmi? Bu `billing` va xodim qoʻshish oqimiga taʼsir qiladi.
6. **Kim quradi.** Oʻzingizmi yoki dasturchi yollaysizmi? Yollasangiz bu TZ shartnomaga ilova boʻladi.
