-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "cancel_reason" TEXT,
ADD COLUMN     "cancelled_at" TIMESTAMPTZ(3),
ADD COLUMN     "cancelled_by" UUID,
ADD COLUMN     "created_by" UUID;

-- Shifokor toʻlov qabul qiladi (qaror 19/09/2026): shablonga payments.read
-- va payments.write. Rollar har klinikaga nusxalangan — mavjud qatorlarga
-- shu yerda tushadi; klinika keyin Rollar sahifasida oʻzgartira oladi
UPDATE "roles"
SET "permissions" = array_append("permissions", 'payments.read')
WHERE "template" = 'shifokor' AND NOT ('payments.read' = ANY("permissions"));

UPDATE "roles"
SET "permissions" = array_append("permissions", 'payments.write')
WHERE "template" = 'shifokor' AND NOT ('payments.write' = ANY("permissions"));
