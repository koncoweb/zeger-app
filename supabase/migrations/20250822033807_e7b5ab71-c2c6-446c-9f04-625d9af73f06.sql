-- Fix missing RLS policies for tables that need them
-- Add RLS policies for stock_movements table
CREATE POLICY "Authorized users can manage stock movements" 
ON public.stock_movements 
FOR ALL 
USING (has_role('ho_admin'::user_role) OR has_role('branch_manager'::user_role));

CREATE POLICY "Users can view relevant stock movements" 
ON public.stock_movements 
FOR SELECT 
USING (
  has_role('ho_admin'::user_role) OR 
  (has_role('branch_manager'::user_role) AND (branch_id = (SELECT profiles.branch_id FROM profiles WHERE profiles.user_id = auth.uid()))) OR
  (has_role('rider'::user_role) AND (rider_id = (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())))
);

-- Add RLS policies for transaction_items table
CREATE POLICY "Users can view relevant transaction items" 
ON public.transaction_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.id = transaction_items.transaction_id 
    AND (
      has_role('ho_admin'::user_role) OR
      (has_role('branch_manager'::user_role) AND t.branch_id = (SELECT profiles.branch_id FROM profiles WHERE profiles.user_id = auth.uid())) OR
      (has_role('rider'::user_role) AND t.rider_id = (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())) OR
      (has_role('customer'::user_role) AND t.customer_id = (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()))
    )
  )
);

CREATE POLICY "Staff can create transaction items" 
ON public.transaction_items 
FOR INSERT 
WITH CHECK (has_role('rider'::user_role) OR has_role('branch_manager'::user_role) OR has_role('ho_admin'::user_role));

-- Add RLS policies for customer_loyalty table
CREATE POLICY "Customers can view own loyalty data" 
ON public.customer_loyalty 
FOR SELECT 
USING (customer_id = (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));

CREATE POLICY "Staff can manage loyalty data" 
ON public.customer_loyalty 
FOR ALL 
USING (has_role('ho_admin'::user_role) OR has_role('branch_manager'::user_role));

-- Fix functions to use proper search path
DROP FUNCTION IF EXISTS public.get_user_profile();
CREATE OR REPLACE FUNCTION public.get_user_profile()
 RETURNS profiles
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT * FROM profiles WHERE user_id = auth.uid();
$function$;

DROP FUNCTION IF EXISTS public.has_role(user_role);
CREATE OR REPLACE FUNCTION public.has_role(required_role user_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT EXISTS(
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = required_role 
    AND is_active = true
  );
$function$;

DROP FUNCTION IF EXISTS public.update_updated_at_column();
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;