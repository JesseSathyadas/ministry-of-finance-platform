-- FINAL PRODUCTION FIX & OPTIMIZATION
-- 1. SET jessemonu999@gmail.com AS SUPER ADMIN
UPDATE public.user_profiles
SET role = 'super_admin', is_active = true
WHERE email = 'jessemonu999@gmail.com';

-- 2. UPDATE ALLOWED STATUSES (Schema Enforcement)
-- We'll allow: 'pending', 'under_review', 'forwarded_to_admin', 'approved', 'rejected'
DO $$ 
BEGIN
    -- Check if we need to update any CHECK constraints if they exist
    ALTER TABLE public.scheme_applications DROP CONSTRAINT IF EXISTS scheme_applications_status_check;
    ALTER TABLE public.scheme_applications ADD CONSTRAINT scheme_applications_status_check 
    CHECK (status IN ('pending', 'under_review', 'forwarded_to_admin', 'approved', 'rejected'));
END $$;

-- 3. PERFORMANCE: ADD MISSING INDEXES
CREATE INDEX IF NOT EXISTS idx_scheme_applications_citizen_id ON public.scheme_applications(citizen_id);
CREATE INDEX IF NOT EXISTS idx_scheme_applications_scheme_id ON public.scheme_applications(scheme_id);
CREATE INDEX IF NOT EXISTS idx_scheme_applications_status ON public.scheme_applications(status);

-- 4. RE-FIX RLS RECURSION (Fast Version)
-- Use a secure cached role function to avoid re-querying user_profiles in every RLS check
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Update policies to use get_my_role() for speed
DROP POLICY IF EXISTS "Staff View All" ON scheme_applications;
CREATE POLICY "Staff View All" 
ON scheme_applications FOR SELECT 
USING (public.get_my_role() IN ('admin', 'super_admin', 'analyst'));

DROP POLICY IF EXISTS "Staff Update (Review)" ON scheme_applications;
CREATE POLICY "Staff Update (Review)" 
ON scheme_applications FOR UPDATE 
USING (public.get_my_role() IN ('admin', 'super_admin', 'analyst'));

-- 5. VERIFY ADMIM
SELECT email, role FROM public.user_profiles WHERE email = 'jessemonu999@gmail.com';
