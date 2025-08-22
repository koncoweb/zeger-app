-- Update functions to set a safe search_path
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_branch()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT branch_id FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.create_financial_entries_for_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  transaction_record transactions;
BEGIN
  SELECT * INTO transaction_record FROM transactions WHERE id = NEW.id;

  INSERT INTO financial_transactions (
    transaction_id, branch_id, transaction_type, account_type, 
    amount, description, reference_number, created_by
  ) VALUES (
    NEW.id, NEW.branch_id, 'revenue', 'sales',
    NEW.final_amount, 'Sales Revenue', NEW.transaction_number, NEW.rider_id
  );
  
  INSERT INTO financial_transactions (
    transaction_id, branch_id, transaction_type, account_type,
    amount, description, reference_number, created_by
  ) VALUES (
    NEW.id, NEW.branch_id, 'asset', 'cash',
    NEW.final_amount, 'Cash Received', NEW.transaction_number, NEW.rider_id
  );

  RETURN NEW;
END;
$$;