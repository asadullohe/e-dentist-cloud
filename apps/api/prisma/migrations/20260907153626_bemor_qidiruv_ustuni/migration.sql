/*
  Warnings:

  - Added the required column `fio_search` to the `patients` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "patients_clinic_id_fio_idx";

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "fio_search" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "patients_clinic_id_fio_search_idx" ON "patients"("clinic_id", "fio_search");
