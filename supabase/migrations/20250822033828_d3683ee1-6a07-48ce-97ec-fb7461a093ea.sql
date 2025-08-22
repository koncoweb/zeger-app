-- Add missing RLS policies for tables without modifying existing functions
-- Add RLS policies for stock_movements table
CREATE POLICY "Authorized users can manage stock movements" 
ON public.stock_movements 
FOR ALL 
USING (has_role('ho_admin'::user_role) OR has_role('branch_manager'::user_role));

-- Add RLS policies for transaction_items table
CREATE POLICY "Staff can create transaction items" 
ON public.transaction_items 
FOR INSERT 
WITH CHECK (has_role('rider'::user_role) OR has_role('branch_manager'::user_role) OR has_role('ho_admin'::user_role));

-- Add RLS policies for customer_loyalty table
CREATE POLICY "Staff can manage loyalty data" 
ON public.customer_loyalty 
FOR ALL 
USING (has_role('ho_admin'::user_role) OR has_role('branch_manager'::user_role));