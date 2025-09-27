-- Create tables for purchasing system
CREATE TABLE public.purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_number TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  branch_id UUID,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.purchase_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID NOT NULL,
  product_id UUID NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  cost_per_unit NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;

-- Create policies for purchases table
CREATE POLICY "Small branch managers can manage own purchases"
ON public.purchases
FOR ALL
USING ((get_current_user_role() = 'sb_branch_manager'::user_role AND branch_id = get_current_user_branch()) OR get_current_user_role() = 'ho_admin'::user_role)
WITH CHECK ((get_current_user_role() = 'sb_branch_manager'::user_role AND branch_id = get_current_user_branch()) OR get_current_user_role() = 'ho_admin'::user_role);

-- Create policies for purchase_items table
CREATE POLICY "Users can manage purchase items for their purchases"
ON public.purchase_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.purchases p
    WHERE p.id = purchase_items.purchase_id
    AND ((get_current_user_role() = 'sb_branch_manager'::user_role AND p.branch_id = get_current_user_branch()) OR get_current_user_role() = 'ho_admin'::user_role)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.purchases p
    WHERE p.id = purchase_items.purchase_id
    AND ((get_current_user_role() = 'sb_branch_manager'::user_role AND p.branch_id = get_current_user_branch()) OR get_current_user_role() = 'ho_admin'::user_role)
  )
);

-- Create trigger for timestamps
CREATE TRIGGER update_purchases_updated_at
  BEFORE UPDATE ON public.purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();