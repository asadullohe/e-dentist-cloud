-- Tashrifga shifokor bogʻlanadi — ish haqi hisobi uchun (tz.md 15-boʻlim).
-- Eski yozuvlar boʻsh qoladi: kim qilganini keyin taxmin qilib boʻlmaydi
ALTER TABLE "visits" ADD COLUMN "doctor_id" UUID;

CREATE INDEX "visits_clinic_id_doctor_id_date_idx" ON "visits"("clinic_id", "doctor_id", "date");
