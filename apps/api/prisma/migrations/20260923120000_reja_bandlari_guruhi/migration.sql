-- Bandlar guruhi va koʻprik (qaror 23/09/2026, tz.md 19-boʻlim): koʻprik —
-- uchta oddiy band, guruh esa ustki qatlam. Rol bandda emas, guruhda:
-- `pontics` ichidagi tish quyma, qolgani tayanch koronka.

CREATE TABLE "treatment_plan_groups" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "stage_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    -- Koʻprik oraligʻi, FDI — bandlarning tishlari bilan bir xil
    "teeth" INTEGER[],
    "pontics" INTEGER[],
    "material" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "treatment_plan_groups_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "treatment_plan_groups_clinic_id_idx" ON "treatment_plan_groups"("clinic_id");
CREATE INDEX "treatment_plan_groups_stage_id_idx" ON "treatment_plan_groups"("stage_id");

ALTER TABLE "treatment_plan_groups" ADD CONSTRAINT "treatment_plan_groups_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- Guruh bosqichning ichki qismi: bosqich olib tashlansa guruh ham ketadi
ALTER TABLE "treatment_plan_groups" ADD CONSTRAINT "treatment_plan_groups_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "treatment_plan_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Guruh oʻchsa bandlar joyida qoladi — ular mustaqil ish
ALTER TABLE "treatment_plan_items" ADD COLUMN "group_id" UUID;
CREATE INDEX "treatment_plan_items_group_id_idx" ON "treatment_plan_items"("group_id");
ALTER TABLE "treatment_plan_items" ADD CONSTRAINT "treatment_plan_items_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "treatment_plan_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Guruhning hamma bandi bajarilganda koʻprik xaritaga tushadi va shu
-- ustun orqali guruhga bogʻlanadi. Tashrif oʻchirilsa koʻprik ham olinadi;
-- guruh oʻchsa koʻprik qoladi (ish allaqachon qilingan) — SET NULL
ALTER TABLE "bridges" ADD COLUMN "plan_group_id" UUID;
CREATE UNIQUE INDEX "bridges_plan_group_id_key" ON "bridges"("plan_group_id");
ALTER TABLE "bridges" ADD CONSTRAINT "bridges_plan_group_id_fkey" FOREIGN KEY ("plan_group_id") REFERENCES "treatment_plan_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RLS. Yangi jadval qoʻshilganda ikki joy yangilanadi: shu siyosat va
-- platform/tenant.ts dagi TENANT_MODELS (tz.md 5-boʻlim)
ALTER TABLE "treatment_plan_groups" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "treatment_plan_groups_ijarachi" ON "treatment_plan_groups"
  FOR ALL
  USING (clinic_id = app_clinic_id())
  WITH CHECK (clinic_id = app_clinic_id());
