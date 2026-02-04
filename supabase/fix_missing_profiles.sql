-- FIX: Missing User Profiles
-- Run this in Supabase SQL Editor to ensure all auth users have a profile.

INSERT INTO public.user_profiles (id, email, role, full_name)
SELECT 
    id, 
    email, 
    'public_user',
    split_part(email, '@', 1) -- Use part of email as name
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.user_profiles);

-- Verify Admin Authority
-- Ensure at least one admin exists (you can change the email to your specific admin email)
-- UPDATE user_profiles SET role = 'admin' WHERE email = 'your_admin_email@example.com';
