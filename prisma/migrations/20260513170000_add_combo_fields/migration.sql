-- AlterTable
ALTER TABLE "editions" ADD COLUMN "comboActive" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "orders_items" ADD COLUMN "isPromo" BOOLEAN NOT NULL DEFAULT false;
