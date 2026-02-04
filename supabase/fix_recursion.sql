-- FIX: Infinite Recursion in RLS Policies
-- Run this script in the Supabase SQL Editor to resolve the 500 Error.

-- 1. Create a secure helper function to check admin status without recursing into the user_profiles table policies
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

-- 2. Drop the existing recursive policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON user_profiles;

-- 3. Create new non-recursive policies using the helper function
CREATE POLICY "Admins can view all profiles"
    ON user_profiles FOR SELECT
    USING (is_admin_or_super());

CREATE POLICY "Admins can update profiles"
    ON user_profiles FOR UPDATE
    USING (is_admin_or_super());

-- 4. Ensure public users can read basic profile info (if needed for resolving names)
-- NOTE: The "Users can view own profile" policy already exists and is fine.
