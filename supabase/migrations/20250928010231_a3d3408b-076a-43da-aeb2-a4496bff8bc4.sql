-- Fix rider branch assignments
-- Update Pak Alut to Zeger Coffee Malang branch
UPDATE profiles 
SET branch_id = (SELECT id FROM branches WHERE name = 'Zeger Coffee Malang')
WHERE full_name LIKE '%Alut%' OR full_name LIKE '%Z-009%';

-- Update Pak Agung (Z-015) to Zeger Coffee Malang branch as well
UPDATE profiles 
SET branch_id = (SELECT id FROM branches WHERE name = 'Zeger Coffee Malang')
WHERE full_name LIKE '%Agung%' OR full_name LIKE '%Z-015%';