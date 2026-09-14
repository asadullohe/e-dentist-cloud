#!/usr/bin/env bash
# API ni MinIO dan Garage ga oʻtkazadi (reja 8.3, 2-qadam).
#
#   bash deploy/garage-switch.sh
#
# Avval deploy/garage-migrate.sh muvaffaqiyatli tugagan boʻlishi shart.
# .env da S3_* Garage ga koʻrsatiladi (eskisi .env.minio-<sana> da qoladi),
# faqat `api` konteyneri qayta ishga tushadi — ~20 soniya uzilish.
# MinIO va uning maʼlumoti tegilmaydi: orqaga qaytish — eski .env ni
# qaytarib `up -d api`.

set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/opt/e-dentist}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

cd "$PROJECT_DIR"
# shellcheck source=deploy/env.sh
. "$PROJECT_DIR/deploy/env.sh"
load_env ./.env

: "${GARAGE_ACCESS_KEY:?.env da GARAGE_ACCESS_KEY yoʻq}"
: "${GARAGE_SECRET_KEY:?.env da GARAGE_SECRET_KEY yoʻq}"

compose() { docker compose -f "$COMPOSE_FILE" "$@"; }

if [[ "${S3_ENDPOINT:-}" == "http://garage:3900" ]]; then
  echo "API allaqachon Garage da (S3_ENDPOINT=$S3_ENDPOINT)"; exit 0
fi

BACKUP=".env.minio-$(date +%Y%m%d%H%M)"
cp .env "$BACKUP"
chmod 600 "$BACKUP"
echo "eski .env saqlandi: $BACKUP"

# Qatorni almashtiradi, yoʻq boʻlsa oxiriga qoʻshadi. `sed -i` emas —
# GNU va BSD sed da farq qiladi; awk hamma joyda bir xil
setvar() {
  local key="$1" value="$2"
  awk -v k="$key" -v v="$value" '
    index($0, k "=") == 1 { print k "=" v; done = 1; next }
    { print }
    END { if (!done) print k "=" v }
  ' .env > .env.yangi
  chmod 600 .env.yangi
  mv .env.yangi .env
}

setvar S3_ENDPOINT "http://garage:3900"
setvar S3_REGION "garage"
setvar S3_ACCESS_KEY "$GARAGE_ACCESS_KEY"
setvar S3_SECRET_KEY "$GARAGE_SECRET_KEY"

echo "[$(date +%H:%M:%S)] api qayta ishga tushirilmoqda…"
compose up -d api

for i in $(seq 1 30); do
  status="$(compose ps --format '{{.Service}} {{.Health}}' | awk '$1=="api"{print $2}')"
  if [[ "$status" == "healthy" ]]; then
    echo "[$(date +%H:%M:%S)] API Garage bilan ishlayapti"
    echo
    echo "Tekshiring: kabinetda bemor rasmi va klinika logotipi ochilsinmi."
    echo "Hammasi joyida boʻlsa — keyingi push MinIO ni olib tashlaydi."
    exit 0
  fi
  sleep 5
done

echo "API koʻtarilmadi. Orqaga qaytish:" >&2
echo "  cp $BACKUP .env && docker compose -f $COMPOSE_FILE up -d api" >&2
compose logs --tail 60 api >&2
exit 1
