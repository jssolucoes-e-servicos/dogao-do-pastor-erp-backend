/*
  Warnings:

  - The `status` column on the `withdrawals` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[withdrawalId]` on the table `commands` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "WithdrawalStatusEnum" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "commands" DROP CONSTRAINT "commands_orderId_fkey";

-- AlterTable
ALTER TABLE "commands" ADD COLUMN     "withdrawalId" TEXT,
ALTER COLUMN "orderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "withdrawals" DROP COLUMN "status",
ADD COLUMN     "status" "WithdrawalStatusEnum" NOT NULL DEFAULT 'PENDING';

-- DropEnum
DROP TYPE "WithdrawalStatus";

-- CreateIndex
CREATE UNIQUE INDEX "commands_withdrawalId_key" ON "commands"("withdrawalId");

-- CreateIndex
CREATE INDEX "withdrawals_partnerId_status_idx" ON "withdrawals"("partnerId", "status");

-- AddForeignKey
ALTER TABLE "commands" ADD CONSTRAINT "commands_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commands" ADD CONSTRAINT "commands_withdrawalId_fkey" FOREIGN KEY ("withdrawalId") REFERENCES "withdrawals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
