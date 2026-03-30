-- Migrate orders with origin TICKET to MANUAL before removing the enum value
-- This is safe to run even if no TICKET records exist
UPDATE "orders" SET "origin" = 'MANUAL' WHERE "origin"::text = 'TICKET';
