-- ============================================
-- COMPREHENSIVE RLS FIX: Small Branch Manager Issues
-- ============================================
-- This migration fixes 3 issues:
-- 1. Shift reports cannot be accepted (missing stock_movements SELECT)
-- 2. Stock transfer history not showing (missing stock_movements SELECT)
-- 3. Purchased stock not visible in inventory (missing inventory SELECT)

-- ============================================
-- FIX 1: Add SELECT policy for sb_branch_manager on stock_movements
-- ============================================
DROP POLICY IF EXISTS "Small branch managers can view branch stock movements" ON stock_movements;

CREATE POLICY "Small branch managers can view branch stock movements"
ON stock_movements FOR SELECT
TO public
USING (
  has_role('sb_branch_manager'::user_role) 
  AND branch_id = get_current_user_branch()
);

-- ============================================
-- FIX 2: Update ALL policy for sb_branch_manager on stock_movements
-- ============================================
DROP POLICY IF EXISTS "Small branch managers can manage stock movements" ON stock_movements;

CREATE POLICY "Small branch managers can manage stock movements"
ON stock_movements FOR ALL
TO public
USING (
  has_role('sb_branch_manager'::user_role) 
  AND branch_id = get_current_user_branch()
)
WITH CHECK (
  has_role('sb_branch_manager'::user_role) 
  AND branch_id = get_current_user_branch()
);

-- ============================================
-- FIX 3: Ensure sb_branch_manager can UPDATE shift_management for verification
-- ============================================
DROP POLICY IF EXISTS "Small branch managers can verify shifts" ON shift_management;

CREATE POLICY "Small branch managers can verify shifts"
ON shift_management FOR UPDATE
TO public
USING (
  has_role('sb_branch_manager'::user_role) 
  AND branch_id = get_current_user_branch()
)
WITH CHECK (
  has_role('sb_branch_manager'::user_role) 
  AND branch_id = get_current_user_branch()
);

-- ============================================
-- FIX 4: Add SELECT policy for sb_branch_manager on inventory
-- ============================================
DROP POLICY IF EXISTS "Small branch managers can view branch inventory" ON inventory;

CREATE POLICY "Small branch managers can view branch inventory"
ON inventory FOR SELECT
TO public
USING (
  has_role('sb_branch_manager'::user_role) 
  AND branch_id = get_current_user_branch()
);

-- ============================================
-- FIX 5: Ensure sb_branch_manager can manage inventory in their branch
-- ============================================
DROP POLICY IF EXISTS "Small branch managers can manage branch inventory" ON inventory;

CREATE POLICY "Small branch managers can manage branch inventory"
ON inventory FOR ALL
TO public
USING (
  has_role('sb_branch_manager'::user_role) 
  AND branch_id = get_current_user_branch()
)
WITH CHECK (
  has_role('sb_branch_manager'::user_role) 
  AND branch_id = get_current_user_branch()
);