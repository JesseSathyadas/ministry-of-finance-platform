-- COMPREHENSIVE REPAIR: Schemes Table Structure
-- Run this in Supabase SQL Editor to fully sync your table structure.

-- 1. Create the scheme_status ENUM type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE scheme_status AS ENUM ('draft', 'active', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add all potentially missing columns to the schemes table
ALTER TABLE schemes 
ADD COLUMN IF NOT EXISTS status scheme_status DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS benefit_amount NUMERIC(15, 2),
ADD COLUMN IF NOT EXISTS eligibility_criteria JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS benefits TEXT[] DEFAULT '{}';

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_schemes_status ON schemes(status);
CREATE INDEX IF NOT EXISTS idx_schemes_ministry ON schemes(ministry);

-- 4. Enable RLS if not already enabled
ALTER TABLE schemes ENABLE ROW LEVEL SECURITY;

-- 5. Re-apply the schemes RLS policies (Safe re-run)
DROP POLICY IF EXISTS "Public can view active schemes" ON schemes;
CREATE POLICY "Public can view active schemes"
    ON schemes FOR SELECT
    USING (status = 'active');

DROP POLICY IF EXISTS "Admins can view all schemes" ON schemes;
CREATE POLICY "Admins can view all schemes"
    ON schemes FOR SELECT
    USING (is_admin_or_super());

DROP POLICY IF EXISTS "Admins can create schemes" ON schemes;
CREATE POLICY "Admins can create schemes"
    ON schemes FOR INSERT
    WITH CHECK (is_admin_or_super());

DROP POLICY IF EXISTS "Admins can update schemes" ON schemes;
CREATE POLICY "Admins can update schemes"
    ON schemes FOR UPDATE
    USING (is_admin_or_super());
