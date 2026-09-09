# Birinchi marta serverga chiqarish

Bir marta bajariladigan yoʻl: boʻsh Hetzner serveridan ishlaydigan
saytgacha. Har qadamda **nima uchun**, **buyruq** va **kutilgan natija**
bor.

Kerak boʻladi: Hetzner serveri (Ubuntu 24.04), Cloudflare hisobi, ahost
kabineti, oʻz kompyuteringizdagi terminal.

Quyida `<SERVER_IP>` — Hetzner panelidagi server manzili,
`<GITHUB_FOYDALANUVCHI>` — sizning GitHub nomingiz.

---

## 1. Kodni GitHub ga yuborish

**Nega:** server kodni GitHub dan klonlaydi. Yuborilmagan kod serverga
tushmaydi.

```bash
cd ~/Documents/projects/e-dentist-cloud
git checkout master
git merge --no-ff bosqich-5-panel-chiqarish -m "Bosqich 5 — boshqaruv paneli va chiqarish"
git push origin master
```

**Kutilgan natija:** `git log origin/master --oneline -1` oxirgi commitni
koʻrsatadi.

**Xato: `Permission denied`** — GitHub ga kirish sozlanmagan. `gh auth login`
yoki SSH kalit orqali kiring.

---

## 2. Server uchun GitHub kaliti (deploy key)

**Nega:** repozitoriya yopiq, server uni klonlash uchun ruxsat soʻraydi.
Deploy key — faqat shu repoga, faqat oʻqish huquqi bilan.

Serverda kalit yasaymiz:

```bash
ssh root@<SERVER_IP>
ssh-keygen -t ed25519 -f ~/.ssh/github -N "" -C "e-dentist-server"
cat ~/.ssh/github.pub
```

Chiqqan qatorni nusxalab, GitHub da:
**repo → Settings → Deploy keys → Add deploy key** → nom: `server`,
kalit: nusxalangan qator, «Allow write access» — **belgilanmaydi**.

Serverda SSH ga shu kalitni koʻrsatamiz:

```bash
cat >> ~/.ssh/config <<'CFG'
Host github.com
  IdentityFile ~/.ssh/github
  IdentitiesOnly yes
CFG
ssh -T git@github.com
```

**Kutilgan natija:** `Hi <foydalanuvchi>/e-dentist-cloud! You've successfully
authenticated...`

---

## 3. Serverni tayyorlash

**Nega:** yangi server ochiq va himoyasiz: root parol bilan kiriladi,
firewall yoʻq, Docker yoʻq.

Oʻz kompyuteringizda (server ichida emas):

```bash
# Kalitingiz yoʻq boʻlsa
ssh-keygen -t ed25519 -C "e-dentist"
ssh-copy-id root@<SERVER_IP>

# Tayyorlash skriptini yuboramiz
cd ~/Documents/projects/e-dentist-cloud
scp deploy/server-setup.sh root@<SERVER_IP>:/root/
ssh root@<SERVER_IP> "bash /root/server-setup.sh"
```

**Kutilgan natija:** oxirida «Tayyor» va tekshirish buyruqlari.

> Skript SSH orqali terminalsiz ishga tushsa parol soʻray olmaydi va
> `sudo` ni **parolsiz** qilib qoʻyadi (buzuq sudo bilan qoldirgandan
> koʻra shunisi maʼqul). Qatʼiyroq variantni xohlasangiz, root
> sessiyangizda:
>
> ```bash
> passwd edentist
> rm /etc/sudoers.d/edentist
> ```
>
> Bu parol faqat `sudo` uchun kerak: SSH ga parol bilan kirish yopilgan,
> shuning uchun u tashqi hujum yuzasi emas — aksincha, kalit oʻgʻirlansa
> root huquqiga oʻtishga toʻsiq boʻladi.

Skript: `edentist` foydalanuvchisi · root va parol bilan kirish yopiladi ·
`ufw` (faqat SSH, 80, 443) · `fail2ban` · avtomatik yangilanishlar ·
2 GB swap · Docker.

**Tekshiring** (eski oynani yopmasdan, yangi oynada):

```bash
ssh -t edentist@<SERVER_IP> "docker --version && sudo ufw status | head -5"
```

`-t` kerak: `sudo` parol soʻrash uchun terminal talab qiladi.

**Xato: kirolmadingiz** — eski oyna hali ochiq, Hetzner konsolidan ham
kirish mumkin. Sozlamani `/etc/ssh/sshd_config.d/99-e-dentist.conf` dan
tuzatasiz.

---

## 4. Cloudflare va DNS

**Nega:** brauzer `cabinet.e-dentist.uz` ni server IP siga aylantirishi
kerak, HTTPS esa shu nom uchun olinadi.

Cloudflare → DNS → Records:

| Turi | Nomi | Qiymati | Proxy |
|---|---|---|---|
| A | `@` | `<SERVER_IP>` | Proxied |
| A | `www` | `<SERVER_IP>` | Proxied |
| A | `cabinet` | `<SERVER_IP>` | Proxied |
| A | `admin` | `<SERVER_IP>` | Proxied |

- `www` ning eski **CNAME** yozuvi (`e-dentist.netlify.app`) oʻchiriladi
- Pochta ishlatilmaydi: eski **MX** va SPF **TXT** yozuvlarini oʻchirsa
  boʻladi. SMTP qoʻshilganda yangilari yoziladi

Keyin ahost kabinetida **NS** larni Cloudflare bergan ikkitasiga
almashtirasiz. Tarqalishi 1–2 soat.

Cloudflare sozlamalari:

| Boʻlim | Qiymat |
|---|---|
| SSL/TLS → Overview | **Full (strict)** |
| Speed → Optimization → Rocket Loader | **oʻchiq** |
| Caching → Cache Rules | `/api/*` → **Bypass cache** |

**Tekshirish:**

```bash
dig +short NS e-dentist.uz          # cloudflare.com chiqishi kerak
dig +short cabinet.e-dentist.uz     # Cloudflare IP lari
```

---

## 5. Kodni serverga olish va sozlash

```bash
ssh edentist@<SERVER_IP>
git clone git@github.com:<GITHUB_FOYDALANUVCHI>/e-dentist-cloud.git /opt/e-dentist
cd /opt/e-dentist
cp .env.prod.example .env
```

`.env` ni skript yasaydi — parollar oʻzi generatsiya qilinadi, sizdan
faqat pochta soʻraladi:

```bash
bash deploy/make-env.sh
```

**Kutilgan natija:** «Tayyor: /opt/e-dentist/.env» va sozlamalar
xulosasi. Parollar ekranga chiqarilmaydi.

Tekshirish:

```bash
grep -E '^(DOMAIN|ACME_EMAIL|CABINET_URL|SMTP_HOST)=' .env
```

> `.env` ning nusxasi hech qayerda yoʻq va git ga tushmaydi. Uni
> yoʻqotsangiz bazadagi parollarni ham almashtirish kerak boʻladi.

---

## 6. Koʻtarish

**Nega:** birinchi safar tasvirlar serverning oʻzida quriladi (5–10
daqiqa). Keyinchalik GitHub Actions tayyor tasvir beradi.

```bash
cd /opt/e-dentist
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
```

**Kutilgan natija:** `postgres`, `redis`, `minio`, `api`, `caddy` —
`Up (healthy)`; `migrate` — `Exited (0)`.

**Xato: `api` qayta-qayta ishga tushyapti** —
`docker compose -f docker-compose.prod.yml logs api` ga qarang. Odatda
`.env` dagi parol yoki manzil xato.

---

## 7. Boshqaruv paneli hisobini ochish

```bash
docker compose -f docker-compose.prod.yml exec api \
  npm run admin:create -- <pochta> "<kamida 12 belgili parol>" "Ism Familiya"
```

---

## 8. Zaxira taymerlarini yoqish

```bash
cd /opt/e-dentist
sudo cp deploy/e-dentist-backup*.service deploy/e-dentist-backup*.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now e-dentist-backup.timer e-dentist-backup-check.timer

# Darhol bir marta sinab koʻramiz
bash deploy/backup.sh
bash deploy/backup-check.sh
```

**Kutilgan natija:** «Zaxira tiklandi va tekshiruvdan oʻtdi.»

---

## 9. Tekshirish roʻyxati

- [ ] `https://e-dentist.uz` — landing ochiladi
- [ ] `https://www.e-dentist.uz` — apex ga yoʻnaltiradi
- [ ] `https://cabinet.e-dentist.uz` — kirish oynasi, HTTPS yashil
- [ ] `https://admin.e-dentist.uz` — panelga kirasiz
- [ ] Kabinetda roʻyxatdan oʻting, keyin serverda:
      `docker compose -f docker-compose.prod.yml logs api | grep token=` —
      tasdiqlash havolasi chiqadi, uni brauzerda ochasiz
- [ ] Navbat sahifasi ochiladi va raqam beriladi
- [ ] `docker compose -f docker-compose.prod.yml logs api | grep -i error` boʻsh

---

## 10. Keyingi safar — avtomatik

GitHub Actions ni yoqsangiz, `master` ga har push oʻzi chiqaradi.
Secretlar va GHCR login — `docs/server.md` dagi «Avtomatik chiqarish»
boʻlimida.

Qoʻlda yangilash esa har doim ishlaydi:

```bash
cd /opt/e-dentist && git pull && docker compose -f docker-compose.prod.yml up -d --build
```
