-- ─────────────────────────────────────────────────────────────────────────
-- Platforma admini hech qaysi klinikaga tegishli emas: uning qatorida
-- `clinic_id` boʻsh. RLS siyosati esa `clinic_id = app_clinic_id()` ni
-- talab qiladi va boʻsh ustun hech qachon mos kelmaydi — yaʼni admin
-- qatori ilova ulanishiga umuman koʻrinmaydi.
--
-- Buni «clinic_id IS NULL boʻlsa ochiq» degan siyosat bilan yechib
-- boʻlmaydi: u holda admin qatorlari har qanday soʻrovga koʻrinardi.
-- Shuning uchun boshqa joylardagidek tor SECURITY DEFINER funksiya.
--
-- search_path qatʼiy: SECURITY DEFINER da buni qoldirish klassik zaiflik.
-- ─────────────────────────────────────────────────────────────────────────

CREATE FUNCTION admin_find(p_user_id uuid)
RETURNS TABLE (id uuid, email text, full_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT u.id, u.email, u.full_name
  FROM users u
  WHERE u.id = p_user_id
    AND u.clinic_id IS NULL
    AND u.status = 'active'
$$;

REVOKE ALL ON FUNCTION admin_find(uuid) FROM PUBLIC;
