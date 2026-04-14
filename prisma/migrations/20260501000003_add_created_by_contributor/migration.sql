-- Adiciona createdByContributorId na tabela orders
-- Identifica quem fisicamente registrou a venda (app, PDV)
-- Diferente de sellerId que é a tag da célula para ranking/sorteio

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "createdByContributorId" TEXT;

CREATE INDEX IF NOT EXISTS "orders_createdByContributorId_idx" ON "orders"("createdByContributorId");
