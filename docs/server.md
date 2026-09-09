# Serverga chiqarish

Bu yerda **serverdagi** ish tartibi. Lokal muhit `README.md` da.

Server: Ubuntu 24.04, Docker va Docker Compose oʻrnatilgan.
Domen: `kabinet.e-dentist.uz` va `admin.e-dentist.uz` server IP siga
qaratilgan (apex va `www` — Netlify'dagi landing, tegilmaydi).

## Nima qayerda ishlaydi

| Konteyner | Nima qiladi | Tashqariga ochiqmi |
|---|---|---|
| `caddy` | HTTPS, statik fayllar (kabinet va panel), `/api/*` ni API ga uzatadi | **Ha** — 80, 443 |
| `api` | Fastify server | Yoʻq |
| `postgres` | Baza | Yoʻq |
| `redis` | Sessiya, cheklovlar, navbat hodisalari | Yoʻq |
| `minio` | Bemor rasmlari | Yoʻq |
| `migrate` | Bir marta ishlab toʻxtaydi: migratsiyani bajaradi | — |

Bazaning, Redis va MinIO ning portlari **ataylab** tashqariga chiqarilmagan.
Ularga faqat konteyner tarmogʻi ichidan yetish mumkin.

## Birinchi marta koʻtarish

```bash
# 1. Kodni olish
sudo mkdir -p /opt/e-dentist && sudo chown $USER /opt/e-dentist
git clone <repo> /opt/e-dentist
cd /opt/e-dentist

# 2. Muhit fayli
cp .env.prod.example .env
# Parollarni generatsiya qiling va .env ni toʻldiring:
openssl rand -base64 32
nano .env

# 3. Qurish va koʻtarish
docker compose -f docker-compose.prod.yml up -d --build

# 4. Holatini koʻrish
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f api
```

Birinchi soʻrovda Caddy Let's Encrypt dan sertifikat oladi — buning uchun
DNS allaqachon serverga qaragan boʻlishi shart.

## Platforma adminini yaratish

Kabinetdan farqli oʻlaroq, boshqaruv paneli hisobi qoʻlda ochiladi:

```bash
docker compose -f docker-compose.prod.yml exec api \
  npm run admin:create -- pochta@example.com "<kamida 12 belgili parol>" "Ism Familiya"
```

## Yangilash

```bash
cd /opt/e-dentist
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

Migratsiya avtomatik: `migrate` konteyneri API dan **oldin** ishlaydi va
tugaguncha API koʻtarilmaydi. Yaʼni eski kod yangi sxemani koʻrmaydi.

## Toʻxtatish

```bash
docker compose -f docker-compose.prod.yml down      # maʼlumot saqlanadi
docker compose -f docker-compose.prod.yml down -v   # MAʼLUMOT OʻCHADI
```

> `-v` ni serverda hech qachon ishlatmang. Baza, rasmlar va Let's Encrypt
> sertifikatlari shu volumlarda turadi.

## Tekshirish roʻyxati

Koʻtargandan keyin:

- [ ] `https://kabinet.e-dentist.uz` ochiladi va HTTPS yashil
- [ ] Roʻyxatdan oʻtib koʻring — tasdiqlash **xati keldimi** (SMTP ishlayaptimi)
- [ ] `https://admin.e-dentist.uz` ochiladi va admin hisobi kiradi
- [ ] `docker compose -f docker-compose.prod.yml logs api | grep -i error` boʻsh
- [ ] Navbat sahifasi (`/n/<kod>`) ochiladi va raqam jonli yangilanadi (SSE)

## Diqqat

- Lokal `docker-compose.yml` va serverdagi `docker-compose.prod.yml`
  loyiha nomi bir xil (`e-dentist`). Bitta mashinada ikkalasini
  koʻtarmang — konteyner nomlari toʻqnashadi
- `.env` git ga hech qachon tushmaydi
- Zaxira 5.12 da: kunlik `pg_dump` va MinIO nusxasi
