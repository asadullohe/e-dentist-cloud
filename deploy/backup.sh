#!/usr/bin/env bash
# Kunlik zaxira: baza dumpi va bemor rasmlari.
#
# Ishlatish (serverda):
#   bash /opt/e-dentist/deploy/backup.sh
#
# Odatda qoʻlda chaqirilmaydi — systemd taymeri kuniga bir marta
# ishga tushiradi (deploy/e-dentist-backup.timer).
#
# Sozlash (muhit oʻzgaruvchilari orqali):
#   PROJECT_DIR    loyiha papkasi (sukut: /opt/e-dentist)
#   BACKUP_DIR     zaxira papkasi (sukut: /opt/e-dentist/backups)
#   KEEP_DAYS      necha kun saqlanadi (sukut: 30)
#   COMPOSE_FILE   compose fayli (sukut: docker-compose.prod.yml)

set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/opt/e-dentist}"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
KEEP_DAYS="${KEEP_DAYS:-30}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
# shellcheck disable=SC1091
. "$SCRIPT_DIR/env.sh"
load_env ./.env

STAMP="$(date +%Y-%m-%d_%H%M)"
DUMP_DIR="$BACKUP_DIR/db"
FILES_DIR="$BACKUP_DIR/files"

# Zaxirada bemor maʼlumoti bor — papkani boshqalar oʻqiy olmasin
install -d -m 700 "$DUMP_DIR" "$FILES_DIR"

compose() { docker compose -f "$COMPOSE_FILE" "$@"; }

echo "[$(date +%H:%M:%S)] baza dumpi boshlandi"
DUMP_FILE="$DUMP_DIR/edentist-$STAMP.sql.gz"

# --clean --if-exists: dump ni tiklashda avval eski obyektlar oʻchadi.
# Avval vaqtinchalik nomga yozamiz — yarim yozilgan fayl «zaxira» boʻlib
# qolib ketmasin
compose exec -T postgres pg_dump \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" \
  --clean --if-exists --no-owner \
  | gzip -9 > "$DUMP_FILE.qismi"

mv "$DUMP_FILE.qismi" "$DUMP_FILE"
chmod 600 "$DUMP_FILE"
echo "[$(date +%H:%M:%S)] dump tayyor: $(du -h "$DUMP_FILE" | cut -f1)"

echo "[$(date +%H:%M:%S)] rasmlar nusxalanmoqda"
# `mc mirror` faqat oʻzgargan fayllarni koʻchiradi. Alias muhit
# oʻzgaruvchisi orqali beriladi — konfiguratsiya fayli kerak emas
NETWORK="$(compose ps --format '{{.Name}}' | head -1 | xargs -r docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{end}}')"
docker run --rm \
  --network "$NETWORK" \
  -e "MC_HOST_ed=http://$MINIO_ROOT_USER:$MINIO_ROOT_PASSWORD@minio:9000" \
  -v "$FILES_DIR:/backup" \
  minio/mc:latest mirror --overwrite --quiet "ed/$S3_BUCKET" /backup
echo "[$(date +%H:%M:%S)] rasmlar tayyor: $(du -sh "$FILES_DIR" | cut -f1)"

echo "[$(date +%H:%M:%S)] eski dumplar tozalanmoqda (>$KEEP_DAYS kun)"
find "$DUMP_DIR" -name 'edentist-*.sql.gz' -mtime "+$KEEP_DAYS" -print -delete

# Boshqa jismoniy joyga nusxa — tz.md 12-boʻlim talabi.
# BACKUP_REMOTE berilmasa oʻtkazib yuboriladi
if [[ -n "${BACKUP_REMOTE:-}" ]]; then
  echo "[$(date +%H:%M:%S)] tashqi nusxa: $BACKUP_REMOTE"
  rsync -az --delete "$BACKUP_DIR/" "$BACKUP_REMOTE"
fi

echo "[$(date +%H:%M:%S)] tayyor. Jami: $(du -sh "$BACKUP_DIR" | cut -f1)"
