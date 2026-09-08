-- CreateEnum
CREATE TYPE "LabWorkType" AS ENUM ('crown', 'bridge', 'denture', 'clasp_denture', 'veneer', 'inlay', 'mouthguard', 'ortho_plate');

-- CreateEnum
CREATE TYPE "LabMaterial" AS ENUM ('metal_ceramic', 'zirconia', 'press_ceramic', 'acrylic', 'cast_metal', 'nylon');

-- CreateEnum
CREATE TYPE "LabStatus" AS ENUM ('issued', 'ready', 'delivered');

-- CreateEnum
CREATE TYPE "LabReturnReason" AS ENUM ('fit', 'shade', 'broken', 'other');

-- CreateTable
CREATE TABLE "lab_orders" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "tech_id" UUID,
    "teeth" INTEGER[],
    "work_type" "LabWorkType" NOT NULL,
    "material" "LabMaterial" NOT NULL,
    "shade" TEXT,
    "due_date" DATE NOT NULL,
    "tech_price" INTEGER NOT NULL DEFAULT 0,
    "status" "LabStatus" NOT NULL DEFAULT 'issued',
    "note" TEXT,
    "returns" INTEGER NOT NULL DEFAULT 0,
    "return_reason" "LabReturnReason",
    "return_note" TEXT,
    "delivered_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "lab_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lab_orders_clinic_id_status_due_date_idx" ON "lab_orders"("clinic_id", "status", "due_date");

-- CreateIndex
CREATE INDEX "lab_orders_clinic_id_tech_id_status_idx" ON "lab_orders"("clinic_id", "tech_id", "status");

-- CreateIndex
CREATE INDEX "lab_orders_clinic_id_patient_id_idx" ON "lab_orders"("clinic_id", "patient_id");

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RLS. Yangi jadval qoʻshilganda ikki joy yangilanadi: shu siyosat va
-- platform/tenant.ts dagi TENANT_MODELS (tz.md 5-boʻlim)
ALTER TABLE "lab_orders" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lab_orders_ijarachi" ON "lab_orders"
  FOR ALL
  USING (clinic_id = app_clinic_id())
  WITH CHECK (clinic_id = app_clinic_id());
