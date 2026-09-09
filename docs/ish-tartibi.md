`Ish tartibi · 1-tahrir`

# Ish tartibi

> Qanday ishlaymiz. Nima qurilishi — [`tz.md`](tz.md).
> Qaysi task navbatda — [`reja.md`](reja.md).

## 1. Kim nima qiladi

| Kim | Nima qiladi |
|---|---|
| **Claude** | Kod yozadi, testlarni yozadi va oʻzi ishga tushiradi, migratsiya yasaydi, hujjatlarni yangilaydi, `reja.md` da holatni belgilaydi |
| **Siz** | Ishni tasdiqlaysiz, brauzerda koʻrib tekshirasiz, tashqi narsalarni qilasiz: Docker ni yoqish, server sotib olish, DNS, parollar, toʻlovlar |

Qoida: **maxfiy maʼlumot (parol, API kalit, server kaliti) faqat sizda.** Men ularni
soʻramayman va yozmayman — `.env` fayliga oʻzingiz kiritasiz, men faqat `.env.example`
ni tayyorlab beraman.

## 2. Bitta taskning yoʻli

Har task shu besh qadamdan oʻtadi:

1. **Boshlash.** `reja.md` dagi keyingi `[ ]` task olinadi va `[~]` ga oʻtkaziladi.
   Men taskni bir-ikki gapda tushuntiraman: nima quriladi, qaysi fayllar tegiladi
2. **Qurish.** Men kod yozaman
3. **Tekshirish.** Testlar, `typecheck`, keyin — agar koʻrinadigan natija boʻlsa —
   sizga brauzerda tekshirish uchun aniq koʻrsatma beraman
4. **Tasdiq.** Siz «boʻldi» deysiz yoki tuzatish soʻraysiz
5. **Yopish.** Commit qilinadi, `reja.md` da `[x]` boʻladi va «Hozirgi task» yangilanadi

**Bir vaqtda bitta task.** Yarim qolgan ikkita ishdan koʻra tugatilgan bitta ish yaxshi.

## 3. Sizga topshiriq berilganda

Sizga biror narsa qilish tegsa, men **shu shaklda** yozaman — taxmin qilishingiz shart emas:

> ### Task 0.1 — Docker ni ishga tushirish
>
> **1-qadam. Docker Desktop ni oching**
> - Nima uchun: konteynerlar faqat demon ishlayotganda koʻtariladi
> - Buyruq: `open -a Docker`
> - Kutilgan natija: menyu satrida kit belgisi paydo boʻladi va «Docker Desktop is running» deydi
> - Xato chiqsa: `zsh: command not found` → Docker Desktop oʻrnatilmagan, quyidagi havoladan yuklang
>
> **2-qadam. Tekshiring**
> - Buyruq: `docker ps`
> - Kutilgan natija: sarlavhali boʻsh jadval (`CONTAINER ID   IMAGE   ...`)
> - Xato chiqsa: `Cannot connect to the Docker daemon` → demon hali koʻtarilmagan, 20 soniya kuting va qayta urinib koʻring
>
> Boʻlgach «tayyor» deb yozing.

Har qadamda toʻrt narsa boʻladi: **nima uchun · buyruq · kutilgan natija · xato chiqsa**.
Buyruqlar alohida katakda beriladi — nusxalab qoʻyish uchun.

Bir topshiriqda 5-6 qadamdan koʻp boʻlmaydi. Koʻproq kerak boʻlsa — task ikkiga boʻlinadi.

## 4. Git tartibi

- Har bosqich uchun bitta branch: `bosqich-0-muhit`, `bosqich-1-poydevor`, …
- Tasklar shu branchga commit qilinadi, bosqich tugagach `main` ga qoʻshiladi
- `main` doim ishlaydigan holatda turadi
- Commit xabari oʻzbekcha, `<qism>: <nima qilindi>` shaklida:

```
auth: kirish, chiqish va Redis sessiyasi
patients: Excel dan yuklash — oldindan koʻrish
docs: Contabo oʻrniga Hetzner
```

- `.env`, kalitlar, `pgdata/`, `node_modules/` hech qachon commit ga tushmaydi
- Commit **har task oxirida avtomatik** qilinadi (`bosqich-N-...` branchida).
  `main` ga qoʻshish esa faqat siz aytganingizda — bosqich tugagach

> **Qoʻlda migratsiya yozilsa — papka nomi UTC da**
>
> Prisma migratsiya papkasini **UTC** vaqti bilan nomlaydi. Qoʻlda yozilganda
> `date` mahalliy vaqtni beradi (Toshkent UTC+5) va papka besh soat oldinga
> ketadi. Natijada keyingi Prisma migratsiyasi eskilaridan **oldin** turib
> qoladi, tartib buziladi va migratsiya qayta oʻynatilganda xato beradi.
>
> Toʻgʻrisi: `date -u +%Y%m%d%H%M%S`

## 5. Task qachon «tayyor»

Beshtasi ham bajarilishi shart:

1. Ishlaydi — qoʻlda tekshirilgan
2. `npm run typecheck` yashil
3. Yangi modul boʻlsa — **koʻp ijarachilik testi bor va oʻtadi**
   («A klinikaning sessiyasi bilan B ning yozuvini soʻrash»)
4. Barcha koʻrinadigan matn `packages/shared/strings.ts` da, oʻzbekcha
5. Xato javoblari `{ok:false, error:{code,message}}` shaklida, matni oʻzbekcha

Uchinchi banddan chegirma yoʻq. Koʻp ijarachilikni keyin qoʻshib boʻlmaydi —
har yozilgan soʻrovni qaytadan koʻrib chiqishga toʻgʻri keladi.

## 6. Toʻxtash nuqtalari

Har bosqich oxirida ishlaydigan natija koʻrsatiladi va shu yerda toʻxtaymiz:
siz koʻrib chiqasiz, keyingi bosqich boshlanadi.

| Bosqich | Nimani koʻrasiz |
|---|---|
| 0 | `docker compose up -d` → uch xizmat ishlayapti |
| 1 | Roʻyxatdan oʻtasiz, kirasiz, boʻsh kabinet ochiladi |
| 2 | Bemor qoʻshasiz, tish xaritasini toʻldirasiz, Excel dan yuklaysiz |
| 3 | Hisobotni koʻrasiz, naryad yozasiz, texnik hisobi bilan kirasiz |
| 4 | Telefonda QR ni skanerlab navbatga yozilasiz |
| 5 | Hammasi `kabinet.e-dentist.uz` da ishlaydi |

## 7. Hujjatlar qachon yangilanadi

- **Qaror oʻzgardi** (masalan Contabo → Hetzner) → `tz.md` yangilanadi. Bu bosh nusxa
- **Task tugadi yoki qoʻshildi** → `reja.md` yangilanadi
- **Ish usuli oʻzgardi** → shu fayl yangilanadi
- **Muhokamada qaror qabul qilindi** → `CLAUDE.md` dagi «Kelishilgan qarorlar» ga tushadi,
  keyin qayta ochilmaydi

Hujjat oʻzgarishi ham commit boʻladi — nima uchun oʻzgargani git tarixida qoladi.

## 8. Xato chiqsa

1. **Xatoning toʻliq matnini** menga yuboring — qisqartirmang, oxirgi qatorini ham
2. Qaysi buyruqdan keyin chiqqanini yozing
3. Men tuzataman yoki keyingi qadamni koʻrsataman

Toʻxtab qolgan joyda taxmin qilib oʻtib ketmang — bir necha qadamdan keyin sabab
topilmaydigan boʻlib qoladi.

## 9. Muhit

| Nima | Lokal (notebook) | Server (Hetzner) |
|---|---|---|
| Qachon | Hozirdan bosqich 5 gacha | 5.6 dan boshlab |
| Baza | Docker `postgres:16`, `localhost:5432` | Konteyner, tashqariga ochilmagan |
| Fayllar | Docker MinIO, `localhost:9000` | Konteyner, Caddy orqali |
| API | `npm run dev`, `localhost:3000` | Konteyner, `kabinet.e-dentist.uz/api` |
| Kabinet | Vite, `localhost:5173` | Caddy statik fayl sifatida beradi |
| Pochta | Xat konsolga chiqadi | SMTP |

Lokalda ishlaydigan narsa serverda ham ishlashi kerak — shu sabab lokalda ham
xizmatlar Docker da turadi, notebookga toʻgʻridan-toʻgʻri Postgres oʻrnatilmaydi.

## Testlar bir-birining qoldigʻiga urilmasin

Testlar haqiqiy Postgres va Redis da ishlaydi, shuning uchun ikkita
tuzoq bor. Ikkalasi ham amalda «goh oʻtadi, goh yiqiladi» degan holatga
olib keldi:

1. **Redis dagi hisoblagichlar** ishga tushirishlar orasida qoladi
   (cheklov oynasi — bir soat yoki bir kun). Cheklov sinaladigan test
   har yugurishda **tasodifiy IP** olishi kerak, vaqtga bogʻlash
   yetarli emas: bir daqiqada ikki marta ishga tushsa oraliq baribir
   bir xil boʻladi.

2. **Umumiy sanoqlar** — masalan «nechta klinika bloklangan» — boshqa
   test fayllari bilan parallel oʻzgaradi. Sanoq **oʻzgarishini**
   emas, oʻz yozuvining holatini tekshiring.
