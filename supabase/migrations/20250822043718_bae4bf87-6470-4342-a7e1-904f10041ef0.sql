-- Fix RLS policies to prevent infinite recursion
DROP POLICY IF EXISTS "HO admin can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Branch managers can view branch staff" ON profiles;

-- Create a helper function to check user role without recursion
CREATE OR REPLACE FUNCTION check_user_role(check_user_id uuid, required_role user_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1 FROM profiles 
    WHERE user_id = check_user_id 
    AND role = required_role 
    AND is_active = true
  );
$$;

-- Recreate policies without recursion
CREATE POLICY "HO admin can manage all profiles" 
ON profiles 
FOR ALL 
USING (check_user_role(auth.uid(), 'ho_admin'::user_role));

CREATE POLICY "Branch managers can view branch staff" 
ON profiles 
FOR SELECT 
USING (
  check_user_role(auth.uid(), 'branch_manager'::user_role) 
  AND branch_id = (SELECT branch_id FROM profiles WHERE user_id = auth.uid())
);

-- Create user accounts in auth.users and profiles
-- Note: These will be created with temporary passwords, users should change them

-- Insert Branch Hub user
DO $$
DECLARE
    hub_user_id uuid;
    hub_branch_id uuid;
BEGIN
    -- Get hub branch ID
    SELECT id INTO hub_branch_id FROM branches WHERE code = 'ZCC001';
    
    -- Create user in auth (this is a placeholder - actual user creation needs to be done via signup)
    -- For now, create profile entries that can be linked when users sign up
    INSERT INTO profiles (id, user_id, full_name, phone, role, branch_id, is_active) 
    VALUES (
        gen_random_uuid(),
        NULL, -- Will be set when user signs up
        'Manager Branch Hub',
        '021-5555555',
        'branch_manager',
        hub_branch_id,
        true
    );
END $$;

-- Insert Branch OTW user  
DO $$
DECLARE
    otw_user_id uuid;
    otw_branch_id uuid;
BEGIN
    -- Get OTW branch ID
    SELECT id INTO otw_branch_id FROM branches WHERE code = 'ZCM001';
    
    INSERT INTO profiles (id, user_id, full_name, phone, role, branch_id, is_active)
    VALUES (
        gen_random_uuid(),
        NULL, -- Will be set when user signs up
        'Manager Branch OTW',
        '021-6666666', 
        'branch_manager',
        otw_branch_id,
        true
    );
END $$;

-- Insert Mobile Seller user
DO $$
DECLARE
    seller_user_id uuid;
    hub_branch_id uuid;
BEGIN
    -- Get hub branch ID (mobile seller assigned to hub)
    SELECT id INTO hub_branch_id FROM branches WHERE code = 'ZCC001';
    
    INSERT INTO profiles (id, user_id, full_name, phone, role, branch_id, is_active)
    VALUES (
        gen_random_uuid(),
        NULL, -- Will be set when user signs up
        'Mobile Seller Hub',
        '081-7777777',
        'rider', 
        hub_branch_id,
        true
    );
END $$;