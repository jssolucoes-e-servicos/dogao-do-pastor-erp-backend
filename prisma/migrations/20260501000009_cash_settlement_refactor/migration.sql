-- Refatora cash_settlements: remove campos de repasse individual (agora em cash_settlement_payments)
-- Adiciona paidAmount para rastrear total já confirmado

ALTER TABLE "cash_settlements"
  ADD COLUMN IF NOT EXISTS "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Remove campos que migraram para cash_settlement_payments (mantém por compatibilidade, serão ignorados)
-- Não removemos para não quebrar dados existentes, apenas paramos de usar
