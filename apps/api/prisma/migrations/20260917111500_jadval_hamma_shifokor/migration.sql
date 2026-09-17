-- Jadvalda hamma shifokorning qabullarini koʻrish — `schedule.all`
-- (tz.md 14-boʻlim, 10.7). Shifokor bu ruxsatsiz faqat oʻz qabullarini
-- koʻradi. Rollar har klinikaga nusxalangan — yangi ruxsat shablon kodida
-- paydo boʻlsa ham bazadagi qatorlarga oʻzi tushmaydi. Egasi va qabulxona
-- shabloni oladi; klinika keyin Rollar sahifasida oʻzgartira oladi
UPDATE "roles"
SET "permissions" = array_append("permissions", 'schedule.all')
WHERE ("is_owner" OR "template" = 'qabulxona') AND NOT ('schedule.all' = ANY("permissions"));
