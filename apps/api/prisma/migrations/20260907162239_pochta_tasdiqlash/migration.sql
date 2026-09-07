-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_verify_expires_at" TIMESTAMPTZ(3),
ADD COLUMN     "email_verify_token_hash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_email_verify_token_hash_key" ON "users"("email_verify_token_hash");

-- ─────────────────────────────────────────────────────────────────────────
-- Kirish va pochtani tasdiqlash sessiya kontekstisiz ishlaydi: foydalanuvchi
-- pochtasini kiritganda uning klinikasi hali nomaʼlum, RLS esa users jadvalini
-- yopib turadi (kontekst yoʻq = hech narsa koʻrinmaydi).
--
-- Yechim — ikkita tor SECURITY DEFINER funksiya. Ular egasi huquqi bilan
-- bajariladi, lekin faqat aniq belgilangan maydonlarni qaytaradi. Butun
-- jadvalni ochib qoʻyish emas.
--
-- search_path qatʼiy belgilanadi: SECURITY DEFINER funksiyada buni qoldirish
-- klassik zaiflik — chaqiruvchi oʻz sxemasini oldinga qoʻyib, funksiya
-- ichidagi nomlarni almashtirib yuborishi mumkin.
-- ─────────────────────────────────────────────────────────────────────────

CREATE FUNCTION auth_find_user(p_email text)
RETURNS TABLE (
  id uuid,
  clinic_id uuid,
  role_id uuid,
  password_hash text,
  status "UserStatus",
  email_verified_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT u.id, u.clinic_id, u.role_id, u.password_hash, u.status, u.email_verified_at
  FROM users u
  WHERE u.email = lower(p_email)
$$;

CREATE FUNCTION auth_verify_email(p_token_hash text)
RETURNS TABLE (user_id uuid, clinic_id uuid)
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  UPDATE users
  SET email_verified_at        = now(),
      email_verify_token_hash  = NULL,
      email_verify_expires_at  = NULL
  WHERE email_verify_token_hash = p_token_hash
    AND email_verify_expires_at > now()
    AND email_verified_at IS NULL
  RETURNING id, clinic_id
$$;

REVOKE ALL ON FUNCTION auth_find_user(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION auth_verify_email(text) FROM PUBLIC;
