-- ============================================
-- COMPREHENSIVE FIX: Update All Restrictive RLS Policies
-- Target: 7 tables with 13 policies to support sb_rider and bh_rider roles
-- ============================================

-- ============================================
-- FIX 1: TRANSACTIONS (2 policies)
-- ============================================
DROP POLICY IF EXISTS "Riders and staff can create transactions" ON transactions;
CREATE POLICY "Riders and staff can create transactions"
ON transactions FOR INSERT
TO public
WITH CHECK (
  is_rider_role() 
  OR has_role('branch_manager'::user_role) 
  OR has_role('ho_admin'::user_role)
);

DROP POLICY IF EXISTS "Users can view relevant transactions" ON transactions;
CREATE POLICY "Users can view relevant transactions"
ON transactions FOR SELECT
TO public
USING (
  has_role('ho_admin'::user_role) 
  OR (has_role('branch_manager'::user_role) AND branch_id = get_current_user_branch())
  OR (is_rider_role() AND rider_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))
  OR (has_role('customer'::user_role) AND customer_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

-- ============================================
-- FIX 2: TRANSACTION_ITEMS (1 policy)
-- ============================================
DROP POLICY IF EXISTS "Staff can create transaction items" ON transaction_items;
CREATE POLICY "Staff can create transaction items"
ON transaction_items FOR INSERT
TO public
WITH CHECK (
  is_rider_role() 
  OR has_role('branch_manager'::user_role) 
  OR has_role('ho_admin'::user_role)
);

-- ============================================
-- FIX 3: DAILY_REPORTS (2 policies)
-- ============================================
DROP POLICY IF EXISTS "Riders can create own daily reports" ON daily_reports;
CREATE POLICY "Riders can create own daily reports"
ON daily_reports FOR INSERT
TO public
WITH CHECK (
  is_rider_role() 
  AND rider_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can view relevant daily reports" ON daily_reports;
CREATE POLICY "Users can view relevant daily reports"
ON daily_reports FOR SELECT
TO public
USING (
  has_role('ho_admin'::user_role) 
  OR (has_role('branch_manager'::user_role) AND branch_id = get_current_user_branch())
  OR (is_rider_role() AND rider_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

-- ============================================
-- FIX 4: INVENTORY (2 policies)
-- ============================================
DROP POLICY IF EXISTS "Riders can update own inventory" ON inventory;
CREATE POLICY "Riders can update own inventory"
ON inventory FOR UPDATE
TO public
USING (
  is_rider_role() 
  AND rider_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
)
WITH CHECK (
  is_rider_role() 
  AND rider_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can view relevant inventory" ON inventory;
CREATE POLICY "Users can view relevant inventory"
ON inventory FOR SELECT
TO public
USING (
  has_role('ho_admin'::user_role) 
  OR (has_role('branch_manager'::user_role) AND branch_id = get_current_user_branch())
  OR (is_rider_role() AND rider_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

-- ============================================
-- FIX 5: ATTENDANCE (3 policies)
-- ============================================
DROP POLICY IF EXISTS "Riders can create own attendance records" ON attendance;
CREATE POLICY "Riders can create own attendance records"
ON attendance FOR INSERT
TO public
WITH CHECK (
  is_rider_role() 
  AND rider_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Riders can update own attendance records" ON attendance;
CREATE POLICY "Riders can update own attendance records"
ON attendance FOR UPDATE
TO public
USING (
  is_rider_role() 
  AND rider_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can view relevant attendance records" ON attendance;
CREATE POLICY "Users can view relevant attendance records"
ON attendance FOR SELECT
TO public
USING (
  has_role('ho_admin'::user_role) 
  OR (has_role('branch_manager'::user_role) AND branch_id = get_current_user_branch())
  OR (is_rider_role() AND rider_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

-- ============================================
-- FIX 6: CUSTOMERS (2 policies)
-- ============================================
DROP POLICY IF EXISTS "Users can update relevant customers" ON customers;
CREATE POLICY "Users can update relevant customers"
ON customers FOR UPDATE
TO public
USING (
  has_role('ho_admin'::user_role) 
  OR (has_role('branch_manager'::user_role) AND branch_id = get_current_user_branch())
  OR (is_rider_role() AND rider_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

DROP POLICY IF EXISTS "Users can view relevant customers" ON customers;
CREATE POLICY "Users can view relevant customers"
ON customers FOR SELECT
TO public
USING (
  has_role('ho_admin'::user_role) 
  OR (has_role('branch_manager'::user_role) AND branch_id = get_current_user_branch())
  OR (is_rider_role() AND rider_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

-- ============================================
-- FIX 7: DAILY_OPERATIONAL_EXPENSES (1 policy)
-- ============================================
DROP POLICY IF EXISTS "Users can view relevant expenses" ON daily_operational_expenses;
CREATE POLICY "Users can view relevant expenses"
ON daily_operational_expenses FOR SELECT
TO public
USING (
  has_role('ho_admin'::user_role) 
  OR (has_role('branch_manager'::user_role) AND shift_id IN (
    SELECT id FROM shift_management WHERE branch_id = get_current_user_branch()
  ))
  OR (is_rider_role() AND rider_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

-- ============================================
-- VERIFICATION COMMENT
-- ============================================
COMMENT ON TABLE transactions IS 'Updated RLS policies to support sb_rider and bh_rider roles - comprehensive fix for all rider operations';