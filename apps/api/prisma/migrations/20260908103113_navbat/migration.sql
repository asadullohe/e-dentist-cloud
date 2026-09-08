-- Navbat (tz.md 14-boʻlim). Ikkita parallel tizim qurilmaydi: navbat —
-- «bugungi, vaqti belgilanmagan qabul», shuning uchun ustunlar mavjud
-- `appointments` jadvaliga qoʻshiladi.

-- ── Klinika kodi ──────────────────────────────────────────────────────────
-- Avval boʻsh qoldiriladi, mavjud klinikalarga kod tarqatiladi, keyin
-- majburiy qilinadi — aks holda migratsiya bor maʼlumotda yiqiladi
ALTER TABLE "clinics" ADD COLUMN "queue_code" TEXT;
ALTER TABLE "clinics" ADD COLUMN "queue_enabled" BOOLEAN NOT NULL DEFAULT true;

UPDATE "clinics"
SET "queue_code" = substr(md5(random()::text || id::text), 1, 8)
WHERE "queue_code" IS NULL;

ALTER TABLE "clinics" ALTER COLUMN "queue_code" SET NOT NULL;
CREATE UNIQUE INDEX "clinics_queue_code_key" ON "clinics"("queue_code");

-- ── Navbat holati ─────────────────────────────────────────────────────────
CREATE TYPE "QueueStatus" AS ENUM ('unconfirmed', 'waiting', 'called', 'finished');

-- ── Qabul yozuvi ──────────────────────────────────────────────────────────
-- Ochiq sahifadan yozilgan odam kartotekada boʻlmasligi mumkin: qabulxona
-- tasdiqlaganda bogʻlanadi. Shuning uchun patient_id boʻsh boʻla oladi
ALTER TABLE "appointments" ALTER COLUMN "patient_id" DROP NOT NULL;
ALTER TABLE "appointments" ADD COLUMN "doctor_id" UUID;
ALTER TABLE "appointments" ADD COLUMN "queue_number" INTEGER;
ALTER TABLE "appointments" ADD COLUMN "queue_status" "QueueStatus";
ALTER TABLE "appointments" ADD COLUMN "guest_name" TEXT;
ALTER TABLE "appointments" ADD COLUMN "guest_phone" TEXT;

CREATE INDEX "appointments_clinic_id_queue_status_queue_number_idx"
  ON "appointments"("clinic_id", "queue_status", "queue_number");
