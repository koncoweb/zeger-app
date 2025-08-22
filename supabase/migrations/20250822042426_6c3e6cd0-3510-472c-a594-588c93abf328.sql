-- Create some dummy profiles data
INSERT INTO profiles (user_id, full_name, phone, role, branch_id) VALUES
(NULL, 'Admin HO', '021-1111111', 'ho_admin', NULL),
(NULL, 'Manajer Jakarta Pusat', '021-2222222', 'branch_manager', (SELECT id FROM branches WHERE code = 'ZCC001')),
(NULL, 'Manajer Mall Plaza', '021-3333333', 'branch_manager', (SELECT id FROM branches WHERE code = 'ZCM001')),
(NULL, 'Budi Santoso', '081-1234567', 'rider', (SELECT id FROM branches WHERE code = 'ZCC001')),
(NULL, 'Sari Dewi', '081-2345678', 'rider', (SELECT id FROM branches WHERE code = 'ZCC001')),
(NULL, 'Andi Wijaya', '081-3456789', 'rider', (SELECT id FROM branches WHERE code = 'ZCM001')),
(NULL, 'Finance Officer', '021-4444444', 'finance', NULL)
ON CONFLICT DO NOTHING;