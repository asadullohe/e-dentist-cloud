#!/bin/sh
# Garage ni birinchi ishga tushirishda sozlaydi va keyingi safar hech narsa
# qilmaydi (idempotent): tugunga rol, S3 kaliti, bucket va ruxsatlar.
# MinIO da bularning hammasi avtomatik edi — Garage da aniq buyruq kerak.
#
# CLI serverga RPC orqali ulanadi: manzil `garage node id` dan olinadi
# (metadata volume faqat oʻqish uchun ulangan), sir — GARAGE_RPC_SECRET.
set -eu

: "${S3_ACCESS_KEY:?S3_ACCESS_KEY kerak}"
: "${S3_SECRET_KEY:?S3_SECRET_KEY kerak}"
: "${S3_BUCKET:?S3_BUCKET kerak}"
: "${GARAGE_RPC_SECRET:?GARAGE_RPC_SECRET kerak}"

# Server birinchi startda tugun kalitini yozadi — u paydo boʻlguncha kutamiz
i=0
until HOST=$(garage node id -q 2>/dev/null) && [ -n "$HOST" ]; do
  i=$((i + 1))
  [ "$i" -gt 60 ] && { echo "garage tugun kaliti topilmadi" >&2; exit 1; }
  sleep 1
done
NODE_ID=${HOST%%@*}

g() { garage -h "$HOST" "$@"; }

i=0
until g status >/dev/null 2>&1; do
  i=$((i + 1))
  [ "$i" -gt 60 ] && { echo "garage RPC javob bermadi" >&2; exit 1; }
  sleep 1
done

# 1. Tugun roli: bitta zona, sigʻim faqat vazn uchun (bitta tugunda maʼnosi yoʻq)
if g status | grep -q 'NO ROLE ASSIGNED'; then
  echo "garage: tugunga rol beriladi"
  g layout assign -z dc1 -c "${GARAGE_CAPACITY:-50G}" "$NODE_ID"
  g layout apply --version 1
fi

# 2. S3 kaliti — .env dagi bilan bir xil, API oʻzgarishsiz ulanadi
if ! g key info "$S3_ACCESS_KEY" >/dev/null 2>&1; then
  echo "garage: S3 kaliti import qilinadi"
  g key import -n edentist --yes "$S3_ACCESS_KEY" "$S3_SECRET_KEY"
fi
# Testlar oʻz bucketini S3 orqali yaratadi (ensureBucket)
g key allow --create-bucket "$S3_ACCESS_KEY" >/dev/null

# 3. Asosiy bucket va ruxsatlar
if ! g bucket info "$S3_BUCKET" >/dev/null 2>&1; then
  echo "garage: bucket yaratiladi — $S3_BUCKET"
  g bucket create "$S3_BUCKET"
fi
g bucket allow --read --write --owner "$S3_BUCKET" --key "$S3_ACCESS_KEY" >/dev/null

echo "garage: tayyor"
