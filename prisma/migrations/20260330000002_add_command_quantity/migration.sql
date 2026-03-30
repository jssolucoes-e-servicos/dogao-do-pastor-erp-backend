-- Add quantity column to commands table
ALTER TABLE "commands" ADD COLUMN IF NOT EXISTS "quantity" INTEGER;
