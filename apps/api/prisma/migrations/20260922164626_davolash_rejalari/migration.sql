-- Davolash rejalari (qaror 22/09/2026, tz.md 18-boʻlim): reja → bosqichlar →
-- bandlar. Bemorga yozma, bosqichli, narxi koʻrsatilgan taklif.

CREATE TYPE "PlanStatus" AS ENUM ('draft', 'sent', 'accepted', 'declined', 'done', 'cancelled');
CREATE TYPE "PlanItemStatus" AS ENUM ('pending', 'done', 'skipped');

CREATE TABLE "treatment_plans" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "status" "PlanStatus" NOT NULL DEFAULT 'draft',
    -- Soʻm, butun son. Foizdan hisoblash interfeysda — bazada bitta son
    "discount" INTEGER NOT NULL DEFAULT 0,
    "valid_until" DATE,
    -- Ochiq sahifa /r/<kod> ning yagona himoyasi — taxmin qilib boʻlmaydi
    "public_code" TEXT NOT NULL,
    "note" TEXT,
    "accepted_at" TIMESTAMPTZ(3),
    "declined_at" TIMESTAMPTZ(3),
    "decline_reason" TEXT,
    "cancelled_at" TIMESTAMPTZ(3),
    "cancel_reason" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "treatment_plans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "treatment_plans_public_code_key" ON "treatment_plans"("public_code");
CREATE INDEX "treatment_plans_clinic_id_patient_id_created_at_idx" ON "treatment_plans"("clinic_id", "patient_id", "created_at");
CREATE INDEX "treatment_plans_clinic_id_status_idx" ON "treatment_plans"("clinic_id", "status");
CREATE INDEX "treatment_plans_clinic_id_doctor_id_idx" ON "treatment_plans"("clinic_id", "doctor_id");

ALTER TABLE "treatment_plans" ADD CONSTRAINT "treatment_plans_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "treatment_plans" ADD CONSTRAINT "treatment_plans_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "treatment_plan_stages" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "treatment_plan_stages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "treatment_plan_stages_clinic_id_idx" ON "treatment_plan_stages"("clinic_id");
CREATE INDEX "treatment_plan_stages_plan_id_position_idx" ON "treatment_plan_stages"("plan_id", "position");

ALTER TABLE "treatment_plan_stages" ADD CONSTRAINT "treatment_plan_stages_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- Bosqich rejaning ichki qismi: reja bekor qilinadi, lekin bosqich olib
-- tashlansa ichidagi bandlar ham ketishi kerak
ALTER TABLE "treatment_plan_stages" ADD CONSTRAINT "treatment_plan_stages_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "treatment_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "treatment_plan_items" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "stage_id" UUID NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "tooth" INTEGER,
    "service_id" UUID,
    -- Nom va narx snapshot: narxnoma keyin oʻzgarsa reja oʻzgarmaydi
    "treatment" TEXT NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "status" "PlanItemStatus" NOT NULL DEFAULT 'pending',
    "visit_id" UUID,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "treatment_plan_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "treatment_plan_items_visit_id_key" ON "treatment_plan_items"("visit_id");
CREATE INDEX "treatment_plan_items_clinic_id_idx" ON "treatment_plan_items"("clinic_id");
CREATE INDEX "treatment_plan_items_stage_id_position_idx" ON "treatment_plan_items"("stage_id", "position");

ALTER TABLE "treatment_plan_items" ADD CONSTRAINT "treatment_plan_items_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "treatment_plan_items" ADD CONSTRAINT "treatment_plan_items_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "treatment_plan_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- Xizmat oʻchirilsa band qoladi: nom va narx allaqachon koʻchirilgan
ALTER TABLE "treatment_plan_items" ADD CONSTRAINT "treatment_plan_items_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- Tashrif oʻchirilsa band «bajarildi» boʻlib qolmasin — bogʻlanish uziladi
ALTER TABLE "treatment_plan_items" ADD CONSTRAINT "treatment_plan_items_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RLS. Yangi jadval qoʻshilganda ikki joy yangilanadi: shu siyosat va
-- platform/tenant.ts dagi TENANT_MODELS (tz.md 5-boʻlim)
ALTER TABLE "treatment_plans" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "treatment_plans_ijarachi" ON "treatment_plans"
  FOR ALL
  USING (clinic_id = app_clinic_id())
  WITH CHECK (clinic_id = app_clinic_id());

ALTER TABLE "treatment_plan_stages" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "treatment_plan_stages_ijarachi" ON "treatment_plan_stages"
  FOR ALL
  USING (clinic_id = app_clinic_id())
  WITH CHECK (clinic_id = app_clinic_id());

ALTER TABLE "treatment_plan_items" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "treatment_plan_items_ijarachi" ON "treatment_plan_items"
  FOR ALL
  USING (clinic_id = app_clinic_id())
  WITH CHECK (clinic_id = app_clinic_id());

-- Ruxsatlar mavjud rollarga. Rejani shifokor tuzadi (oʻz ishi), qabulxona va
-- kuzatuvchi faqat koʻradi — bemor «qancha boʻladi?» deganda javob beradi
UPDATE "roles"
SET "permissions" = array_append("permissions", 'plans.read')
WHERE ("is_owner" OR "template" IN ('shifokor', 'qabulxona', 'kuzatuvchi'))
  AND NOT ('plans.read' = ANY("permissions"));

UPDATE "roles"
SET "permissions" = array_append("permissions", 'plans.write')
WHERE ("is_owner" OR "template" = 'shifokor')
  AND NOT ('plans.write' = ANY("permissions"));
