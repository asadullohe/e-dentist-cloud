-- Individual shifokor va assistent (qaror 30/09/2026, tz.md 20-boʻlim).
-- Individual — alohida ijarachi turi emas, bir kishilik klinika: ijarachilik
-- qatlami oʻzgarmaydi, farq `kind` da.

CREATE TYPE "ClinicKind" AS ENUM ('clinic', 'solo');
ALTER TABLE "clinics" ADD COLUMN "kind" "ClinicKind" NOT NULL DEFAULT 'clinic';

-- Yangi qiymat shu tranzaksiyada ishlatilmaydi — rollar keyingi migratsiyada
ALTER TYPE "RoleTemplate" ADD VALUE 'assistent';

-- Tarkibli FK uchun: assistent va shifokor bitta klinikadan boʻlishi shart
CREATE UNIQUE INDEX "users_clinic_id_id_key" ON "users"("clinic_id", "id");

CREATE TABLE "assistant_doctors" (
    "clinic_id" UUID NOT NULL,
    "assistant_id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assistant_doctors_pkey" PRIMARY KEY ("assistant_id", "doctor_id")
);

CREATE INDEX "assistant_doctors_clinic_id_doctor_id_idx" ON "assistant_doctors"("clinic_id", "doctor_id");

ALTER TABLE "assistant_doctors" ADD CONSTRAINT "assistant_doctors_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- FK `clinic_id` bilan birga: RLS FK tekshiruviga taʼsir qilmaydi, shuning
-- uchun boshqa klinikaning xodimini bogʻlashni bazaning oʻzi rad etadi
ALTER TABLE "assistant_doctors" ADD CONSTRAINT "assistant_doctors_clinic_id_assistant_id_fkey" FOREIGN KEY ("clinic_id", "assistant_id") REFERENCES "users"("clinic_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assistant_doctors" ADD CONSTRAINT "assistant_doctors_clinic_id_doctor_id_fkey" FOREIGN KEY ("clinic_id", "doctor_id") REFERENCES "users"("clinic_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS. Yangi jadval qoʻshilganda ikki joy yangilanadi: shu siyosat va
-- platform/tenant.ts dagi TENANT_MODELS (tz.md 5-boʻlim)
ALTER TABLE "assistant_doctors" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assistant_doctors_ijarachi" ON "assistant_doctors"
  FOR ALL
  USING (clinic_id = app_clinic_id())
  WITH CHECK (clinic_id = app_clinic_id());
