-- FIX: Add missing benefit_amount column to schemes table
-- Run this in Supabase SQL Editor BEFORE running the seed script.

ALTER TABLE schemes 
ADD COLUMN IF NOT EXISTS benefit_amount NUMERIC(15, 2);

-- Update comment for clarity
COMMENT ON COLUMN schemes.benefit_amount IS 'Monetary benefit amount in INR, if applicable';
