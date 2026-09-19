-- AlterTable
ALTER TABLE "visits" ADD COLUMN     "lab_cost" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lab_order_id" UUID;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_lab_order_id_fkey" FOREIGN KEY ("lab_order_id") REFERENCES "lab_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
