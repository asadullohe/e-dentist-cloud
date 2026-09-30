-- Tashqi laboratoriya (qaror 30/09/2026, tz.md 20-boʻlim). Yakka shifokorda
-- texnik xodim yoʻq, klinikalar ham koʻpincha tashqi lab bilan ishlaydi.

CREATE TABLE "labs" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "labs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "labs_clinic_id_idx" ON "labs"("clinic_id");
ALTER TABLE "labs" ADD CONSTRAINT "labs_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Naryad texnikka yoki laboratoriyaga — ikkalasi birga emas
ALTER TABLE "lab_orders" ADD COLUMN "lab_id" UUID;
CREATE INDEX "lab_orders_lab_id_idx" ON "lab_orders"("lab_id");
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_lab_id_fkey" FOREIGN KEY ("lab_id") REFERENCES "labs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_tech_or_lab" CHECK ("tech_id" IS NULL OR "lab_id" IS NULL);

-- RLS. Yangi jadval qoʻshilganda ikki joy yangilanadi: shu siyosat va
-- platform/tenant.ts dagi TENANT_MODELS (tz.md 5-boʻlim)
ALTER TABLE "labs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "labs_ijarachi" ON "labs"
  FOR ALL
  USING (clinic_id = app_clinic_id())
  WITH CHECK (clinic_id = app_clinic_id());
