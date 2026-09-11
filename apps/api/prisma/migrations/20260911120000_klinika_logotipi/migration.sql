-- Klinika logotipi.
--
-- Faylning oʻzi MinIO da, bazada faqat kalit. Rasm API orqali beriladi
-- (imzolangan havola emas): serverda MinIO tashqariga ochilmagan va
-- brauzer `minio:9000` manzilini topa olmaydi.
--
-- Navbat sahifasi loginsiz ochiladi, shuning uchun `clinic_by_queue_code`
-- ham kalitni qaytaradi. Panelga esa navbat kodi va logotip bor-yoʻqligi
-- kerak — havolani oʻsha koddan yasaydi.

ALTER TABLE clinics ADD COLUMN logo_key text;

DROP FUNCTION clinic_by_queue_code(text);

CREATE FUNCTION clinic_by_queue_code(p_code text)
RETURNS TABLE (id uuid, name text, queue_enabled boolean, logo_key text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT c.id, c.name, c.queue_enabled, c.logo_key
  FROM clinics c
  WHERE c.queue_code = p_code
    AND c.status = 'active'
$$;

REVOKE ALL ON FUNCTION clinic_by_queue_code(text) FROM PUBLIC;

DROP FUNCTION admin_clinics(text);

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
  last_login_at timestamptz,
  pending_invite boolean,
  queue_code text,
  has_logo boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT c.id, c.name, c.phone, c.plan, c.is_trial, c.expires_at, c.status, c.created_at,
         count(u.id) FILTER (WHERE u.status = 'active'),
         max(u.last_login_at),
         EXISTS (
           SELECT 1 FROM invites i
           WHERE i.clinic_id = c.id AND i.accepted_at IS NULL AND i.expires_at > now()
         ),
         c.queue_code,
         c.logo_key IS NOT NULL
  FROM clinics c
  LEFT JOIN users u ON u.clinic_id = c.id
  WHERE p_search = '' OR c.name ILIKE '%' || p_search || '%' OR c.phone ILIKE '%' || p_search || '%'
  GROUP BY c.id
  ORDER BY c.created_at DESC
$$;

REVOKE ALL ON FUNCTION admin_clinics(text) FROM PUBLIC;

DROP FUNCTION admin_clinic(uuid);

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
  last_login_at timestamptz,
  pending_invite boolean,
  queue_code text,
  has_logo boolean
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
         (SELECT max(u.last_login_at) FROM users u WHERE u.clinic_id = c.id),
         EXISTS (
           SELECT 1 FROM invites i
           WHERE i.clinic_id = c.id AND i.accepted_at IS NULL AND i.expires_at > now()
         ),
         c.queue_code,
         c.logo_key IS NOT NULL
  FROM clinics c
  WHERE c.id = p_id
$$;

REVOKE ALL ON FUNCTION admin_clinic(uuid) FROM PUBLIC;
