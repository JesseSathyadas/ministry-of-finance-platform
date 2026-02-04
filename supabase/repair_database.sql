-- REPAIR & SETUP SCRIPT
-- Run this in Supabase SQL Editor to ensure all tables and permissions are correct.

-- 1. Ensure SCHEMES table exists and has all columns
CREATE TABLE IF NOT EXISTS public.schemes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    ministry TEXT NOT NULL,
    description TEXT,
    benefits TEXT[] DEFAULT '{}',
    eligibility_criteria JSONB DEFAULT '{}',
    benefit_amount NUMERIC,
    status TEXT NOT NULL DEFAULT 'draft',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Ensure SCHEME_APPLICATIONS table exists
CREATE TABLE IF NOT EXISTS public.scheme_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scheme_id UUID REFERENCES public.schemes(id) ON DELETE CASCADE,
    citizen_id UUID REFERENCES public.user_profiles(id),
    application_data JSONB DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'under_review', 'approved', 'rejected'
    reviewed_by UUID REFERENCES public.user_profiles(id), -- This is crucial for the foreign key relation
    review_notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. FIX FOREIGN KEYS (Explicit Naming for Supabase Client)
-- The code uses specific foreign key names: scheme_applications_reviewed_by_fkey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'scheme_applications_reviewed_by_fkey') THEN
        ALTER TABLE public.scheme_applications
        ADD CONSTRAINT scheme_applications_reviewed_by_fkey
        FOREIGN KEY (reviewed_by) REFERENCES public.user_profiles(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'scheme_applications_citizen_id_fkey') THEN
        ALTER TABLE public.scheme_applications
        ADD CONSTRAINT scheme_applications_citizen_id_fkey
        FOREIGN KEY (citizen_id) REFERENCES public.user_profiles(id);
    END IF;
END $$;

-- 4. ENABLE RLS
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheme_applications ENABLE ROW LEVEL SECURITY;

-- 5. RELAXED POLICIES (Fixing 403s)

-- DROP OLD POLICIES to avoid conflicts
DROP POLICY IF EXISTS "Admins can manage schemes" ON schemes;
DROP POLICY IF EXISTS "Public can view active schemes" ON schemes;
DROP POLICY IF EXISTS "Public View Active Schemes" ON schemes; -- Fixed missing drop
DROP POLICY IF EXISTS "Admins Manage Schemes" ON schemes;
DROP POLICY IF EXISTS "Citizens can view own apps" ON scheme_applications;
DROP POLICY IF EXISTS "Citizens can submit apps" ON scheme_applications;
DROP POLICY IF EXISTS "Staff can view all apps" ON scheme_applications;
DROP POLICY IF EXISTS "Staff can review apps" ON scheme_applications;
DROP POLICY IF EXISTS "Citizens View Own" ON scheme_applications;
DROP POLICY IF EXISTS "Staff View All" ON scheme_applications;
DROP POLICY IF EXISTS "Citizens Submit" ON scheme_applications;
DROP POLICY IF EXISTS "Staff Update (Review)" ON scheme_applications;

-- RE-CREATE ROBUST POLICIES

-- Schemes
CREATE POLICY "Public View Active Schemes"
ON schemes FOR SELECT
USING (status = 'active' OR (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'analyst'));

CREATE POLICY "Admins Manage Schemes"
ON schemes FOR ALL
USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'));

-- Applications
CREATE POLICY "Citizens View Own"
ON scheme_applications FOR SELECT
USING (citizen_id = auth.uid());

CREATE POLICY "Staff View All"
ON scheme_applications FOR SELECT
USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'analyst'));

CREATE POLICY "Citizens Submit"
ON scheme_applications FOR INSERT
WITH CHECK (citizen_id = auth.uid());

CREATE POLICY "Staff Update (Review)"
ON scheme_applications FOR UPDATE
USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'analyst'));

-- 6. GRANT PERMISSIONS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schemes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.scheme_applications TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 7. VERIFY
SELECT 'Database Repair Complete' as status;
