-- GRANT ADMIN ACCESS
-- Run this in Supabase SQL Editor to make yourself an Admin.
-- 1. Replace 'your_email@example.com' with the email you signed up with.
-- 2. Run the script.

UPDATE user_profiles
SET role = 'admin'
WHERE email = 'your_email@example.com';

-- Verify it worked
SELECT * FROM user_profiles WHERE email = 'your_email@example.com';
