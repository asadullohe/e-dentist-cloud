-- Pochtani tasdiqlash takrorlansa ham xato bermasin.
--
-- Muammo: kalit bir martalik edi va ishlatilgach oʻchirilardi. Amalda havola
-- ikki marta ochiladi:
--   · React StrictMode ishlab chiqishda effektni ikki marta chaqiradi
--   · baʼzi pochta mijozlari havolani foydalanuvchidan oldin ochib koʻradi
-- Ikkala holatda ham birinchi murojaat muvaffaqiyatli boʻladi, foydalanuvchi
-- esa «Havola yaroqsiz» degan xatoni koʻradi.
--
-- Yechim: amal takrorlansa ham natija oʻzgarmaydi. COALESCE tasdiqlangan
-- vaqtni saqlab qoladi, kalit esa muddati tugaguncha (24 soat) ishlayveradi.
-- Xavfsizlik oshmaydi ham, kamaymaydi ham: kalitga ega odam faqat pochtani
-- tasdiqlay oladi, birinchi martasida ham shu edi.

CREATE OR REPLACE FUNCTION auth_verify_email(p_token_hash text)
RETURNS TABLE (user_id uuid, clinic_id uuid)
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  UPDATE users
  SET email_verified_at = COALESCE(email_verified_at, now())
  WHERE email_verify_token_hash = p_token_hash
    AND email_verify_expires_at > now()
  RETURNING id, clinic_id
$$;
