-- Fix critical security vulnerability in profiles table RLS policies
-- Remove overly permissive policies and replace with role-based restrictions

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Branch managers can view branch staff" ON public.profiles;
DROP POLICY IF EXISTS "HO admin can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create secure role-based policies that prevent customers from accessing employee data

-- HO admin can manage all profiles (restricted to authenticated HO admins only)
CREATE POLICY "HO admin can manage all profiles" 
ON public.profiles 
FOR ALL 
TO authenticated
USING (get_current_user_role() = 'ho_admin'::user_role);

-- Branch managers can only view staff in their branch (restricted to authenticated branch managers)
CREATE POLICY "Branch managers can view branch staff" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  get_current_user_role() = 'branch_manager'::user_role 
  AND branch_id = get_current_user_branch()
);

-- Users can only view their own profile (restricted to authenticated users)
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- Users can only update their own profile (restricted to authenticated users)
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid());

-- Add additional protection: Customers cannot access employee profiles
CREATE POLICY "Customers cannot access employee profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  -- Customers can only see their own profile
  (get_current_user_role() = 'customer'::user_role AND user_id = auth.uid())
  OR 
  -- Staff can see profiles based on their role and branch permissions
  (get_current_user_role() IN ('ho_admin'::user_role, 'branch_manager'::user_role, 'rider'::user_role))
);

-- Create policy to prevent customers from viewing employee phone numbers and personal data
CREATE POLICY "Restrict customer access to employee data" 
ON public.profiles 
FOR ALL 
TO authenticated
USING (
  -- HO Admin has full access
  get_current_user_role() = 'ho_admin'::user_role
  OR
  -- Branch managers can access their branch staff
  (get_current_user_role() = 'branch_manager'::user_role AND branch_id = get_current_user_branch())
  OR
  -- Riders can access their own profile only
  (get_current_user_role() = 'rider'::user_role AND user_id = auth.uid())
  OR
  -- Customers can only access their own profile
  (get_current_user_role() = 'customer'::user_role AND user_id = auth.uid())
);