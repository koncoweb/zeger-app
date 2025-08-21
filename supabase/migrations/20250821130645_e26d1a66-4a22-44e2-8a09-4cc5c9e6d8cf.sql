-- Create profiles for riders and staff
-- First get the branch IDs we just created
DO $$
DECLARE
    hub001_id uuid;
    hub002_id uuid;
    otw001_id uuid;
    otw002_id uuid;
    otw003_id uuid;
    otw004_id uuid;
    otw005_id uuid;
BEGIN
    -- Get branch IDs
    SELECT id INTO hub001_id FROM branches WHERE code = 'HUB001';
    SELECT id INTO hub002_id FROM branches WHERE code = 'HUB002';
    SELECT id INTO otw001_id FROM branches WHERE code = 'OTW001';
    SELECT id INTO otw002_id FROM branches WHERE code = 'OTW002';
    SELECT id INTO otw003_id FROM branches WHERE code = 'OTW003';
    SELECT id INTO otw004_id FROM branches WHERE code = 'OTW004';
    SELECT id INTO otw005_id FROM branches WHERE code = 'OTW005';

    -- Insert 15 riders with dummy user_ids (will need real users later)
    -- Riders for OTW001 (3 riders)
    INSERT INTO profiles (user_id, full_name, phone, role, branch_id, is_active) VALUES
    (gen_random_uuid(), 'Ahmad Zeger OTW 01', '0821-1111-0001', 'rider', otw001_id, true),
    (gen_random_uuid(), 'Budi Zeger OTW 02', '0821-1111-0002', 'rider', otw001_id, true),
    (gen_random_uuid(), 'Citra Zeger OTW 03', '0821-1111-0003', 'rider', otw001_id, true),
    
    -- Riders for OTW002 (3 riders)
    (gen_random_uuid(), 'Deni Zeger OTW 04', '0821-2222-0004', 'rider', otw002_id, true),
    (gen_random_uuid(), 'Eka Zeger OTW 05', '0821-2222-0005', 'rider', otw002_id, true),
    (gen_random_uuid(), 'Fira Zeger OTW 06', '0821-2222-0006', 'rider', otw002_id, true),
    
    -- Riders for OTW003 (3 riders)
    (gen_random_uuid(), 'Gina Zeger OTW 07', '0821-3333-0007', 'rider', otw003_id, true),
    (gen_random_uuid(), 'Hadi Zeger OTW 08', '0821-3333-0008', 'rider', otw003_id, true),
    (gen_random_uuid(), 'Indra Zeger OTW 09', '0821-3333-0009', 'rider', otw003_id, true),
    
    -- Riders for OTW004 (3 riders)
    (gen_random_uuid(), 'Joko Zeger OTW 10', '0821-4444-0010', 'rider', otw004_id, true),
    (gen_random_uuid(), 'Kiki Zeger OTW 11', '0821-4444-0011', 'rider', otw004_id, true),
    (gen_random_uuid(), 'Lina Zeger OTW 12', '0821-4444-0012', 'rider', otw004_id, true),
    
    -- Riders for OTW005 (3 riders)
    (gen_random_uuid(), 'Mita Zeger OTW 13', '0821-5555-0013', 'rider', otw005_id, true),
    (gen_random_uuid(), 'Nandi Zeger OTW 14', '0821-5555-0014', 'rider', otw005_id, true),
    (gen_random_uuid(), 'Oka Zeger OTW 15', '0821-5555-0015', 'rider', otw005_id, true);
    
    -- Create HO Admin
    INSERT INTO profiles (user_id, full_name, phone, role, is_active) VALUES
    (gen_random_uuid(), 'Super Admin Zeger', '0821-9999-9999', 'ho_admin', true);
    
    -- Create Branch Managers
    INSERT INTO profiles (user_id, full_name, phone, role, branch_id, is_active) VALUES
    (gen_random_uuid(), 'Manager Hub Jakarta Pusat', '0821-1000-0001', 'branch_manager', hub001_id, true),
    (gen_random_uuid(), 'Manager Hub Surabaya', '0821-2000-0001', 'branch_manager', hub002_id, true),
    (gen_random_uuid(), 'Manager OTW Kemang', '0821-1100-0001', 'branch_manager', otw001_id, true),
    (gen_random_uuid(), 'Manager OTW BSD', '0821-1200-0001', 'branch_manager', otw002_id, true),
    (gen_random_uuid(), 'Manager OTW PIK', '0821-1300-0001', 'branch_manager', otw003_id, true),
    (gen_random_uuid(), 'Manager OTW Pondok Indah', '0821-1400-0001', 'branch_manager', otw004_id, true),
    (gen_random_uuid(), 'Manager OTW Kelapa Gading', '0821-1500-0001', 'branch_manager', otw005_id, true);
END $$;