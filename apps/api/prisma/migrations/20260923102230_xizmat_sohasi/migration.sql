-- Xizmatning qoʻllanish sohasi (qaror 23/09/2026, tz.md 19-boʻlim): dastur
-- shunga qarab tish soʻraydi yoki soʻramaydi. Sanoatda («treatment area»)
-- shunday qilingan — Dentrix da yettita qiymat, bizga toʻrttasi yetadi.

CREATE TYPE "ServiceArea" AS ENUM ('tooth', 'range', 'arch', 'mouth');

ALTER TABLE "services" ADD COLUMN "area" "ServiceArea" NOT NULL DEFAULT 'tooth';

-- Mavjud xizmatlarga nom boʻyicha taxmin. Taxmin — taxmin: Xizmatlar
-- sahifasida soha koʻrinib turadi va egasi bir marta koʻzdan kechiradi.
-- Kalit soʻzlar ikkala tilda; qidiruv registrsiz va «oʻ/o'» farqisiz emas —
-- nomlar katalogda qanday yozilgan boʻlsa, shunday qidiriladi
UPDATE "services"
SET "area" = 'mouth'
WHERE lower("name") SIMILAR TO
  '%(tozalash|gigiyena|gigiena|oqartirish|koʻrik|korik|ko''rik|konsultatsiya|maslahat|чистка|гигиена|отбеливание|осмотр|консультация)%';

UPDATE "services"
SET "area" = 'arch'
WHERE lower("name") SIMILAR TO '%(protez|bugel|byugel|протез|бюгель)%'
  -- «Koʻprik protezi» — oraliq, jagʻ emas
  AND lower("name") NOT SIMILAR TO '%(koʻprik|koprik|ko''prik|мост)%';

UPDATE "services"
SET "area" = 'range'
WHERE lower("name") SIMILAR TO '%(koʻprik|koprik|ko''prik|мост)%';
