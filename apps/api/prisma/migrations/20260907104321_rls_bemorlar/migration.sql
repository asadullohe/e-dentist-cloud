-- Bosqich 2 jadvallariga RLS siyosatlari.
--
-- Yangi jadval qoʻshilganda ikki joyni yangilash SHART:
--   1. shu yerda — Postgres siyosati
--   2. platform/tenant.ts dagi TENANT_MODELS — repozitoriya qatlami
--
-- Bittasi unutilsa himoya bir qatlamga tushib qoladi, lekin hech qanday
-- xato koʻrinmaydi. Shuning uchun har modulda «A klinikaning sessiyasi
-- bilan B ning yozuvi» testi majburiy (tz.md 5-boʻlim).

ALTER TABLE "patients" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "patients_ijarachi" ON "patients"
  FOR ALL
  USING (clinic_id = app_clinic_id())
  WITH CHECK (clinic_id = app_clinic_id());

ALTER TABLE "visits" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "visits_ijarachi" ON "visits"
  FOR ALL
  USING (clinic_id = app_clinic_id())
  WITH CHECK (clinic_id = app_clinic_id());

ALTER TABLE "teeth" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teeth_ijarachi" ON "teeth"
  FOR ALL
  USING (clinic_id = app_clinic_id())
  WITH CHECK (clinic_id = app_clinic_id());

ALTER TABLE "bridges" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bridges_ijarachi" ON "bridges"
  FOR ALL
  USING (clinic_id = app_clinic_id())
  WITH CHECK (clinic_id = app_clinic_id());

ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_ijarachi" ON "payments"
  FOR ALL
  USING (clinic_id = app_clinic_id())
  WITH CHECK (clinic_id = app_clinic_id());

ALTER TABLE "appointments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "appointments_ijarachi" ON "appointments"
  FOR ALL
  USING (clinic_id = app_clinic_id())
  WITH CHECK (clinic_id = app_clinic_id());

ALTER TABLE "services" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "services_ijarachi" ON "services"
  FOR ALL
  USING (clinic_id = app_clinic_id())
  WITH CHECK (clinic_id = app_clinic_id());

ALTER TABLE "images" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "images_ijarachi" ON "images"
  FOR ALL
  USING (clinic_id = app_clinic_id())
  WITH CHECK (clinic_id = app_clinic_id());
