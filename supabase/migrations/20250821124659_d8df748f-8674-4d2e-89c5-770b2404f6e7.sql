-- Enable Row Level Security on attendance table
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Policy for viewing attendance records
CREATE POLICY "Users can view relevant attendance records" 
ON public.attendance 
FOR SELECT 
USING (
  has_role('ho_admin'::user_role) OR 
  (has_role('branch_manager'::user_role) AND branch_id = (
    SELECT profiles.branch_id 
    FROM profiles 
    WHERE profiles.user_id = auth.uid()
  )) OR 
  (has_role('rider'::user_role) AND rider_id = (
    SELECT profiles.id 
    FROM profiles 
    WHERE profiles.user_id = auth.uid()
  ))
);

-- Policy for riders to create their own attendance records
CREATE POLICY "Riders can create own attendance records" 
ON public.attendance 
FOR INSERT 
WITH CHECK (
  has_role('rider'::user_role) AND 
  rider_id = (
    SELECT profiles.id 
    FROM profiles 
    WHERE profiles.user_id = auth.uid()
  )
);

-- Policy for riders to update their own attendance records (for check-out)
CREATE POLICY "Riders can update own attendance records" 
ON public.attendance 
FOR UPDATE 
USING (
  has_role('rider'::user_role) AND 
  rider_id = (
    SELECT profiles.id 
    FROM profiles 
    WHERE profiles.user_id = auth.uid()
  )
);

-- Policy for branch managers and HO admins to manage attendance
CREATE POLICY "Authorized users can manage attendance" 
ON public.attendance 
FOR ALL 
USING (
  has_role('ho_admin'::user_role) OR 
  (has_role('branch_manager'::user_role) AND branch_id = (
    SELECT profiles.branch_id 
    FROM profiles 
    WHERE profiles.user_id = auth.uid()
  ))
);