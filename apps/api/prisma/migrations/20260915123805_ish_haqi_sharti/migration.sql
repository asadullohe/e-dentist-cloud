-- Xodimning ish haqi sharti: oylik va foiz (tz.md 15-boʻlim).
-- Chegaralar bazada: foiz 0..100, oylik manfiy emas — API tekshiruvi
-- chetlab oʻtilsa ham notoʻgʻri son yozilmaydi
ALTER TABLE "users" ADD COLUMN "salary_amount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "pay_percent" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "users" ADD CONSTRAINT "users_salary_amount_check" CHECK ("salary_amount" >= 0);
ALTER TABLE "users" ADD CONSTRAINT "users_pay_percent_check" CHECK ("pay_percent" BETWEEN 0 AND 100);
