-- Create unique index to ensure one BH report user has only one assignment
CREATE UNIQUE INDEX IF NOT EXISTS idx_bh_report_assignments_user_unique 
ON public.branch_hub_report_assignments(user_id);

-- Function to upsert BH report assignments with proper access control
CREATE OR REPLACE FUNCTION public.upsert_bh_report_assignment(_report_user_id uuid, _rider_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cur_role user_role := get_current_user_role();
  mgr_branch uuid := get_current_user_branch();
  rep_branch uuid;
  rid_branch uuid;
BEGIN
  -- Allow HO admin to assign anyone
  IF cur_role = 'ho_admin' THEN
    -- allowed
  ELSIF cur_role IN ('branch_manager', 'sb_branch_manager') THEN
    -- Get branches of report user and rider
    SELECT branch_id INTO rep_branch FROM profiles WHERE id = _report_user_id;
    SELECT branch_id INTO rid_branch FROM profiles WHERE id = _rider_profile_id;
    
    -- Ensure both users are in manager's branch
    IF rep_branch IS NULL OR rid_branch IS NULL OR rep_branch <> mgr_branch OR rid_branch <> mgr_branch THEN
      RAISE EXCEPTION 'Not allowed: cross-branch assignment or invalid user IDs';
    END IF;
  ELSE
    RAISE EXCEPTION 'Not allowed: insufficient permissions';
  END IF;

  -- Upsert the assignment
  INSERT INTO branch_hub_report_assignments (user_id, rider_id)
  VALUES (_report_user_id, _rider_profile_id)
  ON CONFLICT (user_id) DO UPDATE
    SET rider_id = EXCLUDED.rider_id,
        updated_at = now();
END;
$$;

-- Function to get branch assignments for display in user management
CREATE OR REPLACE FUNCTION public.get_branch_assignments()
RETURNS TABLE(report_user_id uuid, report_name text, rider_id uuid, rider_name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    r_user.id as report_user_id, 
    r_user.full_name as report_name, 
    a.rider_id, 
    rider.full_name as rider_name
  FROM branch_hub_report_assignments a
  JOIN profiles r_user ON r_user.id = a.user_id
  JOIN profiles rider ON rider.id = a.rider_id
  WHERE
    get_current_user_role() = 'ho_admin'
    OR (
      get_current_user_role() IN ('branch_manager', 'sb_branch_manager')
      AND r_user.branch_id = get_current_user_branch()
      AND rider.branch_id = get_current_user_branch()
    );
$$;