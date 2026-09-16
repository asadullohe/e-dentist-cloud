-- Ish haqi ruxsatlari mavjud rollarga (tz.md 15-boʻlim). Rollar har
-- klinikaga nusxalangan — yangi ruxsat shablon kodida paydo boʻlsa ham
-- bazadagi qatorlarga oʻzi tushmaydi. Egasi: ikkalasi. Shifokor shabloni:
-- oʻz hisobi. Klinika keyin Rollar sahifasida oʻzgartira oladi
UPDATE "roles"
SET "permissions" = array_append("permissions", 'payroll.manage')
WHERE "is_owner" AND NOT ('payroll.manage' = ANY("permissions"));

UPDATE "roles"
SET "permissions" = array_append("permissions", 'payroll.own')
WHERE ("is_owner" OR "template" = 'shifokor') AND NOT ('payroll.own' = ANY("permissions"));
