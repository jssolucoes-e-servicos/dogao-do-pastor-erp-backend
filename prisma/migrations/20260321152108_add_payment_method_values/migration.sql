-- Add PIX_OFFLINE and TICKET to PaymentMethodEnum (already applied via db push)
ALTER TYPE "PaymentMethodEnum" ADD VALUE IF NOT EXISTS 'PIX_OFFLINE';
ALTER TYPE "PaymentMethodEnum" ADD VALUE IF NOT EXISTS 'TICKET';
