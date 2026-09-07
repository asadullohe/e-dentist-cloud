-- Ishga tushirish foydalanuvchisi.
--
-- Nega kerak: POSTGRES_USER (edentist) — superuser, superuser esa RLS ni
-- HAR DOIM chetlab oʻtadi. Agar API oʻsha foydalanuvchi bilan ulansa,
-- yozilgan barcha siyosatlar bezak boʻlib qoladi.
--
-- Shuning uchun ikkita rol:
--   edentist      — egasi. Migratsiya va seed. RLS unga taʼsir qilmaydi
--   edentist_app  — API ishga tushganda shu bilan ulanadi. RLS ostida
--
-- Nomlar va parol muhitdan keladi, SQL ichiga yozilmaydi.
-- \gexec — format() qaytargan satrni bajaradi: identifikator ham, parol ham
-- Postgres qoidalari boʻyicha qavslanadi, qoʻlda yopishtirilmaydi.

SELECT format('CREATE ROLE %I LOGIN', :'app_user')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'app_user')
\gexec

SELECT format(
  'ALTER ROLE %I WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS PASSWORD %L',
  :'app_user', :'app_password')
\gexec

SELECT format('GRANT CONNECT ON DATABASE %I TO %I', current_database(), :'app_user')
\gexec

SELECT format('GRANT USAGE ON SCHEMA public TO %I', :'app_user')
\gexec

-- Mavjud jadvallar (bu fayl migratsiyadan keyin qoʻlda ishlatilsa)
SELECT format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO %I', :'app_user')
\gexec

SELECT format('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO %I', :'app_user')
\gexec

-- Kelajakda migratsiya yaratadigan jadvallarga huquq oʻzi berilsin —
-- har yangi jadvaldan keyin buni eslab qolish kerak boʻlmasin
SELECT format(
  'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO %I',
  current_user, :'app_user')
\gexec

SELECT format(
  'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO %I',
  current_user, :'app_user')
\gexec
