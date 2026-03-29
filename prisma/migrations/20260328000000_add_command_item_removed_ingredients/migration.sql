-- CreateTable: commands_items (CommandItem) + removedIngredients
CREATE TABLE "commands_items" (
    "id" TEXT NOT NULL,
    "commandId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "removedIngredients" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "producced" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "commands_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "commands_items_commandId_itemId_producced_idx" ON "commands_items"("commandId", "itemId", "producced");

-- AddForeignKey
ALTER TABLE "commands_items" ADD CONSTRAINT "commands_items_commandId_fkey" FOREIGN KEY ("commandId") REFERENCES "commands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commands_items" ADD CONSTRAINT "commands_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "orders_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
