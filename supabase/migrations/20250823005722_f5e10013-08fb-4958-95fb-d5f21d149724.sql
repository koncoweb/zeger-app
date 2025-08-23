-- Add rider access to stock_movements and inventory for confirmation flow

-- 1) stock_movements: riders can SELECT and UPDATE their own rows
CREATE POLICY "Riders can view own stock movements"
ON public.stock_movements
FOR SELECT
USING (
  has_role('rider'::user_role)
  AND rider_id = (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())
);

CREATE POLICY "Riders can confirm own stock movements"
ON public.stock_movements
FOR UPDATE
USING (
  has_role('rider'::user_role)
  AND rider_id = (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())
)
WITH CHECK (
  has_role('rider'::user_role)
  AND rider_id = (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())
);

-- 2) inventory: riders can INSERT/UPDATE their own inventory rows
CREATE POLICY "Riders can insert own inventory"
ON public.inventory
FOR INSERT
WITH CHECK (
  has_role('rider'::user_role)
  AND rider_id = (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())
);

CREATE POLICY "Riders can update own inventory"
ON public.inventory
FOR UPDATE
USING (
  has_role('rider'::user_role)
  AND rider_id = (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())
)
WITH CHECK (
  has_role('rider'::user_role)
  AND rider_id = (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())
);