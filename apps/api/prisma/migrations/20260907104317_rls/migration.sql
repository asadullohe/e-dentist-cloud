-- Koʻp ijarachilikning ikkinchi himoya qatlami: Postgres RLS.
--
-- Birinchi qatlam — repozitoriya qatlami (platform/tenant.ts) — har soʻrovga
-- clinicId ni avtomatik qoʻshadi. Lekin u dastur ichida: kimdir xom SQL yozsa
-- yoki kengaytmani chetlab oʻtsa, himoya qolmaydi. RLS bazaning oʻzida turadi.
--
-- Diqqat: siyosatlar faqat superuser BOʻLMAGAN rolga taʼsir qiladi. API
-- edentist_app bilan ulanadi (docker/postgres/init/01-app-role.sql), migratsiya
-- va seed esa egasi bilan — ularga RLS taʼsir qilmaydi, shu bilan ular ishlaydi.

-- Sessiya oʻzgaruvchisini oʻqiydi. Oʻrnatilmagan boʻlsa NULL qaytaradi —
-- shunda hech bir qator mos kelmaydi. Yaʼni «kontekst yoʻq» = «hech narsa
-- koʻrinmaydi», teskarisi emas
CREATE OR REPLACE FUNCTION app_clinic_id() RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(current_setting('app.clinic_id', true), '')::uuid
$$;

-- Klinikaning oʻzi: ijarachi ustuni — id
ALTER TABLE "clinics" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clinics_ijarachi" ON "clinics"
  FOR ALL
  USING (id = app_clinic_id())
  WITH CHECK (id = app_clinic_id());

-- Qolgan jadvallarda — clinic_id.
-- clinic_id NULL boʻlgan qatorlar (platforma admini, tizim yozuvlari) hech bir
-- klinika sessiyasida koʻrinmaydi: NULL = uuid hech qachon rost boʻlmaydi
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_ijarachi" ON "users"
  FOR ALL
  USING (clinic_id = app_clinic_id())
  WITH CHECK (clinic_id = app_clinic_id());

ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roles_ijarachi" ON "roles"
  FOR ALL
  USING (clinic_id = app_clinic_id())
  WITH CHECK (clinic_id = app_clinic_id());

ALTER TABLE "invites" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invites_ijarachi" ON "invites"
  FOR ALL
  USING (clinic_id = app_clinic_id())
  WITH CHECK (clinic_id = app_clinic_id());

ALTER TABLE "audit_log" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_log_ijarachi" ON "audit_log"
  FOR ALL
  USING (clinic_id = app_clinic_id())
  WITH CHECK (clinic_id = app_clinic_id());
