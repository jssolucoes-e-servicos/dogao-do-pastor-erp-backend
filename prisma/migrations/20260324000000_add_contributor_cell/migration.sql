-- CreateTable
CREATE TABLE "contributors_cells" (
    "id" TEXT NOT NULL,
    "cellId" TEXT NOT NULL,
    "contributorId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "contributors_cells_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contributors_cells_cellId_idx" ON "contributors_cells"("cellId");

-- AddForeignKey
ALTER TABLE "contributors_cells" ADD CONSTRAINT "contributors_cells_cellId_fkey" FOREIGN KEY ("cellId") REFERENCES "cells"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributors_cells" ADD CONSTRAINT "contributors_cells_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "contributors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributors_cells" ADD CONSTRAINT "contributors_cells_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "sellers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
