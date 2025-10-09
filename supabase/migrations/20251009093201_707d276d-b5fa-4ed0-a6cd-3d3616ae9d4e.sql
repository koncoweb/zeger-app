-- Add RLS policies for rider_profile_id access

-- 1. customer_orders: Riders can SELECT and UPDATE orders assigned via rider_profile_id
CREATE POLICY "Riders can view orders by rider_profile_id"
ON customer_orders
FOR SELECT
TO authenticated
USING (
  rider_profile_id = (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Riders can update orders by rider_profile_id"
ON customer_orders
FOR UPDATE
TO authenticated
USING (
  rider_profile_id = (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);

-- 2. customer_order_items: Riders can SELECT items for their assigned orders
CREATE POLICY "Riders can view order items by rider_profile_id"
ON customer_order_items
FOR SELECT
TO authenticated
USING (
  order_id IN (
    SELECT id FROM customer_orders 
    WHERE rider_profile_id = (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

-- 3. order_status_history: Riders can INSERT status updates for their orders
CREATE POLICY "Riders can insert status by rider_profile_id"
ON order_status_history
FOR INSERT
TO authenticated
WITH CHECK (
  order_id IN (
    SELECT id FROM customer_orders 
    WHERE rider_profile_id = (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

-- 4. customer_users: Riders can SELECT customer info for their assigned orders
CREATE POLICY "Riders can view customers by rider_profile_id"
ON customer_users
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT user_id FROM customer_orders 
    WHERE rider_profile_id = (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
);