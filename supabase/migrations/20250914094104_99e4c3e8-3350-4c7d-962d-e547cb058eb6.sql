-- Add bh_report to user_role enum if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t 
                   JOIN pg_enum e ON t.oid = e.enumtypid 
                   WHERE t.typname = 'user_role' AND e.enumlabel = 'bh_report') THEN
        ALTER TYPE user_role ADD VALUE 'bh_report';
    END IF;
END$$;

-- Create branch_hub_report_assignments table
CREATE TABLE IF NOT EXISTS public.branch_hub_report_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, rider_id)
);

-- Enable RLS
ALTER TABLE public.branch_hub_report_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for branch_hub_report_assignments
CREATE POLICY "Users can view own assignments" 
ON public.branch_hub_report_assignments 
FOR SELECT 
USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "HO admin can manage assignments" 
ON public.branch_hub_report_assignments 
FOR ALL 
USING (has_role('ho_admin'::user_role));

-- Create function to get assigned rider ID for bh_report users
CREATE OR REPLACE FUNCTION public.get_assigned_rider_id()
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT rider_id FROM branch_hub_report_assignments 
  WHERE user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  LIMIT 1;
$$;

-- Update RLS policies for transactions to include bh_report access to assigned rider data
CREATE POLICY "BH Report users can view assigned rider transactions" 
ON public.transactions 
FOR SELECT 
USING (
  has_role('bh_report'::user_role) AND 
  rider_id = get_assigned_rider_id()
);

-- Update RLS policies for transaction_items to include bh_report access
CREATE POLICY "BH Report users can view assigned rider transaction items" 
ON public.transaction_items 
FOR SELECT 
USING (
  has_role('bh_report'::user_role) AND 
  transaction_id IN (
    SELECT id FROM transactions 
    WHERE rider_id = get_assigned_rider_id()
  )
);

-- Update RLS policies for daily_operational_expenses
CREATE POLICY "BH Report users can view assigned rider expenses" 
ON public.daily_operational_expenses 
FOR SELECT 
USING (
  has_role('bh_report'::user_role) AND 
  rider_id = get_assigned_rider_id()
);

-- Update RLS policies for customers  
CREATE POLICY "BH Report users can view assigned rider customers" 
ON public.customers 
FOR SELECT 
USING (
  has_role('bh_report'::user_role) AND 
  rider_id = get_assigned_rider_id()
);

-- Update RLS policies for inventory
CREATE POLICY "BH Report users can view assigned rider inventory" 
ON public.inventory 
FOR SELECT 
USING (
  has_role('bh_report'::user_role) AND 
  rider_id = get_assigned_rider_id()
);

-- Add trigger for updated_at
CREATE TRIGGER update_branch_hub_report_assignments_updated_at
BEFORE UPDATE ON public.branch_hub_report_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();