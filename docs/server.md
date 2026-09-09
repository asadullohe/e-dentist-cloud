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

## Serverni tayyorlash (bir marta)

Yangi Hetzner serveri — toza Ubuntu. Unga hech narsa oʻrnatilmagan.

```bash
# Oʻz kompyuteringizda: kalit yasab, serverga qoʻshasiz
ssh-keygen -t ed25519 -C "e-dentist"
ssh-copy-id root@<SERVER_IP>

# Serverda: tayyorlash skripti
ssh root@<SERVER_IP>
curl -fsSL https://raw.githubusercontent.com/<repo>/master/deploy/server-setup.sh -o setup.sh
bash setup.sh
```

Skript nima qiladi: `edentist` foydalanuvchisi, root va parol bilan
kirishni yopish, `ufw` (faqat SSH/80/443), `fail2ban`, avtomatik
xavfsizlik yangilanishlari, 2 GB swap va Docker.

> Skript SSH kaliti yoʻqligini oʻzi tekshiradi va kalitsiz parolni
> yopmaydi — aks holda serverga umuman kira olmay qolardingiz.

## DNS

Domen boshqaruvida (masalan ahost.uz kabinetida) ikkita **A** yozuv:

| Turi | Nomi | Qiymati |
|---|---|---|
| A | `kabinet` | server IP |
| A | `admin` | server IP |

Apex (`e-dentist.uz`) va `www` **tegilmaydi** — ular Netlify'dagi landing
saytiga qaragan (tz.md 13-boʻlim).

Tekshirish (yozuv tarqalgach, odatda 5–30 daqiqa):

```bash
dig +short kabinet.e-dentist.uz
dig +short admin.e-dentist.uz
```

Ikkalasi ham server IP sini qaytarishi kerak. Shundan keyingina Caddy
Let's Encrypt sertifikatini ola oladi.

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

Odatda qoʻlda yangilash kerak emas — `master` ga push qilinganda GitHub
Actions oʻzi chiqaradi (pastga qarang). Qoʻlda kerak boʻlsa:

```bash
cd /opt/e-dentist
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

Migratsiya avtomatik: `migrate` konteyneri API dan **oldin** ishlaydi va
tugaguncha API koʻtarilmaydi. Yaʼni eski kod yangi sxemani koʻrmaydi.

## Avtomatik chiqarish (GitHub Actions)

Tartib: testlar → tasvirlar qurilib GHCR ga yuklanadi → serverda
`docker compose up -d`.

### Bir marta sozlanadi

**1. Serverga chiqarish uchun kalit.** Oʻz kompyuteringizda:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/e-dentist-deploy -C "github-actions" -N ""
ssh-copy-id -i ~/.ssh/e-dentist-deploy.pub edentist@<SERVER_IP>
ssh-keyscan -H <SERVER_IP>          # natijani saqlab qoʻying
```

**2. GitHub → Settings → Secrets and variables → Actions** da toʻrtta secret:

| Nomi | Qiymati |
|---|---|
| `SSH_HOST` | server IP |
| `SSH_USER` | `edentist` |
| `SSH_KEY` | `~/.ssh/e-dentist-deploy` faylining **toʻliq** mazmuni |
| `SSH_KNOWN_HOSTS` | `ssh-keyscan` natijasi |

**3. Serverda GHCR ga kirish.** Tasvirlar shaxsiy boʻlgani uchun server
ularni tortib olishga ruxsat soʻraydi. GitHub da `read:packages` huquqli
token yasang va serverda bir marta:

```bash
echo "<TOKEN>" | docker login ghcr.io -u <GITHUB_FOYDALANUVCHI> --password-stdin
```

**4. `.env` da tasvir nomlari:**

```
IMAGE_API=ghcr.io/<foydalanuvchi>/<repo>-api
IMAGE_WEB=ghcr.io/<foydalanuvchi>/<repo>-web
TAG=latest
```

### Orqaga qaytarish

Chiqarilgan har bir versiya GHCR da commit sha si bilan saqlanadi.

- **GitHub dan:** Actions → Deploy → «Run workflow» → `tag` maydoniga
  oldingi commit sha sini yozasiz
- **Serverdan:** `cd /opt/e-dentist && TAG=<eski-sha> docker compose -f docker-compose.prod.yml up -d`

> Migratsiyalar orqaga qaytmaydi. Sxemani buzadigan oʻzgarish (ustun
> oʻchirish, nom almashtirish) kiritilsa, avval eski kod ham ishlaydigan
> qilib chiqariladi, keyingi chiqarishda esa eskisi olib tashlanadi.

## Zaxira

Kunlik `pg_dump` va bemor rasmlari nusxasi `/opt/e-dentist/backups` da:

```
backups/
├─ db/     edentist-2026-09-09_0320.sql.gz   (30 kun saqlanadi)
└─ files/  MinIO dagi rasmlarning nusxasi
```

### Yoqish (bir marta)

```bash
cd /opt/e-dentist
sudo cp deploy/e-dentist-backup*.service deploy/e-dentist-backup*.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now e-dentist-backup.timer e-dentist-backup-check.timer
systemctl list-timers 'e-dentist-*'
```

Kunlik zaxira 03:20 da, haftalik **tiklash sinovi** dushanba 04:10 da.

### Tiklash sinovi

Sinalmagan zaxira — zaxira emas. `backup-check.sh` oxirgi dumpni
**alohida vaqtinchalik bazaga** tiklaydi, klinika/xodim/bemor sonini va
RLS siyosatlari joyidaligini tekshiradi, keyin oʻsha bazani oʻchiradi.
Haqiqiy bazaga umuman tegmaydi.

```bash
bash deploy/backup-check.sh          # qoʻlda ishga tushirish
journalctl -u e-dentist-backup-check # taymer natijalari
```

### Haqiqiy tiklash

```bash
bash deploy/restore.sh backups/db/edentist-2026-09-09_0320.sql.gz
```

Skript «ha» deb tasdiqlashni soʻraydi, API ni toʻxtatadi, bazani
tiklaydi, ilova roliga huquqlarni qaytaradi va API ni koʻtaradi.

### Boshqa joyga nusxa

tz.md 12-boʻlim haftalik nusxani **boshqa jismoniy joyga** talab qiladi.
`.env` ga `BACKUP_REMOTE` qoʻshsangiz, skript har safar oʻsha manzilga
`rsync` qiladi:

```
BACKUP_REMOTE=zaxira@boshqa-server:/srv/e-dentist/
```

> Zaxirada bemor maʼlumoti bor. Papka `700`, fayllar `600` huquqi bilan
> yaratiladi va maʼlumot qaysi yurisdiksiyada tursa, nusxasi ham **oʻsha
> yurisdiksiyada** boʻlishi kerak.

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
