-- ─────────────────────────────────────────────────────────────────────────
-- Boshqaruv paneli soʻrovlari.
--
-- Panel klinikalar roʻyxatini koʻradi, lekin RLS ilova ulanishiga faqat
-- bitta klinikani ochadi. Yechim sifatida ulanishni egasi huquqiga
-- oʻtkazish mumkin edi — lekin u holda paneldagi bitta xato butun
-- kartotekani ochib yuborardi.
--
-- Shuning uchun har bir soʻrov tor SECURITY DEFINER funksiya: ular faqat
-- klinika darajasidagi maydonlarni qaytaradi. Bemor maʼlumoti bu yerdan
-- printsipial ravishda chiqmaydi — bu kod emas, baza kafolati (tz.md
-- 11-boʻlim).
--
-- search_path qatʼiy: SECURITY DEFINER da buni qoldirish klassik zaiflik.
-- ─────────────────────────────────────────────────────────────────────────

-- Roʻyxat. Qidiruv nom va telefon boʻyicha
CREATE FUNCTION admin_clinics(p_search text)
RETURNS TABLE (
  id uuid,
  name text,
  phone text,
  plan text,
  is_trial boolean,
  expires_at date,
  status "ClinicStatus",
  created_at timestamptz,
  staff_count bigint,
  last_login_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT c.id, c.name, c.phone, c.plan, c.is_trial, c.expires_at, c.status, c.created_at,
         count(u.id) FILTER (WHERE u.status = 'active'),
         max(u.last_login_at)
  FROM clinics c
  LEFT JOIN users u ON u.clinic_id = c.id
  WHERE p_search = '' OR c.name ILIKE '%' || p_search || '%' OR c.phone ILIKE '%' || p_search || '%'
  GROUP BY c.id
  ORDER BY c.created_at DESC
$$;

-- Kartochka: yuqoridagi maydonlar + hajm koʻrsatkichlari.
-- Bular sonlar, bemor maʼlumoti emas
CREATE FUNCTION admin_clinic(p_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  phone text,
  plan text,
  is_trial boolean,
  expires_at date,
  status "ClinicStatus",
  created_at timestamptz,
  queue_enabled boolean,
  staff_count bigint,
  patient_count bigint,
  visit_count bigint,
  last_login_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT c.id, c.name, c.phone, c.plan, c.is_trial, c.expires_at, c.status, c.created_at,
         c.queue_enabled,
         (SELECT count(*) FROM users u WHERE u.clinic_id = c.id AND u.status = 'active'),
         (SELECT count(*) FROM patients p WHERE p.clinic_id = c.id),
         (SELECT count(*) FROM visits v WHERE v.clinic_id = c.id),
         (SELECT max(u.last_login_at) FROM users u WHERE u.clinic_id = c.id)
  FROM clinics c
  WHERE c.id = p_id
$$;

-- Xodimlar: pochta, ism, rol va oxirgi kirish. Parol xeshi qaytmaydi
CREATE FUNCTION admin_clinic_staff(p_id uuid)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  role_name text,
  status "UserStatus",
  last_login_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT u.id, u.email, u.full_name, r.name, u.status, u.last_login_at
  FROM users u
  LEFT JOIN roles r ON r.id = u.role_id
  WHERE u.clinic_id = p_id
  ORDER BY u.created_at
$$;

-- Tarix: kim, qachon, qanday amal. `entity_id` va `meta` qaytmaydi —
-- ularda bemor yozuvining identifikatori boʻlishi mumkin
CREATE FUNCTION admin_clinic_history(p_id uuid, p_limit int)
RETURNS TABLE (at timestamptz, action text, actor text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT a.at, a.action, u.email
  FROM audit_log a
  LEFT JOIN users u ON u.id = a.user_id
  WHERE a.clinic_id = p_id
  ORDER BY a.at DESC
  LIMIT least(p_limit, 200)
$$;

-- Muddatni uzaytirish. Muddati oʻtgan boʻlsa bugundan boshlanadi,
-- aks holda mavjud sanaga qoʻshiladi
CREATE FUNCTION admin_extend_clinic(p_id uuid, p_days int)
RETURNS TABLE (expires_at date, is_trial boolean)
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  UPDATE clinics
  SET expires_at = greatest(expires_at, current_date) + make_interval(days => p_days),
      -- Toʻlov qilingan — sinov tugadi
      is_trial = false,
      updated_at = now()
  WHERE id = p_id
  RETURNING expires_at, is_trial
$$;

CREATE FUNCTION admin_set_clinic_status(p_id uuid, p_status "ClinicStatus")
RETURNS TABLE (status "ClinicStatus")
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  UPDATE clinics SET status = p_status, updated_at = now()
  WHERE id = p_id
  RETURNING status
$$;

REVOKE ALL ON FUNCTION admin_clinics(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION admin_clinic(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION admin_clinic_staff(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION admin_clinic_history(uuid, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION admin_extend_clinic(uuid, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION admin_set_clinic_status(uuid, "ClinicStatus") FROM PUBLIC;
