-- Boshqaruv panelidagi statistika va hodisalar.
-- Oldingi panel funksiyalari bilan bir xil qoida: faqat klinika
-- darajasidagi maydonlar, bemor maʼlumoti yoʻq (tz.md 11-boʻlim).

CREATE FUNCTION admin_stats()
RETURNS TABLE (
  total bigint,
  active bigint,
  trial bigint,
  expired bigint,
  blocked bigint,
  staff bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    count(*),
    count(*) FILTER (WHERE c.status = 'active' AND c.expires_at >= current_date),
    count(*) FILTER (WHERE c.is_trial AND c.status = 'active' AND c.expires_at >= current_date),
    count(*) FILTER (WHERE c.expires_at < current_date AND c.status = 'active'),
    count(*) FILTER (WHERE c.status = 'blocked'),
    (SELECT count(*) FROM users u WHERE u.clinic_id IS NOT NULL AND u.status = 'active')
  FROM clinics c
$$;

-- Oylar kesimi: nechta klinika roʻyxatdan oʻtgan va nechta muddat
-- uzaytirilgan. Daromad summasi bu yerda yoʻq — narx modeli hali
-- belgilanmagan (reja.md, ochiq savol 2)
CREATE FUNCTION admin_monthly(p_months int)
RETURNS TABLE (month text, registered bigint, extended bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH months AS (
    SELECT to_char(date_trunc('month', current_date) - make_interval(months => offset_i), 'YYYY-MM') AS m
    FROM generate_series(0, least(p_months, 36) - 1) AS offset_i
  )
  SELECT
    months.m,
    (SELECT count(*) FROM clinics c WHERE to_char(c.created_at, 'YYYY-MM') = months.m),
    (SELECT count(*) FROM audit_log a
      WHERE a.action = 'subscription_extended' AND to_char(a.at, 'YYYY-MM') = months.m)
  FROM months
  ORDER BY months.m
$$;

-- Hodisalar: kim, qachon, qaysi klinikada. `entity_id` va `meta`
-- qaytmaydi — ularda bemor yozuvining identifikatori boʻlishi mumkin
CREATE FUNCTION admin_events(p_limit int, p_platform_only boolean)
RETURNS TABLE (at timestamptz, action text, clinic_name text, actor text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT a.at, a.action, c.name, u.email
  FROM audit_log a
  JOIN clinics c ON c.id = a.clinic_id
  LEFT JOIN users u ON u.id = a.user_id
  WHERE NOT p_platform_only OR a.action IN (
    'registered', 'email_verified', 'login_failed', 'staff_changed',
    'subscription_extended', 'clinic_blocked', 'clinic_unblocked', 'data_exported'
  )
  ORDER BY a.at DESC
  LIMIT least(p_limit, 200)
$$;

REVOKE ALL ON FUNCTION admin_stats() FROM PUBLIC;
REVOKE ALL ON FUNCTION admin_monthly(int) FROM PUBLIC;
REVOKE ALL ON FUNCTION admin_events(int, boolean) FROM PUBLIC;
