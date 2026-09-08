-- ─────────────────────────────────────────────────────────────────────────
-- Navbat sahifasi loginsiz ochiladi: /n/<kod>. Sessiya yoʻq, RLS esa
-- `clinics` ni yopib turadi — shuning uchun kodni klinikaga aylantirish
-- uchun tor SECURITY DEFINER funksiya kerak (auth_find_user va invite_find
-- bilan bir xil uslub, tz.md 14-boʻlim).
--
-- Funksiya faqat uchta maydonni qaytaradi: id, nomi va navbat yoqilganmi.
-- Klinikaning muddati, tarifi va telefoni ochiq sahifaga chiqmaydi.
--
-- search_path qatʼiy: SECURITY DEFINER da buni qoldirish klassik zaiflik.
-- ─────────────────────────────────────────────────────────────────────────

CREATE FUNCTION clinic_by_queue_code(p_code text)
RETURNS TABLE (id uuid, name text, queue_enabled boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT c.id, c.name, c.queue_enabled
  FROM clinics c
  WHERE c.queue_code = p_code
    AND c.status = 'active'
$$;

REVOKE ALL ON FUNCTION clinic_by_queue_code(text) FROM PUBLIC;
