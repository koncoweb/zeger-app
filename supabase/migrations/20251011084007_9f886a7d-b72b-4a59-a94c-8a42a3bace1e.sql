-- Drop ALL old policies first (including any that were partially created)
DROP POLICY IF EXISTS "All riders can view own stock movements" ON stock_movements;
DROP POLICY IF EXISTS "Riders can view own stock movements" ON stock_movements;
DROP POLICY IF EXISTS "Riders can confirm own stock movements" ON stock_movements;
DROP POLICY IF EXISTS "Riders can insert return movements" ON stock_movements;

-- Create ONLY the new inclusive SELECT policy
CREATE POLICY "All riders can view own stock movements"
ON stock_movements FOR SELECT
TO public
USING (
  is_rider_role() 
  AND rider_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Verification: Z-009 Pak Alut (sb_rider) should now see pending transfers