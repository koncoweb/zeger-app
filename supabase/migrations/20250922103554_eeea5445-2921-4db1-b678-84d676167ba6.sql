-- Assign riders to Branch Hub Report users
-- Bu Vita -> Pak Tri Z005
-- First, find the bh_report user and rider, then insert assignment

DO $$
DECLARE
    vita_user_id UUID;
    tri_rider_id UUID;
BEGIN
    -- Find Bu Vita's profile ID (bh_report user)
    SELECT id INTO vita_user_id 
    FROM profiles 
    WHERE role = 'bh_report' 
    AND full_name ILIKE '%vita%' 
    LIMIT 1;
    
    -- Find Pak Tri's rider profile ID  
    SELECT id INTO tri_rider_id 
    FROM profiles 
    WHERE role = 'rider' 
    AND full_name ILIKE '%tri%' 
    LIMIT 1;
    
    -- If both users exist, create the assignment (delete existing first to avoid conflicts)
    IF vita_user_id IS NOT NULL AND tri_rider_id IS NOT NULL THEN
        -- Delete any existing assignment for this user
        DELETE FROM branch_hub_report_assignments WHERE user_id = vita_user_id;
        
        -- Insert new assignment
        INSERT INTO branch_hub_report_assignments (user_id, rider_id)
        VALUES (vita_user_id, tri_rider_id);
        
        RAISE NOTICE 'Assigned user % to rider %', vita_user_id, tri_rider_id;
    ELSE
        RAISE NOTICE 'Could not find users - vita_user_id: %, tri_rider_id: %', vita_user_id, tri_rider_id;
    END IF;
END $$;