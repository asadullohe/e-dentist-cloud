#!/bin/bash
# Postgres birinchi marta koʻtarilganda ishlaydi (docker-entrypoint-initdb.d).
# Mavjud bazaga qoʻlda qoʻllash uchun: npm run db:app-role
#
# SQL fayl ataylab `.psql` kengaytmasi bilan: entrypoint init papkasidagi
# HAR BIR `.sql` faylni oʻzi ham yuritadi, oʻzgaruvchilarsiz. U holda
# `:'app_user'` sintaksis xatosi berib, konteyner init paytida oʻlardi.
set -euo pipefail

: "${APP_DB_USER:?APP_DB_USER berilmagan}"
: "${APP_DB_PASSWORD:?APP_DB_PASSWORD berilmagan}"

psql -v ON_ERROR_STOP=1 \
  -v app_user="$APP_DB_USER" \
  -v app_password="$APP_DB_PASSWORD" \
  --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -f /docker-entrypoint-initdb.d/01-app-role.psql
