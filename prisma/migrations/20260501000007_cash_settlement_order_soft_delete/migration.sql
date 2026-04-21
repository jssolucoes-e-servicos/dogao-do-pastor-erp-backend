-- Adiciona deletedAt em cash_settlement_orders para compatibilidade com soft-delete extension
ALTER TABLE "cash_settlement_orders" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
