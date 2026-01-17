-- Migration: Add Nigerian Payment Methods Support
-- Date: 2026-01-16
-- Description: Adds payment_method and payment_reference fields to transactions table

-- Add payment method tracking columns
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_reference TEXT;

-- Add comment for documentation
COMMENT ON COLUMN transactions.payment_method IS 'Nigerian payment gateway used: FLUTTERWAVE, PAYSTACK, INTERSWITCH, BANK_TRANSFER, POS, CASH, OTHER';
COMMENT ON COLUMN transactions.payment_reference IS 'Payment reference/ID from payment provider for reconciliation';

-- Create index for faster payment method queries
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method ON transactions(payment_method) WHERE payment_method IS NOT NULL;
