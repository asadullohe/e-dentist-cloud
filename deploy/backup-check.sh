#!/usr/bin/env bash
# Zaxirani sinash: oxirgi dump vaqtinchalik bazaga tiklanadi va
# tekshiriladi. Sinalmagan zaxira — zaxira emas (tz.md 12-boʻlim).
#
#   bash deploy/backup-check.sh
#
# Haqiqiy bazaga tegmaydi: alohida `edentist_zaxira_sinov` bazasi
# yaratiladi va tekshiruvdan keyin oʻchiriladi.

set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/opt/e-dentist}"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
TEST_DB="edentist_zaxira_sinov"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
# shellcheck disable=SC1091
. "$SCRIPT_DIR/env.sh"
load_env ./.env

compose() { docker compose -f "$COMPOSE_FILE" "$@"; }
psql_root() {
  compose exec -T postgres psql --username "$POSTGRES_USER" --dbname postgres -v ON_ERROR_STOP=1 "$@"
}

DUMP="$(find "$BACKUP_DIR/db" -name 'edentist-*.sql.gz' -type f | sort | tail -1)"
[[ -n "$DUMP" ]] || { echo "Zaxira topilmadi: $BACKUP_DIR/db" >&2; exit 1; }

# Dump kechagidan eski boʻlsa — taymer ishlamayapti
if [[ -n "$(find "$DUMP" -mtime +1)" ]]; then
  echo "OGOHLANTIRISH: oxirgi zaxira bir kundan eski: $DUMP" >&2
fi

echo "──> Sinov bazasi tayyorlanmoqda: $TEST_DB"
psql_root -c "DROP DATABASE IF EXISTS $TEST_DB" >/dev/null
psql_root -c "CREATE DATABASE $TEST_DB" >/dev/null

echo "──> Tiklanmoqda: $(basename "$DUMP")"
gunzip -c "$DUMP" | compose exec -T postgres psql \
  --username "$POSTGRES_USER" --dbname "$TEST_DB" -v ON_ERROR_STOP=1 --quiet

echo "──> Tekshiruv"
RESULT="$(compose exec -T postgres psql --username "$POSTGRES_USER" --dbname "$TEST_DB" -tA <<'SQL'
SELECT
  (SELECT count(*) FROM clinics),
  (SELECT count(*) FROM users),
  (SELECT count(*) FROM patients),
  (SELECT count(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL),
  -- RLS siyosatlari ham tiklandimi: ularsiz baza ochiq qoladi
  (SELECT count(*) FROM pg_policies WHERE schemaname = 'public');
SQL
)"
IFS='|' read -r clinics users patients migrations policies <<< "$RESULT"

echo "    klinikalar: $clinics · xodimlar: $users · bemorlar: $patients"
echo "    migratsiyalar: $migrations · RLS siyosatlari: $policies"

psql_root -c "DROP DATABASE $TEST_DB" >/dev/null

# Klinika ham, migratsiya ham, siyosat ham boʻlishi shart
if [[ "$clinics" -lt 1 || "$migrations" -lt 1 || "$policies" -lt 10 ]]; then
  echo "ZAXIRA YAROQSIZ: kutilgan maʼlumot topilmadi" >&2
  exit 1
fi

echo "Zaxira tiklandi va tekshiruvdan oʻtdi."
