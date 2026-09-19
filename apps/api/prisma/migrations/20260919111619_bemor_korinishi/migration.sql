-- AlterTable
ALTER TABLE "images" ADD COLUMN     "uploaded_by" UUID;

-- Shifokor faqat oʻz bemorlarini koʻradi (tz.md 14-boʻlim, 11-bosqich).
-- Hammasini `patients.all` ochadi: egasi, qabulxona (pul va navbat),
-- kuzatuvchi (hisobot). Rollar har klinikaga nusxalangan — mavjud
-- qatorlarga shu yerda tushadi
UPDATE "roles"
SET "permissions" = array_append("permissions", 'patients.all')
WHERE ("is_owner" OR "template" IN ('qabulxona', 'kuzatuvchi'))
  AND NOT ('patients.all' = ANY("permissions"));
