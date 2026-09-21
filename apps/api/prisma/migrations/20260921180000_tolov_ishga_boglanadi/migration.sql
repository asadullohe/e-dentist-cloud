-- Toʻlovning ishga bogʻlanishi (qaror 21/09/2026): toʻlov aniq tashrif(lar)ga
-- yoziladi, tashrifda «olingan / olinmagan» shundan, shifokor ulushi olingan
-- qismdan. Bitta toʻlov bir nechta ishni yopishi mumkin
CREATE TABLE "payment_allocations" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "visit_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "payment_allocations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "payment_allocations_amount_check" CHECK ("amount" > 0)
);

CREATE UNIQUE INDEX "payment_allocations_payment_id_visit_id_key" ON "payment_allocations"("payment_id", "visit_id");
CREATE INDEX "payment_allocations_clinic_id_visit_id_idx" ON "payment_allocations"("clinic_id", "visit_id");

ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS. Yangi jadval qoʻshilganda ikki joy yangilanadi: shu siyosat va
-- platform/tenant.ts dagi TENANT_MODELS (tz.md 5-boʻlim)
ALTER TABLE "payment_allocations" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment_allocations_ijarachi" ON "payment_allocations"
  FOR ALL
  USING (clinic_id = app_clinic_id())
  WITH CHECK (clinic_id = app_clinic_id());

-- Mavjud toʻlovlar: bemor ichida eng eski ishdan boshlab avtomat bogʻlanadi
-- (hamma oylarga, qaror 21/09/2026). Har tashrif va har toʻlov bemorning
-- yigʻma summa oʻqida oraliq — kesishgan qismi bogʻlanish miqdori
WITH v AS (
  SELECT id, clinic_id, patient_id, price,
    SUM(price) OVER w - price AS v_start,
    SUM(price) OVER w AS v_end
  FROM visits
  WHERE price > 0
  WINDOW w AS (PARTITION BY patient_id ORDER BY date, time NULLS FIRST, created_at, id ROWS UNBOUNDED PRECEDING)
), p AS (
  SELECT id, patient_id, amount,
    SUM(amount) OVER w - amount AS p_start,
    SUM(amount) OVER w AS p_end
  FROM payments
  WHERE cancelled_at IS NULL AND amount > 0
  WINDOW w AS (PARTITION BY patient_id ORDER BY date, created_at, id ROWS UNBOUNDED PRECEDING)
)
INSERT INTO "payment_allocations" ("id", "clinic_id", "payment_id", "visit_id", "amount")
SELECT gen_random_uuid(), v.clinic_id, p.id, v.id,
       LEAST(v.v_end, p.p_end) - GREATEST(v.v_start, p.p_start)
FROM v
JOIN p ON p.patient_id = v.patient_id
WHERE LEAST(v.v_end, p.p_end) - GREATEST(v.v_start, p.p_start) > 0;
