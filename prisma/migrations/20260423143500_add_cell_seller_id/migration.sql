-- AlterTable
ALTER TABLE "cells" ADD COLUMN "seller_id" TEXT;

-- AddForeignKey
ALTER TABLE "cells" ADD CONSTRAINT "cells_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
