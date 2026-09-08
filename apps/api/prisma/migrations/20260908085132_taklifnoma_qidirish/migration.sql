-- ─────────────────────────────────────────────────────────────────────────
-- Taklifnomani kalit boʻyicha topish sessiya kontekstisiz ishlaydi: havolani
-- ochgan odam hali hech qaysi klinikaga tegishli emas, RLS esa `invites` ni
-- yopib turadi (kontekst yoʻq = hech narsa koʻrinmaydi).
--
-- auth_find_user va auth_verify_email bilan bir xil yechim: tor
-- SECURITY DEFINER funksiya. Butun jadval ochilmaydi — faqat havolani
-- koʻrsatish va hisob ochish uchun kerak boʻlgan maydonlar qaytadi.
--
-- search_path qatʼiy: SECURITY DEFINER da buni qoldirish klassik zaiflik.
-- ─────────────────────────────────────────────────────────────────────────

CREATE FUNCTION invite_find(p_token_hash text)
RETURNS TABLE (
  id uuid,
  clinic_id uuid,
  role_id uuid,
  email text,
  expires_at timestamptz,
  accepted_at timestamptz,
  clinic_name text,
  role_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT i.id, i.clinic_id, i.role_id, i.email, i.expires_at, i.accepted_at,
         c.name, r.name
  FROM invites i
  JOIN clinics c ON c.id = i.clinic_id
  JOIN roles r   ON r.id = i.role_id
  WHERE i.token_hash = p_token_hash
$$;

REVOKE ALL ON FUNCTION invite_find(text) FROM PUBLIC;
