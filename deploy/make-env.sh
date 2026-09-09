#!/usr/bin/env bash
# Serverdagi `.env` faylini yasaydi: parollarni oʻzi generatsiya qiladi,
# sizdan faqat pochta manzili soʻraladi.
#
#   bash deploy/make-env.sh
#
# Parollar `openssl rand -hex` bilan yasaladi — ichida `@` va `:`
# boʻlmaydi, yaʼni DATABASE_URL buzilmaydi.

set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/opt/e-dentist}"
ENV_FILE="$PROJECT_DIR/.env"
DOMAIN="${DOMAIN:-e-dentist.uz}"

cd "$PROJECT_DIR"

# Mavjud faylni jimgina almashtirmaymiz: ichida ishlab turgan bazaning
# paroli boʻlishi mumkin
if [[ -s "$ENV_FILE" ]]; then
  echo "$ENV_FILE allaqachon bor."
  echo "Uni almashtirsangiz eski parollar yoʻqoladi va ishlab turgan"
  echo "bazaga ulanib boʻlmay qoladi."
  read -rp "Baribir qaytadan yasaymizmi? (ha/yoʻq): " answer
  [[ "$answer" == "ha" ]] || { echo "Bekor qilindi"; exit 1; }
  cp "$ENV_FILE" "$ENV_FILE.eski-$(date +%Y%m%d%H%M)"
  echo "Eskisi saqlandi: $ENV_FILE.eski-*"
fi

read -rp "Pochtangiz (Let's Encrypt shu manzilga yozadi): " ACME_EMAIL
[[ -n "$ACME_EMAIL" ]] || { echo "Pochta boʻsh boʻlmasin" >&2; exit 1; }

PG_PASSWORD="$(openssl rand -hex 24)"
APP_PASSWORD="$(openssl rand -hex 24)"
MINIO_PASSWORD="$(openssl rand -hex 24)"
SESSION="$(openssl rand -hex 32)"

cat > "$ENV_FILE" <<ENV
# Serverdagi muhit. deploy/make-env.sh yasagan — $(date +%Y-%m-%d).
# Bu fayl git ga tushmaydi va nusxasi hech qayerda yoʻq: parollarni
# almashtirish uchun bazani ham yangilash kerak boʻladi.

DOMAIN=$DOMAIN
ACME_EMAIL=$ACME_EMAIL

POSTGRES_USER=edentist
POSTGRES_PASSWORD=$PG_PASSWORD
POSTGRES_DB=edentist
APP_DB_USER=edentist_app
APP_DB_PASSWORD=$APP_PASSWORD

DATABASE_URL=postgresql://edentist:$PG_PASSWORD@postgres:5432/edentist
APP_DATABASE_URL=postgresql://edentist_app:$APP_PASSWORD@postgres:5432/edentist
REDIS_URL=redis://redis:6379

MINIO_ROOT_USER=edentist
MINIO_ROOT_PASSWORD=$MINIO_PASSWORD
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=edentist
S3_SECRET_KEY=$MINIO_PASSWORD
S3_BUCKET=edentist-files

TZ=Asia/Tashkent
SESSION_SECRET=$SESSION
CABINET_URL=https://cabinet.$DOMAIN

# SMTP hozircha sozlanmagan: xat server logiga chiqadi.
#   docker compose -f docker-compose.prod.yml logs api | grep token=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=

TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
ENV

chmod 600 "$ENV_FILE"

echo
echo "Tayyor: $ENV_FILE"
echo "  domen:        $DOMAIN"
echo "  pochta:       $ACME_EMAIL"
echo "  parollar:     yasaldi (faylda, ekranga chiqarilmaydi)"
echo "  SMTP:         sozlanmagan — tasdiqlash havolasi logdan olinadi"
echo
echo "Keyingi qadam:"
echo "  docker compose -f docker-compose.prod.yml up -d --build"
