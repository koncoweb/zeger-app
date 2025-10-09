-- Fix infinite recursion in customer_users RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.customer_users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.customer_users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.customer_users;
DROP POLICY IF EXISTS "Riders can view customers by rider_profile_id" ON public.customer_users;

-- Create security definer function to check if user owns the customer_users record
CREATE OR REPLACE FUNCTION public.is_customer_user_owner(customer_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM customer_users
    WHERE id = customer_user_id
      AND user_id = auth.uid()
  );
$$;

-- Recreate policies without recursion
CREATE POLICY "Users can insert own customer profile"
ON public.customer_users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own customer profile"
ON public.customer_users
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own customer profile"
ON public.customer_users
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Allow riders to view customers through orders relationship
CREATE POLICY "Riders can view customers from their orders"
ON public.customer_users
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT user_id
    FROM customer_orders
    WHERE rider_profile_id = (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
);