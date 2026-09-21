-- Tashrif vaqti (12-bosqich). Qogʻozga yozib keyinroq kiritilgan tashrifda
-- ham haqiqiy qabul vaqti tursin. «HH:MM» matn: saralash uchun yetarli,
-- TIME ustuni Prisma da noqulay. Eski yozuvlarda boʻsh qoladi
ALTER TABLE "visits" ADD COLUMN "time" VARCHAR(5);
