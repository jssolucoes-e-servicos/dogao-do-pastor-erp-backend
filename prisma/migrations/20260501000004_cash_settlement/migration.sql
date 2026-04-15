-- Acerto financeiro de vendas em dinheiro feitas pelo app
-- Fluxo: venda dinheiro → saldo pendente → vendedor repassa → tesoureira confirma

CREATE TYPE "CashSettlementStatusEnum" AS ENUM (
  'PENDING',    -- saldo em aberto com o vendedor
  'SUBMITTED',  -- vendedor informou que repassou (PIX ou espécie)
  'CONFIRMED',  -- tesoureira confirmou o recebimento
  'CANCELLED'   -- cancelado/estornado
);

CREATE TABLE IF NOT EXISTS "cash_settlements" (
  "id"              TEXT NOT NULL,
  "contributorId"   TEXT NOT NULL,
  "editionId"       TEXT NOT NULL,
  "totalAmount"     DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status"          "CashSettlementStatusEnum" NOT NULL DEFAULT 'PENDING',
  "paymentMethod"   TEXT,                    -- 'PIX' | 'CASH' quando submitted
  "notes"           TEXT,
  "submittedAt"     TIMESTAMP(3),            -- quando o vendedor disse que pagou
  "confirmedAt"     TIMESTAMP(3),            -- quando a tesoureira confirmou
  "confirmedById"   TEXT,                    -- contributorId da tesoureira
  "active"          BOOLEAN NOT NULL DEFAULT true,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt"       TIMESTAMP(3),
  CONSTRAINT "cash_settlements_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cash_settlements_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "contributors"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "cash_settlements_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "editions"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Tabela de itens do acerto (quais orders estão incluídas)
CREATE TABLE IF NOT EXISTS "cash_settlement_orders" (
  "id"               TEXT NOT NULL,
  "settlementId"     TEXT NOT NULL,
  "orderId"          TEXT NOT NULL,
  "amount"           DOUBLE PRECISION NOT NULL,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cash_settlement_orders_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cash_settlement_orders_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "cash_settlements"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "cash_settlement_orders_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "cash_settlement_orders_orderId_key" UNIQUE ("orderId")
);

CREATE INDEX IF NOT EXISTS "cash_settlements_contributorId_editionId_idx" ON "cash_settlements"("contributorId", "editionId");
CREATE INDEX IF NOT EXISTS "cash_settlements_status_idx" ON "cash_settlements"("status");
