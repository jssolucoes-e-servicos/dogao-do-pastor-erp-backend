-- Add paymentReminderSent column to orders table
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentReminderSent" BOOLEAN NOT NULL DEFAULT false;
