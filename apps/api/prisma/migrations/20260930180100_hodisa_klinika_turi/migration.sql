-- Klinika ↔ individual almashishi platforma hodisasi (tz.md 20-boʻlim):
-- narx shunga bogʻliq, panel «Platforma hodisalari» da koʻrinsin.
-- Tana 20260909045148_boshqaruv_statistika dagi bilan bir xil, roʻyxatga
-- `clinic_kind_changed` qoʻshildi

CREATE OR REPLACE FUNCTION admin_events(p_limit int, p_platform_only boolean)
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
    'subscription_extended', 'clinic_blocked', 'clinic_unblocked', 'data_exported',
    'clinic_kind_changed'
  )
  ORDER BY a.at DESC
  LIMIT least(p_limit, 200)
$$;
