#!/usr/bin/env bash
# MinIO dagi rasmlarni Garage ga koʻchiradi (reja 8.3, 1-qadam).
#
#   bash deploy/garage-migrate.sh
#
# Ikkala ombor ham ishlab turadi, API hali MinIO da — sayt uzilmaydi.
# Bir necha marta ishga tushirish mumkin: `mc mirror` faqat yangi va
# oʻzgargan fayllarni koʻchiradi. Oxirida obyektlar soni solishtiriladi.
#
# Kutadi: .env da GARAGE_ACCESS_KEY va GARAGE_SECRET_KEY (garage-init shu
# kalitni import qilgan) hamda MINIO_ROOT_USER / MINIO_ROOT_PASSWORD.

set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/opt/e-dentist}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
MC_IMAGE="quay.io/minio/mc:RELEASE.2025-08-13T08-35-41Z"

cd "$PROJECT_DIR"
# shellcheck source=deploy/env.sh
. "$PROJECT_DIR/deploy/env.sh"
load_env ./.env

: "${GARAGE_ACCESS_KEY:?.env da GARAGE_ACCESS_KEY yoʻq}"
: "${GARAGE_SECRET_KEY:?.env da GARAGE_SECRET_KEY yoʻq}"
: "${MINIO_ROOT_USER:?}" "${MINIO_ROOT_PASSWORD:?}" "${S3_BUCKET:?}"

compose() { docker compose -f "$COMPOSE_FILE" "$@"; }

for service in garage minio; do
  state="$(compose ps --format '{{.Service}} {{.Health}}' | awk -v s="$service" '$1==s{print $2}')"
  [[ "$state" == "healthy" ]] || { echo "$service sogʻlom emas: '${state:-yoʻq}'" >&2; exit 1; }
done

NETWORK="$(compose ps --format '{{.Name}}' | head -1 | xargs -r docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{end}}')"

mc() {
  docker run --rm --network "$NETWORK" \
    -e "MC_HOST_old=http://$MINIO_ROOT_USER:$MINIO_ROOT_PASSWORD@minio:9000" \
    -e "MC_HOST_new=http://$GARAGE_ACCESS_KEY:$GARAGE_SECRET_KEY@garage:3900" \
    "$MC_IMAGE" "$@"
}

count() { mc ls -r "$1/$S3_BUCKET" 2>/dev/null | wc -l | tr -d ' '; }

echo "[$(date +%H:%M:%S)] MinIO da: $(count old) ta obyekt"
echo "[$(date +%H:%M:%S)] koʻchirilmoqda…"
mc mirror --overwrite --quiet "old/$S3_BUCKET" "new/$S3_BUCKET"

OLD="$(count old)"; NEW="$(count new)"
echo "[$(date +%H:%M:%S)] MinIO: $OLD · Garage: $NEW"
if [[ "$OLD" != "$NEW" ]]; then
  echo "Soni mos emas — skriptni qayta ishga tushiring, baribir farq qolsa API ni oʻtkazmang" >&2
  exit 1
fi

echo
echo "Hammasi koʻchdi. Keyingi qadam — API ni Garage ga oʻtkazish:"
echo "  bash deploy/garage-switch.sh"
