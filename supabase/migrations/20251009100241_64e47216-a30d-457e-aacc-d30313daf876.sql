-- Break RLS recursion for customer_users visibility by riders
-- 1) Drop the recursive policy
DROP POLICY IF EXISTS "Riders can view customers from their orders" ON public.customer_users;

-- 2) Create a SECURITY DEFINER function that bypasses RLS on customer_orders to avoid recursion
CREATE OR REPLACE FUNCTION public.can_rider_view_customer(customer_user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.customer_orders co
    WHERE co.user_id = customer_user_uuid
      AND co.rider_profile_id = (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
      )
  );
$$;

-- 3) Recreate the policy using the function (no direct subqueries that trigger RLS recursion)
CREATE POLICY "Riders can view customers from their orders"
ON public.customer_users
FOR SELECT
TO authenticated
USING (public.can_rider_view_customer(id));