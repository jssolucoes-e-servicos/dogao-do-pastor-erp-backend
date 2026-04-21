-- Tabela de repasses individuais de acerto financeiro
-- Um settlement pode ter múltiplos repasses parciais

CREATE TABLE IF NOT EXISTS "cash_settlement_payments" (
  "id"              TEXT NOT NULL,
  "settlementId"    TEXT NOT NULL,
  "amount"          DOUBLE PRECISION NOT NULL,
  "paymentMethod"   TEXT NOT NULL,  -- 'PIX_QRCODE' | 'PIX_IVC' | 'CASH'
  "status"          TEXT NOT NULL DEFAULT 'SUBMITTED', -- 'SUBMITTED' | 'CONFIRMED' | 'CANCELLED'
  "receiptUrl"      TEXT,
  "receiptDate"     TIMESTAMP(3),
  "mpPaymentId"     TEXT,
  "pixQrCode"       TEXT,
  "pixCopyPaste"    TEXT,
  "notes"           TEXT,
  "submittedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "confirmedAt"     TIMESTAMP(3),
  "confirmedById"   TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt"       TIMESTAMP(3),
  CONSTRAINT "cash_settlement_payments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cash_settlement_payments_settlementId_fkey"
    FOREIGN KEY ("settlementId") REFERENCES "cash_settlements"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "cash_settlement_payments_settlementId_idx" ON "cash_settlement_payments"("settlementId");
CREATE INDEX IF NOT EXISTS "cash_settlement_payments_status_idx" ON "cash_settlement_payments"("status");
