-- Add rider_profile_id column to customer_orders table for Panggil Rider feature
-- This column references profiles.id (rider's profile), different from rider_id which references customer_users.id

ALTER TABLE customer_orders 
ADD COLUMN rider_profile_id UUID REFERENCES profiles(id);

-- Create index for better query performance
CREATE INDEX idx_customer_orders_rider_profile_id ON customer_orders(rider_profile_id);

-- Add comment for documentation
COMMENT ON COLUMN customer_orders.rider_profile_id IS 'References profiles.id - used for On The Wheels rider assignments';
COMMENT ON COLUMN customer_orders.rider_id IS 'References customer_users.id - reserved for future use when customers can also be riders';