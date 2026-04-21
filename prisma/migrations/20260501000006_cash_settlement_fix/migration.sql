-- Corrige inconsistência: migration v2 criou "paymentType" mas o schema usa "paymentMethod"
-- Renomeia paymentType → paymentMethod (se existir) e garante que todos os campos estão presentes

DO $$
BEGIN
  -- Renomeia paymentType para paymentMethod se existir
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cash_settlements' AND column_name = 'paymentType'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cash_settlements' AND column_name = 'paymentMethod'
  ) THEN
    ALTER TABLE "cash_settlements" RENAME COLUMN "paymentType" TO "paymentMethod";
  END IF;

  -- Garante que paymentMethod existe (caso a migration v2 não tenha rodado)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cash_settlements' AND column_name = 'paymentMethod'
  ) THEN
    ALTER TABLE "cash_settlements" ADD COLUMN "paymentMethod" TEXT;
  END IF;

  -- Garante demais campos da v2
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cash_settlements' AND column_name = 'amount') THEN
    ALTER TABLE "cash_settlements" ADD COLUMN "amount" DOUBLE PRECISION;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cash_settlements' AND column_name = 'mpPaymentId') THEN
    ALTER TABLE "cash_settlements" ADD COLUMN "mpPaymentId" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cash_settlements' AND column_name = 'pixQrCode') THEN
    ALTER TABLE "cash_settlements" ADD COLUMN "pixQrCode" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cash_settlements' AND column_name = 'pixCopyPaste') THEN
    ALTER TABLE "cash_settlements" ADD COLUMN "pixCopyPaste" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cash_settlements' AND column_name = 'receiptUrl') THEN
    ALTER TABLE "cash_settlements" ADD COLUMN "receiptUrl" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cash_settlements' AND column_name = 'receiptDate') THEN
    ALTER TABLE "cash_settlements" ADD COLUMN "receiptDate" TIMESTAMP(3);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cash_settlements' AND column_name = 'registeredById') THEN
    ALTER TABLE "cash_settlements" ADD COLUMN "registeredById" TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "cash_settlements_mpPaymentId_idx" ON "cash_settlements"("mpPaymentId");
