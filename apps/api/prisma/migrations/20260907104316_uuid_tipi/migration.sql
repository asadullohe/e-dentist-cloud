-- Identifikatorlar TEXT dan haqiqiy uuid tipiga oʻtkaziladi.
--
-- Sabab: RLS siyosatlari `clinic_id = app_clinic_id()` koʻrinishida solishtiradi,
-- Postgres esa text va uuid ni oʻzaro solishtira olmaydi. Ustiga uuid tipi
-- 16 bayt (text — 36), indeks kichikroq va qiymat bazaning oʻzida tekshiriladi.
--
-- Prisma bu oʻtishni oʻzi yoza olmaydi («no cast exists»), lekin text→uuid
-- oʻtishi xavfsiz: barcha qiymatlar allaqachon uuid koʻrinishida.
-- audit_log.entity_id TEXT boʻlib qoladi — u turli obyektlarga ishora qiladi
-- va hammasining identifikatori uuid boʻlishi shart emas.

ALTER TABLE "audit_log" DROP CONSTRAINT "audit_log_clinic_id_fkey";
ALTER TABLE "invites"   DROP CONSTRAINT "invites_clinic_id_fkey";
ALTER TABLE "invites"   DROP CONSTRAINT "invites_role_id_fkey";
ALTER TABLE "roles"     DROP CONSTRAINT "roles_clinic_id_fkey";
ALTER TABLE "users"     DROP CONSTRAINT "users_clinic_id_fkey";
ALTER TABLE "users"     DROP CONSTRAINT "users_role_id_fkey";

ALTER TABLE "clinics"   ALTER COLUMN "id"        SET DATA TYPE uuid USING "id"::uuid;
ALTER TABLE "roles"     ALTER COLUMN "id"        SET DATA TYPE uuid USING "id"::uuid;
ALTER TABLE "roles"     ALTER COLUMN "clinic_id" SET DATA TYPE uuid USING "clinic_id"::uuid;
ALTER TABLE "users"     ALTER COLUMN "id"        SET DATA TYPE uuid USING "id"::uuid;
ALTER TABLE "users"     ALTER COLUMN "clinic_id" SET DATA TYPE uuid USING "clinic_id"::uuid;
ALTER TABLE "users"     ALTER COLUMN "role_id"   SET DATA TYPE uuid USING "role_id"::uuid;
ALTER TABLE "invites"   ALTER COLUMN "id"        SET DATA TYPE uuid USING "id"::uuid;
ALTER TABLE "invites"   ALTER COLUMN "clinic_id" SET DATA TYPE uuid USING "clinic_id"::uuid;
ALTER TABLE "invites"   ALTER COLUMN "role_id"   SET DATA TYPE uuid USING "role_id"::uuid;
ALTER TABLE "audit_log" ALTER COLUMN "id"        SET DATA TYPE uuid USING "id"::uuid;
ALTER TABLE "audit_log" ALTER COLUMN "clinic_id" SET DATA TYPE uuid USING "clinic_id"::uuid;
ALTER TABLE "audit_log" ALTER COLUMN "user_id"   SET DATA TYPE uuid USING "user_id"::uuid;

ALTER TABLE "roles" ADD CONSTRAINT "roles_clinic_id_fkey"
  FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_clinic_id_fkey"
  FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey"
  FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "invites" ADD CONSTRAINT "invites_clinic_id_fkey"
  FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "invites" ADD CONSTRAINT "invites_role_id_fkey"
  FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_clinic_id_fkey"
  FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
