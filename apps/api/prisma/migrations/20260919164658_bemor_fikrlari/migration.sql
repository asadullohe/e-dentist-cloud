-- Bemor fikrlari (tz.md 14-boʻlim, qaror 19/09/2026).
--
-- Ochiq sahifadan keladi: navbat raqami tugagach, fikr QR varagʻidan yoki
-- navbat sahifasidagi tugmadan. Faqat egasiga koʻrinadi — ochiq reyting
-- 1-versiyada yoʻq. Klinikaga bemor sahifasi uchun telefon va manzil,
-- hamda xarita sharh havolasi qoʻshiladi (5 yulduzdan keyingi tugma).
-- `clinics.phone` roʻyxatdan oʻtgan egasining raqami — u ochiq sahifaga
-- chiqmaydi, bemorlar uchun alohida `public_phone`.

CREATE TYPE "FeedbackSource" AS ENUM ('ticket', 'qr', 'page');
CREATE TYPE "FeedbackStatus" AS ENUM ('new', 'seen', 'contacted');

ALTER TABLE "clinics"
  ADD COLUMN "public_phone" TEXT,
  ADD COLUMN "address" TEXT,
  ADD COLUMN "review_url" TEXT;

CREATE TABLE "feedback" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "doctor_id" UUID,
    "appointment_id" UUID,
    "patient_id" UUID,
    "rating" INTEGER NOT NULL,
    "tags" TEXT[],
    "comment" TEXT,
    "phone" TEXT,
    "source" "FeedbackSource" NOT NULL,
    "status" "FeedbackStatus" NOT NULL DEFAULT 'new',
    "device_id" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id"),
    -- Baho 1–5; bazaning oʻzi ham tekshiradi
    CONSTRAINT "feedback_rating_check" CHECK ("rating" BETWEEN 1 AND 5)
);

-- Bitta navbat raqamiga bitta fikr
CREATE UNIQUE INDEX "feedback_appointment_id_key" ON "feedback"("appointment_id");
CREATE INDEX "feedback_clinic_id_created_at_idx" ON "feedback"("clinic_id", "created_at");
CREATE INDEX "feedback_clinic_id_status_idx" ON "feedback"("clinic_id", "status");
CREATE INDEX "feedback_clinic_id_doctor_id_created_at_idx" ON "feedback"("clinic_id", "doctor_id", "created_at");

ALTER TABLE "feedback" ADD CONSTRAINT "feedback_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- Qabul yozuvi oʻchsa fikr qoladi, faqat bogʻlanish ketadi
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RLS. Yangi jadval qoʻshilganda ikki joy yangilanadi: shu siyosat va
-- platform/tenant.ts dagi TENANT_MODELS (tz.md 5-boʻlim)
ALTER TABLE "feedback" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feedback_ijarachi" ON "feedback"
  FOR ALL
  USING (clinic_id = app_clinic_id())
  WITH CHECK (clinic_id = app_clinic_id());

-- Ochiq sahifa (loginsiz) klinikani kod boʻyicha topadi — endi bemorlar
-- telefoni, manzil va sharh havolasi ham kerak
DROP FUNCTION clinic_by_queue_code(text);

CREATE FUNCTION clinic_by_queue_code(p_code text)
RETURNS TABLE (
  id uuid,
  name text,
  queue_enabled boolean,
  logo_key text,
  public_phone text,
  address text,
  review_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT c.id, c.name, c.queue_enabled, c.logo_key, c.public_phone, c.address, c.review_url
  FROM clinics c
  WHERE c.queue_code = p_code
    AND c.status = 'active'
$$;

REVOKE ALL ON FUNCTION clinic_by_queue_code(text) FROM PUBLIC;

-- Ruxsatlar mavjud rollarga: egasi fikrlarni koʻradi. Shifokorga oʻzinikini
-- koʻrsatish (`feedback.own`) — egasi Rollar sahifasida oʻzi ochadi
UPDATE "roles"
SET "permissions" = array_append("permissions", 'feedback.read')
WHERE "is_owner" AND NOT ('feedback.read' = ANY("permissions"));
