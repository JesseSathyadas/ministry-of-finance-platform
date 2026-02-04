-- ASSIGN ROLES
-- Updates roles for specific users provided by the user.

-- 1. jessemonu999@gmail.com -> ADMIN
UPDATE public.user_profiles
SET role = 'admin'
WHERE email = 'jessemonu999@gmail.com';

-- 2. jessemonu333@gmail.com -> ANALYST
UPDATE public.user_profiles
SET role = 'analyst'
WHERE email = 'jessemonu333@gmail.com';

-- 3. Verify
SELECT email, role FROM public.user_profiles 
WHERE email IN ('jessemonu999@gmail.com', 'jessemonu333@gmail.com');
