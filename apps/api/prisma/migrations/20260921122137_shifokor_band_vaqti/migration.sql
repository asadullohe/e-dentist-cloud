-- Shifokorning band vaqti (12-bosqich): taʼtil, tushlik, oʻqish. Bu
-- oraliqqa qabul yozilmaydi, jadvalda shtrixli blok
CREATE TABLE "time_blocks" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "starts_at" TIMESTAMPTZ(3) NOT NULL,
    "ends_at" TIMESTAMPTZ(3) NOT NULL,
    "reason" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "time_blocks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "time_blocks_range_check" CHECK ("ends_at" > "starts_at")
);

CREATE INDEX "time_blocks_clinic_id_doctor_id_starts_at_idx" ON "time_blocks"("clinic_id", "doctor_id", "starts_at");

ALTER TABLE "time_blocks" ADD CONSTRAINT "time_blocks_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RLS. Yangi jadval qoʻshilganda ikki joy yangilanadi: shu siyosat va
-- platform/tenant.ts dagi TENANT_MODELS (tz.md 5-boʻlim)
ALTER TABLE "time_blocks" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "time_blocks_ijarachi" ON "time_blocks"
  FOR ALL
  USING (clinic_id = app_clinic_id())
  WITH CHECK (clinic_id = app_clinic_id());
