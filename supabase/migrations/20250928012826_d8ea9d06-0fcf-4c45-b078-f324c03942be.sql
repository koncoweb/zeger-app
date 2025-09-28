-- Fix RLS policies for inventory table to allow small branch managers to insert
-- Drop existing conflicting policies first
DROP POLICY IF EXISTS "Riders can insert own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Riders can insert their own inventory" ON public.inventory;

-- Create comprehensive RLS policy for inventory INSERT that includes small branch managers
CREATE POLICY "Users can insert inventory" ON public.inventory
FOR INSERT 
WITH CHECK (
  -- HO admin can insert anything
  has_role('ho_admin'::user_role) OR 
  -- Branch managers can insert for their branch
  (has_role('branch_manager'::user_role) AND branch_id = get_current_user_branch()) OR
  -- Small branch managers can insert for their branch
  (has_role('sb_branch_manager'::user_role) AND branch_id = get_current_user_branch()) OR
  -- Riders can insert their own inventory
  (is_rider_role() AND rider_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))
);