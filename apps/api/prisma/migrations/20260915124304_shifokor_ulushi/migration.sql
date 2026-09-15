-- Shifokor ulushi tashrifda snapshot: foiz va summa (tz.md 15-boʻlim).
-- Eski yozuvlarda nol — shifokor ham yoʻq edi. Kerak boʻlsa «Ish haqi»
-- sahifasidagi «Qayta hisoblash» joriy foizni yozadi
ALTER TABLE "visits" ADD COLUMN "doctor_percent" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "visits" ADD COLUMN "doctor_share" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "visits" ADD CONSTRAINT "visits_doctor_percent_check" CHECK ("doctor_percent" BETWEEN 0 AND 100);
