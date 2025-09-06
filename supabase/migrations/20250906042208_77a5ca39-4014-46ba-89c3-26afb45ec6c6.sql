-- Fix database relationship between profiles and branches
ALTER TABLE public.profiles 
ADD CONSTRAINT fk_profiles_branch_id 
FOREIGN KEY (branch_id) REFERENCES public.branches(id);

-- Create user-specific permissions table for granular access control
CREATE TABLE IF NOT EXISTS public.user_specific_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  permission TEXT NOT NULL,
  resource_filter JSONB, -- For granular access like specific rider data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, module_name, permission)
);

-- Enable RLS for user specific permissions
ALTER TABLE public.user_specific_permissions ENABLE ROW LEVEL SECURITY;

-- Create policy for user specific permissions
CREATE POLICY "HO and branch managers can manage user permissions" 
ON public.user_specific_permissions 
FOR ALL 
USING (
  has_role('ho_admin'::user_role) OR 
  (has_role('branch_manager'::user_role) AND EXISTS (
    SELECT 1 FROM profiles p 
    JOIN profiles cp ON cp.user_id = auth.uid()
    WHERE p.id = user_specific_permissions.user_id 
    AND p.branch_id = cp.branch_id
  ))
);

-- Create function to check user specific permission
CREATE OR REPLACE FUNCTION public.has_user_permission(
  check_user_id UUID,
  module_name TEXT,
  permission_type TEXT
) RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_specific_permissions usp
    WHERE usp.user_id = check_user_id 
    AND usp.module_name = module_name 
    AND usp.permission = permission_type
  );
$$;