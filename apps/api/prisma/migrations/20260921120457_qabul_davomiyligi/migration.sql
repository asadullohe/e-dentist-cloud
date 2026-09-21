-- Qabul davomiyligi (12-bosqich): jadvalda blok uzunligi va bir shifokorga
-- kesishgan vaqt tekshiruvi shunga qaraydi. Mavjud qabullar 30 daqiqa
ALTER TABLE "appointments" ADD COLUMN "duration_min" INTEGER NOT NULL DEFAULT 30;
