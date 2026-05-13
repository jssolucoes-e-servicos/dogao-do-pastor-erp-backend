-- AlterTable
ALTER TABLE "editions" ADD COLUMN "comboActive" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "orders_items" ADD COLUMN "isPromo" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "customers_addresses" ADD COLUMN "lat" DOUBLE PRECISION;
ALTER TABLE "customers_addresses" ADD COLUMN "lng" DOUBLE PRECISION;
