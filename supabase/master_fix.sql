-- MASTER FIX SCRIPT
-- Run this ENTIRE script in Supabase SQL Editor to fix Permissions, RLS, and User Roles.

-- 1. FIX RLS RECURSION (Critical for Admin View)
-- Defines a secure function to check admin status without triggering infinite loops.
CREATE OR REPLACE FUNCTION is_admin_or_super()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. RESET POLICIES
-- Drop potentially broken policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON user_profiles;
DROP POLICY IF EXISTS "Public users view public metrics" ON financial_metrics;

-- Re-create correct policies
CREATE POLICY "Admins can view all profiles"
    ON user_profiles FOR SELECT
    USING (is_admin_or_super());

CREATE POLICY "Admins can update profiles"
    ON user_profiles FOR UPDATE
    USING (is_admin_or_super());

CREATE POLICY "Public users view public metrics"
    ON financial_metrics FOR SELECT
    USING (
        is_public = true OR
        is_admin_or_super() OR 
        (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'analyst'
    );

-- 3. FORCE ROLE ASSIGNMENT
-- Ensures your specific accounts have the right privileges
UPDATE public.user_profiles
SET role = 'admin'
WHERE email = 'jessemonu999@gmail.com';

UPDATE public.user_profiles
SET role = 'analyst'
WHERE email = 'jessemonu333@gmail.com';

-- 4. ENSURE PROFILES EXIST
-- Creates profiles for any auth user that is missing one
INSERT INTO public.user_profiles (id, email, full_name, role)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), 
    'public_user'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.user_profiles);

-- 5. VERIFY
SELECT email, role FROM public.user_profiles ORDER BY created_at DESC;
