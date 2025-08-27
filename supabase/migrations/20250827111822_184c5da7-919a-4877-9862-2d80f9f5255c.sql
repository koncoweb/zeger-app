-- Create user roles permissions system
CREATE TYPE permission_type AS ENUM (
  'view', 'insert', 'update', 'delete', 'approve', 'release'
);

CREATE TABLE user_role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_name TEXT NOT NULL,
  module_name TEXT NOT NULL,
  permission permission_type NOT NULL,
  is_granted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role_name, module_name, permission)
);

-- Enable RLS
ALTER TABLE user_role_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies for role permissions
CREATE POLICY "HO admin can manage role permissions"
ON user_role_permissions
FOR ALL
USING (get_current_user_role() = 'ho_admin');

CREATE POLICY "Branch managers can view role permissions"
ON user_role_permissions
FOR SELECT
USING (get_current_user_role() = 'branch_manager');

-- Insert default permissions for different roles
INSERT INTO user_role_permissions (role_name, module_name, permission, is_granted) VALUES
-- HO Admin permissions (full access)
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
('ho_admin', 'reports', 'view', true),
('ho_admin', 'reports', 'approve', true),
('ho_admin', 'financial', 'view', true),
('ho_admin', 'financial', 'insert', true),
('ho_admin', 'financial', 'update', true),
('ho_admin', 'financial', 'delete', true),

-- Branch Manager permissions
('branch_manager', 'users', 'view', true),
('branch_manager', 'users', 'insert', true),
('branch_manager', 'users', 'update', true),
('branch_manager', 'inventory', 'view', true),
('branch_manager', 'inventory', 'insert', true),
('branch_manager', 'inventory', 'update', true),
('branch_manager', 'reports', 'view', true),
('branch_manager', 'reports', 'approve', true),
('branch_manager', 'transactions', 'view', true),
('branch_manager', 'customers', 'view', true),
('branch_manager', 'customers', 'insert', true),
('branch_manager', 'customers', 'update', true),

-- Rider permissions
('rider', 'inventory', 'view', true),
('rider', 'inventory', 'update', true),
('rider', 'transactions', 'insert', true),
('rider', 'transactions', 'view', true),
('rider', 'customers', 'view', true),
('rider', 'customers', 'insert', true),
('rider', 'customers', 'update', true),
('rider', 'attendance', 'insert', true),
('rider', 'attendance', 'update', true),
('rider', 'reports', 'insert', true),

-- Finance permissions
('finance', 'financial', 'view', true),
('finance', 'financial', 'insert', true),
('finance', 'financial', 'update', true),
('finance', 'reports', 'view', true),
('finance', 'transactions', 'view', true);

-- Add trigger for updated_at
CREATE TRIGGER update_user_role_permissions_updated_at
BEFORE UPDATE ON user_role_permissions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();