-- Bemorga biriktirilgan shifokor (tz.md 14-boʻlim). Ixtiyoriy: eski
-- bemorlarda boʻsh, qabulxona kartochkadan belgilaydi
ALTER TABLE "patients" ADD COLUMN "doctor_id" UUID;

CREATE INDEX "patients_clinic_id_doctor_id_idx" ON "patients"("clinic_id", "doctor_id");
