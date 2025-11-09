-- Create atomic decrement function for rider stock
CREATE OR REPLACE FUNCTION decrement_rider_stock(
  p_rider_id UUID,
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS TABLE (
  id UUID,
  stock_quantity INTEGER
) AS $$
DECLARE
  v_current_stock INTEGER;
BEGIN
  -- Get current stock with row lock
  SELECT inventory.stock_quantity INTO v_current_stock
  FROM inventory
  WHERE inventory.rider_id = p_rider_id
    AND inventory.product_id = p_product_id
  FOR UPDATE; -- Lock row to prevent race condition

  -- Check if inventory exists
  IF v_current_stock IS NULL THEN
    RAISE EXCEPTION 'Inventory not found for rider % and product %', p_rider_id, p_product_id;
  END IF;

  -- Check if sufficient stock
  IF v_current_stock < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', v_current_stock, p_quantity;
  END IF;

  -- Update stock atomically
  RETURN QUERY
  UPDATE inventory
  SET stock_quantity = stock_quantity - p_quantity,
      last_updated = NOW()
  WHERE inventory.rider_id = p_rider_id
    AND inventory.product_id = p_product_id
  RETURNING inventory.id, inventory.stock_quantity;
END;
$$ LANGUAGE plpgsql;

-- Add check constraint to prevent negative stock
ALTER TABLE inventory
DROP CONSTRAINT IF EXISTS check_stock_not_negative;

ALTER TABLE inventory
ADD CONSTRAINT check_stock_not_negative
CHECK (stock_quantity >= 0);

COMMENT ON CONSTRAINT check_stock_not_negative ON inventory IS
'Prevent negative stock - riders cannot sell more than available stock';