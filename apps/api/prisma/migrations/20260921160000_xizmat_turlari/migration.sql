-- Xizmatlar katalogi (qaror 21/09/2026): avval tur (Jarrohlik, Terapiya…),
-- ichida xizmatlar. Tartibni klinika oʻzi belgilaydi (position)
CREATE TABLE "service_types" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "service_types_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "service_types_clinic_id_position_idx" ON "service_types"("clinic_id", "position");
CREATE UNIQUE INDEX "service_types_clinic_id_name_key" ON "service_types"("clinic_id", "name");
ALTER TABLE "service_types" ADD CONSTRAINT "service_types_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RLS. Yangi jadval qoʻshilganda ikki joy yangilanadi: shu siyosat va
-- platform/tenant.ts dagi TENANT_MODELS (tz.md 5-boʻlim)
ALTER TABLE "service_types" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_types_ijarachi" ON "service_types"
  FOR ALL
  USING (clinic_id = app_clinic_id())
  WITH CHECK (clinic_id = app_clinic_id());

-- Xizmat turga bogʻlanadi, tur ichida tartib
ALTER TABLE "services"
  ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "type_id" UUID;

-- Mavjud xizmatlar: har biriga oʻz nomi bilan tur (tur = xizmat nomi) —
-- hech narsa yoʻqolmaydi, klinika keyin xohlagancha guruhlaydi. Tartib —
-- hozirgi koʻrinish (nom boʻyicha)
INSERT INTO "service_types" ("id", "clinic_id", "name", "position", "updated_at")
SELECT gen_random_uuid(), s."clinic_id", s."name",
       row_number() OVER (PARTITION BY s."clinic_id" ORDER BY s."name"),
       CURRENT_TIMESTAMP
FROM "services" s;

UPDATE "services" s
SET "type_id" = t."id"
FROM "service_types" t
WHERE t."clinic_id" = s."clinic_id" AND t."name" = s."name";

ALTER TABLE "services" ALTER COLUMN "type_id" SET NOT NULL;

-- Nom endi klinika ichida emas, tur ichida takrorlanmaydi
DROP INDEX "services_clinic_id_name_key";
CREATE UNIQUE INDEX "services_type_id_name_key" ON "services"("type_id", "name");
CREATE INDEX "services_type_id_position_idx" ON "services"("type_id", "position");
ALTER TABLE "services" ADD CONSTRAINT "services_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "service_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
