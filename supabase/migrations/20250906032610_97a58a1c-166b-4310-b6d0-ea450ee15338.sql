-- Create enhanced user role permissions with granular permissions
CREATE TYPE permission_action AS ENUM ('view', 'insert', 'update', 'delete', 'approve', 'release');

-- Enhanced user role permissions table
CREATE TABLE user_role_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name text NOT NULL,
    module_name text NOT NULL,
    permission_action permission_action NOT NULL,
    is_granted boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(role_name, module_name, permission_action)
);

-- Enable RLS on enhanced permissions table
ALTER TABLE user_role_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies for user role permissions
CREATE POLICY "HO admin can manage role permissions" 
ON user_role_permissions 
FOR ALL 
TO authenticated 
USING (get_current_user_role() = 'ho_admin' OR get_current_user_role() = 'ho_owner');

CREATE POLICY "Branch managers can view role permissions" 
ON user_role_permissions 
FOR SELECT 
TO authenticated 
USING (get_current_user_role() = 'branch_manager' OR get_current_user_role() = 'bh_staff');

-- Insert default permissions for existing roles
INSERT INTO user_role_permissions (role_name, module_name, permission_action, is_granted) VALUES
-- HO Admin permissions (full access)
('ho_admin', 'dashboard', 'view', true),
('ho_admin', 'users', 'view', true),
('ho_admin', 'users', 'insert', true),
('ho_admin', 'users', 'update', true),
('ho_admin', 'users', 'delete', true),
('ho_admin', 'branches', 'view', true),
('ho_admin', 'branches', 'insert', true),
('ho_admin', 'branches', 'update', true),
('ho_admin', 'branches', 'delete', true),
('ho_admin', 'inventory', 'view', true),
('ho_admin', 'inventory', 'insert', true),
('ho_admin', 'inventory', 'update', true),
('ho_admin', 'inventory', 'delete', true),
('ho_admin', 'transactions', 'view', true),
('ho_admin', 'transactions', 'approve', true),
('ho_admin', 'reports', 'view', true),
('ho_admin', 'reports', 'approve', true),
('ho_admin', 'finance', 'view', true),
('ho_admin', 'finance', 'insert', true),
('ho_admin', 'finance', 'update', true),

-- Branch Manager permissions
('branch_manager', 'dashboard', 'view', true),
('branch_manager', 'users', 'view', true),
('branch_manager', 'users', 'insert', true),
('branch_manager', 'users', 'update', true),
('branch_manager', 'inventory', 'view', true),
('branch_manager', 'inventory', 'insert', true),
('branch_manager', 'inventory', 'update', true),
('branch_manager', 'transactions', 'view', true),
('branch_manager', 'reports', 'view', true),
('branch_manager', 'reports', 'approve', true),
('branch_manager', 'finance', 'view', true),

-- Rider permissions
('rider', 'dashboard', 'view', true),
('rider', 'inventory', 'view', true),
('rider', 'inventory', 'update', true),
('rider', 'transactions', 'view', true),
('rider', 'transactions', 'insert', true),
('rider', 'customers', 'view', true),
('rider', 'customers', 'insert', true);

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_user_role_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_user_role_permissions_updated_at
    BEFORE UPDATE ON user_role_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_role_permissions_updated_at();