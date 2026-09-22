-- ─────────────────────────────────────────────────────────────────────────
-- Davolash rejasining ochiq sahifasi: /r/<kod>. Sessiya yoʻq, RLS esa
-- jadvallarni yopib turadi — shuning uchun kodni klinikaga aylantirish
-- uchun tor SECURITY DEFINER funksiya kerak (`clinic_by_queue_code` bilan
-- bir xil uslub, tz.md 18-boʻlim).
--
-- Funksiya rejaning oʻzini qaytarmaydi — faqat qaysi klinikaniki ekanini.
-- Reja keyin odatdagi yoʻl bilan, RLS ichida (`withClinic`) oʻqiladi.
--
-- search_path qatʼiy: SECURITY DEFINER da buni qoldirish klassik zaiflik.
-- ─────────────────────────────────────────────────────────────────────────

CREATE FUNCTION clinic_by_plan_code(p_code text)
RETURNS TABLE (
  clinic_id uuid,
  plan_id uuid,
  name text,
  logo_key text,
  public_phone text,
  address text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT c.id, p.id, c.name, c.logo_key, c.public_phone, c.address
  FROM treatment_plans p
  JOIN clinics c ON c.id = p.clinic_id
  WHERE p.public_code = p_code
    AND c.status = 'active'
$$;

REVOKE ALL ON FUNCTION clinic_by_plan_code(text) FROM PUBLIC;
