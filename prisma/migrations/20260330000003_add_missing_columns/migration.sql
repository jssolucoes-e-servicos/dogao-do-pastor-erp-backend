-- Add missing columns that exist in schema but were never migrated

-- orders_items: commanded field
ALTER TABLE "orders_items" ADD COLUMN IF NOT EXISTS "commanded" BOOLEAN NOT NULL DEFAULT false;

-- orders: paymentReminderSent (safety — already in 20260321153000 but may be missing)
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentReminderSent" BOOLEAN NOT NULL DEFAULT false;

-- commands: quantity (safety — already in 20260330000002 but may be missing)
ALTER TABLE "commands" ADD COLUMN IF NOT EXISTS "quantity" INTEGER;
