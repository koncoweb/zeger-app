-- Fix RLS policy for stock_movements to allow sb_branch_manager to insert
CREATE POLICY "Small branch managers can create stock movements" 
ON public.stock_movements 
FOR INSERT 
WITH CHECK (
  has_role('sb_branch_manager'::user_role) 
  AND branch_id = get_current_user_branch()
);