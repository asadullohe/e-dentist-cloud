-- Jadvalni koʻrish alohida ruxsat boʻldi (14.5): avval `GET /appointments`
-- `patients.read` bilan ochilardi, menyudagi boʻlim esa `schedule.write`
-- bilan koʻrinardi — kuzatuvchi jadvalni umuman koʻra olmasdi.

-- Yoza oladigan har kim koʻra ham oladi: hech kim hech narsa yoʻqotmaydi
UPDATE "roles"
SET "permissions" = array_append("permissions", 'schedule.read')
WHERE 'schedule.write' = ANY ("permissions")
  AND NOT ('schedule.read' = ANY ("permissions"));

-- Kuzatuvchi (buxgalter, stajyor): hamma shifokorning jadvalini koʻradi,
-- lekin yoza olmaydi
UPDATE "roles"
SET "permissions" = array_append("permissions", 'schedule.read')
WHERE "template" = 'kuzatuvchi'
  AND NOT ('schedule.read' = ANY ("permissions"));

UPDATE "roles"
SET "permissions" = array_append("permissions", 'schedule.all')
WHERE "template" = 'kuzatuvchi'
  AND NOT ('schedule.all' = ANY ("permissions"));
