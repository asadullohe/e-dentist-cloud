-- Ish haqi toʻlovi ↔ xarajat bogʻlanishi (tz.md 15-boʻlim). Summa va sana
-- xarajatda; bu jadval faqat «qaysi xodim, qaysi oy» ni biladi
CREATE TABLE "staff_payouts" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "month" DATE NOT NULL,
    "expense_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_payouts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "staff_payouts_expense_id_key" ON "staff_payouts"("expense_id");
CREATE INDEX "staff_payouts_clinic_id_month_idx" ON "staff_payouts"("clinic_id", "month");
CREATE INDEX "staff_payouts_clinic_id_user_id_month_idx" ON "staff_payouts"("clinic_id", "user_id", "month");

ALTER TABLE "staff_payouts" ADD CONSTRAINT "staff_payouts_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- Xarajat oʻchsa bogʻlanish ham ketadi — «toʻlangan» qaytadan sanaladi
ALTER TABLE "staff_payouts" ADD CONSTRAINT "staff_payouts_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS. Yangi jadval qoʻshilganda ikki joy yangilanadi: shu siyosat va
-- platform/tenant.ts dagi TENANT_MODELS (tz.md 5-boʻlim)
ALTER TABLE "staff_payouts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_payouts_ijarachi" ON "staff_payouts"
  FOR ALL
  USING (clinic_id = app_clinic_id())
  WITH CHECK (clinic_id = app_clinic_id());
