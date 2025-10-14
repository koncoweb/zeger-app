-- ============================================
-- FEATURE: Transaction Void Requests
-- ============================================

-- Create transaction_void_requests table
CREATE TABLE public.transaction_void_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  rider_id UUID NOT NULL REFERENCES profiles(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_void_requests_status ON transaction_void_requests(status);
CREATE INDEX idx_void_requests_branch ON transaction_void_requests(branch_id);
CREATE INDEX idx_void_requests_transaction ON transaction_void_requests(transaction_id);

-- Enable RLS
ALTER TABLE public.transaction_void_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Riders can create void requests for own transactions"
ON transaction_void_requests FOR INSERT
TO public
WITH CHECK (
  is_rider_role() 
  AND rider_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Riders can view own void requests"
ON transaction_void_requests FOR SELECT
TO public
USING (
  is_rider_role() 
  AND rider_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Managers can view void requests for their branch"
ON transaction_void_requests FOR SELECT
TO public
USING (
  (has_role('branch_manager'::user_role) AND branch_id = get_current_user_branch())
  OR (has_role('sb_branch_manager'::user_role) AND branch_id = get_current_user_branch())
  OR has_role('ho_admin'::user_role)
);

CREATE POLICY "Managers can update void requests for their branch"
ON transaction_void_requests FOR UPDATE
TO public
USING (
  (has_role('branch_manager'::user_role) AND branch_id = get_current_user_branch())
  OR (has_role('sb_branch_manager'::user_role) AND branch_id = get_current_user_branch())
  OR has_role('ho_admin'::user_role)
)
WITH CHECK (
  (has_role('branch_manager'::user_role) AND branch_id = get_current_user_branch())
  OR (has_role('sb_branch_manager'::user_role) AND branch_id = get_current_user_branch())
  OR has_role('ho_admin'::user_role)
);

-- Add void columns to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_voided BOOLEAN DEFAULT false;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS voided_by UUID REFERENCES profiles(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS void_reason TEXT;

-- Create helper function to increment inventory stock
CREATE OR REPLACE FUNCTION increment_inventory_stock(
  p_rider_id UUID,
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE inventory
  SET stock_quantity = stock_quantity + p_quantity,
      last_updated = now()
  WHERE rider_id = p_rider_id
    AND product_id = p_product_id;
    
  IF NOT FOUND THEN
    INSERT INTO inventory (rider_id, product_id, stock_quantity, branch_id)
    SELECT p_rider_id, p_product_id, p_quantity, branch_id
    FROM profiles
    WHERE id = p_rider_id;
  END IF;
END;
$$;

-- ============================================
-- FIX: Add photo_url column to profiles
-- ============================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_photo_url ON profiles(photo_url) WHERE photo_url IS NOT NULL;