-- Roʻyxatda «Taklif yuborilgan» nishoni koʻrinishi uchun bitta ustun.
--
-- Panelidan ochilgan klinikada hali hech kim yoʻq: hisob taklifnoma qabul
-- qilinganda yaratiladi. Xodimlar soni nolligi bunday klinikani qisman
-- koʻrsatadi, lekin sabab noaniq qoladi — shuning uchun aniq belgi.
--
-- Funksiya qaytaradigan tuzilma oʻzgargani uchun oʻchirilib qayta yaratiladi.

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
  pending_invite boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT c.id, c.name, c.phone, c.plan, c.is_trial, c.expires_at, c.status, c.created_at,
         count(u.id) FILTER (WHERE u.status = 'active'),
         max(u.last_login_at),
         -- Muddati oʻtgan taklifnoma «yuborilgan» hisoblanmaydi: u endi
         -- ishlamaydi va qayta yuborish kerak
         EXISTS (
           SELECT 1 FROM invites i
           WHERE i.clinic_id = c.id AND i.accepted_at IS NULL AND i.expires_at > now()
         )
  FROM clinics c
  LEFT JOIN users u ON u.clinic_id = c.id
  WHERE p_search = '' OR c.name ILIKE '%' || p_search || '%' OR c.phone ILIKE '%' || p_search || '%'
  GROUP BY c.id
  ORDER BY c.created_at DESC
$$;

REVOKE ALL ON FUNCTION admin_clinics(text) FROM PUBLIC;
