-- Evolução do sistema de acertos financeiros
-- Adiciona suporte a: PIX QR Code MP, comprovante de PIX, registro direto pela tesoureira

-- Novos tipos de pagamento e status
ALTER TYPE "CashSettlementStatusEnum" ADD VALUE IF NOT EXISTS 'PROCESSING'; -- aguardando confirmação MP

-- Adiciona campos ao cash_settlements
ALTER TABLE "cash_settlements"
  ADD COLUMN IF NOT EXISTS "paymentType"     TEXT,           -- 'PIX_QRCODE' | 'PIX_IVC' | 'CASH'
  ADD COLUMN IF NOT EXISTS "amount"          DOUBLE PRECISION, -- valor do repasse (pode ser parcial)
  ADD COLUMN IF NOT EXISTS "mpPaymentId"     TEXT,           -- ID do pagamento no MP (PIX QR Code)
  ADD COLUMN IF NOT EXISTS "pixQrCode"       TEXT,           -- QR Code base64
  ADD COLUMN IF NOT EXISTS "pixCopyPaste"    TEXT,           -- código copia e cola
  ADD COLUMN IF NOT EXISTS "receiptUrl"      TEXT,           -- URL do comprovante no MinIO
  ADD COLUMN IF NOT EXISTS "receiptDate"     TIMESTAMP(3),   -- data do comprovante
  ADD COLUMN IF NOT EXISTS "registeredById"  TEXT;           -- tesoureira registrou direto

CREATE INDEX IF NOT EXISTS "cash_settlements_mpPaymentId_idx" ON "cash_settlements"("mpPaymentId");
