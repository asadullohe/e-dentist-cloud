-- Ochiq sahifalar klinika turini biladi (tz.md 20-boʻlim): individual
-- kabinetda fikr sahifasi «klinikaga» emas, «shifokorga» baho soʻraydi.
-- Qaytariladigan ustunlar oʻzgargani uchun funksiya qayta yaratiladi —
-- uslub 20260919164658_bemor_fikrlari dagi bilan bir xil

DROP FUNCTION clinic_by_queue_code(text);

CREATE FUNCTION clinic_by_queue_code(p_code text)
RETURNS TABLE (
  id uuid,
  name text,
  queue_enabled boolean,
  logo_key text,
  public_phone text,
  address text,
  review_url text,
  kind text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT c.id, c.name, c.queue_enabled, c.logo_key, c.public_phone, c.address, c.review_url,
         c.kind::text
  FROM clinics c
  WHERE c.queue_code = p_code
    AND c.status = 'active'
$$;
REVOKE ALL ON FUNCTION clinic_by_queue_code(text) FROM PUBLIC;
