#!/usr/bin/env bash
# Zaxiradan tiklash.
#
#   bash deploy/restore.sh backups/db/edentist-2026-09-09_0320.sql.gz
#
# DIQQAT: bu buyruq joriy bazani almashtiradi. Skript tasdiq soʻraydi.

set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/opt/e-dentist}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
DUMP="${1:-}"

if [[ -z "$DUMP" || ! -f "$DUMP" ]]; then
  echo "Foydalanish: bash restore.sh <dump-fayli.sql.gz>" >&2
  exit 1
fi

cd "$PROJECT_DIR"
# shellcheck disable=SC1091
set -a && . ./.env && set +a

compose() { docker compose -f "$COMPOSE_FILE" "$@"; }

cat <<MSG

Tiklanadigan fayl: $DUMP
Baza:              $POSTGRES_DB

Joriy maʼlumot OʻCHADI va uning oʻrniga shu fayl yoziladi.
Davom etish uchun «ha» deb yozing:
MSG
read -r answer
[[ "$answer" == "ha" ]] || { echo "Bekor qilindi"; exit 1; }

# API ni toʻxtatamiz: tiklash paytida yozuv kelmasin
echo "──> API toʻxtatilmoqda"
compose stop api

echo "──> Tiklanmoqda"
gunzip -c "$DUMP" | compose exec -T postgres psql \
  --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -v ON_ERROR_STOP=1 --quiet

echo "──> Ilova roli huquqlari qayta beriladi"
# Dump `--no-owner` bilan olingan: jadval egasi oʻzgarishi mumkin,
# shuning uchun RLS ostidagi ilova roliga huquqlar qaytariladi
compose exec -T postgres psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -v ON_ERROR_STOP=1 <<SQL
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO $APP_DB_USER;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO $APP_DB_USER;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO $APP_DB_USER;
SQL

echo "──> API qayta ishga tushmoqda"
compose up -d api

echo "Tayyor. Tekshiring: kabinetga kirib bir nechta bemorni oching."
