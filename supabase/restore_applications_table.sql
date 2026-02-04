-- RESTORE: Scheme Applications Table
-- Run this in Supabase SQL Editor to fix the "Could not find table" error.

CREATE TABLE IF NOT EXISTS scheme_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    citizen_id UUID REFERENCES user_profiles(id) NOT NULL,
    scheme_id UUID REFERENCES schemes(id) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
    application_data JSONB DEFAULT '{}',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES user_profiles(id),
    review_notes TEXT,
    UNIQUE(citizen_id, scheme_id) -- Prevent duplicate applications
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scheme_applications_citizen ON scheme_applications(citizen_id);
CREATE INDEX IF NOT EXISTS idx_scheme_applications_scheme ON scheme_applications(scheme_id);
CREATE INDEX IF NOT EXISTS idx_scheme_applications_status ON scheme_applications(status);

-- Enable RLS
ALTER TABLE scheme_applications ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Citizens can view ONLY their own applications
DROP POLICY IF EXISTS "Citizens view own applications" ON scheme_applications;
CREATE POLICY "Citizens view own applications"
    ON scheme_applications FOR SELECT
    USING (auth.uid() = citizen_id);

-- 2. Citizens can insert their own applications
DROP POLICY IF EXISTS "Citizens submit applications" ON scheme_applications;
CREATE POLICY "Citizens submit applications"
    ON scheme_applications FOR INSERT
    WITH CHECK (auth.uid() = citizen_id);

-- 3. Admins/Analysts can view ALL applications
DROP POLICY IF EXISTS "Staff view all applications" ON scheme_applications;
CREATE POLICY "Staff view all applications"
    ON scheme_applications FOR SELECT
    USING (is_admin_or_super() OR EXISTS (
        SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'analyst'
    ));

-- 4. Admins/Analysts can update applications (for review)
DROP POLICY IF EXISTS "Staff update applications" ON scheme_applications;
CREATE POLICY "Staff update applications"
    ON scheme_applications FOR UPDATE
    USING (is_admin_or_super() OR EXISTS (
        SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'analyst'
    ));
