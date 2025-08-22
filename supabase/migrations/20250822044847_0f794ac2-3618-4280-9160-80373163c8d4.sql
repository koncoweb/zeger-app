-- Fix infinite recursion in RLS policies
DROP POLICY IF EXISTS "HO admin can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Branch managers can view branch staff" ON profiles;

-- Create helper function to get current user role safely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Create helper function to get current user branch safely
CREATE OR REPLACE FUNCTION public.get_current_user_branch()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT branch_id FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Recreate policies without recursion
CREATE POLICY "HO admin can manage all profiles" 
ON profiles 
FOR ALL 
USING (get_current_user_role() = 'ho_admin'::user_role);

CREATE POLICY "Branch managers can view branch staff" 
ON profiles 
FOR SELECT 
USING (
  get_current_user_role() = 'branch_manager'::user_role 
  AND branch_id = get_current_user_branch()
);

-- Create financial transactions table for comprehensive reporting
CREATE TABLE IF NOT EXISTS financial_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id uuid REFERENCES transactions(id),
  branch_id uuid REFERENCES branches(id),
  transaction_type text NOT NULL, -- 'revenue', 'expense', 'asset', 'liability'
  account_type text NOT NULL, -- 'sales', 'cogs', 'operational_expense', 'cash', 'inventory', etc.
  amount numeric NOT NULL,
  description text,
  reference_number text,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  fiscal_period date DEFAULT CURRENT_DATE
);

-- Enable RLS on financial transactions
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Financial transactions access by branch" 
ON financial_transactions 
FOR ALL 
USING (
  get_current_user_role() = 'ho_admin'::user_role OR
  (get_current_user_role() = 'branch_manager'::user_role AND branch_id = get_current_user_branch())
);

-- Create operational expenses table
CREATE TABLE IF NOT EXISTS operational_expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id uuid REFERENCES branches(id),
  expense_category text NOT NULL, -- 'rent', 'utilities', 'salary', 'marketing', 'maintenance', etc.
  amount numeric NOT NULL,
  description text,
  expense_date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  is_recurring boolean DEFAULT false,
  recurring_frequency text -- 'monthly', 'weekly', 'yearly'
);

-- Enable RLS on operational expenses
ALTER TABLE operational_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Operational expenses access by branch" 
ON operational_expenses 
FOR ALL 
USING (
  get_current_user_role() = 'ho_admin'::user_role OR
  (get_current_user_role() = 'branch_manager'::user_role AND branch_id = get_current_user_branch())
);

-- Function to automatically create financial entries for sales
CREATE OR REPLACE FUNCTION create_financial_entries_for_sale()
RETURNS TRIGGER AS $$
DECLARE
  transaction_record transactions;
BEGIN
  -- Get the transaction details
  SELECT * INTO transaction_record FROM transactions WHERE id = NEW.id;
  
  -- Create revenue entry
  INSERT INTO financial_transactions (
    transaction_id, branch_id, transaction_type, account_type, 
    amount, description, reference_number, created_by
  ) VALUES (
    NEW.id, NEW.branch_id, 'revenue', 'sales',
    NEW.final_amount, 'Sales Revenue', NEW.transaction_number, NEW.rider_id
  );
  
  -- Create cash entry (assuming cash payment for now)
  INSERT INTO financial_transactions (
    transaction_id, branch_id, transaction_type, account_type,
    amount, description, reference_number, created_by
  ) VALUES (
    NEW.id, NEW.branch_id, 'asset', 'cash',
    NEW.final_amount, 'Cash Received', NEW.transaction_number, NEW.rider_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic financial entries
DROP TRIGGER IF EXISTS create_financial_entries_trigger ON transactions;
CREATE TRIGGER create_financial_entries_trigger
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION create_financial_entries_for_sale();