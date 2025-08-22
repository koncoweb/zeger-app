-- Clear existing products and add comprehensive menu items with proper UUIDs
TRUNCATE public.products CASCADE;

INSERT INTO public.products (id, name, code, category, description, price, cost_price, image_url, is_active) VALUES
-- MENU OUTLET (Branch Hub)
(gen_random_uuid(), 'Espresso', 'ESP-001', 'Outlet - Hot Coffee', 'Single shot espresso berkualitas tinggi', 15000, 8000, NULL, true),
(gen_random_uuid(), 'Double Espresso', 'ESP-002', 'Outlet - Hot Coffee', 'Double shot espresso untuk rasa yang lebih kuat', 22000, 12000, NULL, true),
(gen_random_uuid(), 'Americano', 'AME-001', 'Outlet - Hot Coffee', 'Espresso dengan air panas, rasa yang clean', 18000, 10000, NULL, true),
(gen_random_uuid(), 'Cappuccino', 'CAP-001', 'Outlet - Hot Coffee', 'Espresso dengan steamed milk dan foam tebal', 25000, 14000, NULL, true),
(gen_random_uuid(), 'Latte', 'LAT-001', 'Outlet - Hot Coffee', 'Espresso dengan steamed milk halus', 28000, 16000, NULL, true),
(gen_random_uuid(), 'Flat White', 'FLW-001', 'Outlet - Hot Coffee', 'Double shot espresso dengan microfoam', 30000, 18000, NULL, true),
(gen_random_uuid(), 'Macchiato', 'MAC-001', 'Outlet - Hot Coffee', 'Espresso dengan sedikit steamed milk', 26000, 15000, NULL, true),
(gen_random_uuid(), 'Mocha', 'MOC-001', 'Outlet - Hot Coffee', 'Espresso dengan chocolate dan steamed milk', 32000, 20000, NULL, true),

-- COLD COFFEE OUTLET
(gen_random_uuid(), 'Iced Americano', 'ICE-AME-001', 'Outlet - Cold Coffee', 'Americano dingin dengan es', 20000, 11000, NULL, true),
(gen_random_uuid(), 'Iced Latte', 'ICE-LAT-001', 'Outlet - Cold Coffee', 'Latte dingin dengan es', 30000, 17000, NULL, true),
(gen_random_uuid(), 'Iced Cappuccino', 'ICE-CAP-001', 'Outlet - Cold Coffee', 'Cappuccino dingin dengan es', 27000, 15000, NULL, true),
(gen_random_uuid(), 'Cold Brew', 'COL-001', 'Outlet - Cold Coffee', 'Kopi diseduh dingin 12 jam', 24000, 13000, NULL, true),
(gen_random_uuid(), 'Iced Caramel Macchiato', 'ICE-CAR-001', 'Outlet - Cold Coffee', 'Macchiato dingin dengan caramel', 35000, 22000, NULL, true),
(gen_random_uuid(), 'Affogato', 'AFF-001', 'Outlet - Cold Coffee', 'Vanilla ice cream dengan shot espresso', 28000, 18000, NULL, true),

-- MANUAL BREW OUTLET
(gen_random_uuid(), 'V60 Pour Over', 'V60-001', 'Outlet - Manual Brew', 'Hand drip dengan V60 dripper', 25000, 15000, NULL, true),
(gen_random_uuid(), 'Chemex', 'CHE-001', 'Outlet - Manual Brew', 'Manual brew dengan Chemex', 30000, 18000, NULL, true),
(gen_random_uuid(), 'French Press', 'FRE-001', 'Outlet - Manual Brew', 'Kopi dengan French Press', 22000, 13000, NULL, true),
(gen_random_uuid(), 'Aeropress', 'AER-001', 'Outlet - Manual Brew', 'Manual brew dengan Aeropress', 26000, 16000, NULL, true),

-- NON COFFEE OUTLET
(gen_random_uuid(), 'Hot Chocolate', 'HOT-CHO-001', 'Outlet - Non Coffee', 'Cokelat panas premium', 22000, 12000, NULL, true),
(gen_random_uuid(), 'Iced Chocolate', 'ICE-CHO-001', 'Outlet - Non Coffee', 'Cokelat dingin dengan es', 24000, 14000, NULL, true),
(gen_random_uuid(), 'Green Tea Latte', 'GRE-LAT-001', 'Outlet - Non Coffee', 'Matcha latte premium', 26000, 16000, NULL, true),
(gen_random_uuid(), 'Chai Latte', 'CHA-LAT-001', 'Outlet - Non Coffee', 'Spiced tea latte', 24000, 14000, NULL, true),

-- ZEGER OTW MENU (Ready to drink for mobile sellers)
(gen_random_uuid(), 'Zeger OTW - Iced Coffee Original', 'OTW-ICE-001', 'OTW - Ready Drink', 'Kopi susu dingin siap minum', 12000, 6000, NULL, true),
(gen_random_uuid(), 'Zeger OTW - Iced Coffee Hazelnut', 'OTW-ICE-002', 'OTW - Ready Drink', 'Kopi susu hazelnut siap minum', 14000, 7000, NULL, true),
(gen_random_uuid(), 'Zeger OTW - Iced Coffee Vanilla', 'OTW-ICE-003', 'OTW - Ready Drink', 'Kopi susu vanilla siap minum', 14000, 7000, NULL, true),
(gen_random_uuid(), 'Zeger OTW - Iced Coffee Caramel', 'OTW-ICE-004', 'OTW - Ready Drink', 'Kopi susu caramel siap minum', 15000, 8000, NULL, true),
(gen_random_uuid(), 'Zeger OTW - Black Coffee', 'OTW-BLK-001', 'OTW - Ready Drink', 'Kopi hitam dingin siap minum', 10000, 5000, NULL, true),
(gen_random_uuid(), 'Zeger OTW - Americano', 'OTW-AME-001', 'OTW - Ready Drink', 'Americano dingin siap minum', 11000, 5500, NULL, true),
(gen_random_uuid(), 'Zeger OTW - Mocha Frappé', 'OTW-MOC-001', 'OTW - Ready Drink', 'Mocha blended siap minum', 16000, 9000, NULL, true),
(gen_random_uuid(), 'Zeger OTW - Caffe Latte', 'OTW-LAT-001', 'OTW - Ready Drink', 'Latte dingin siap minum', 13000, 7000, NULL, true),

-- SNACKS & PASTRY
(gen_random_uuid(), 'Croissant Butter', 'SNK-CRO-001', 'Outlet - Pastry', 'Croissant mentega segar', 18000, 10000, NULL, true),
(gen_random_uuid(), 'Chocolate Croissant', 'SNK-CRO-002', 'Outlet - Pastry', 'Croissant dengan chocolate', 22000, 13000, NULL, true),
(gen_random_uuid(), 'Blueberry Muffin', 'SNK-MUF-001', 'Outlet - Pastry', 'Muffin blueberry segar', 20000, 11000, NULL, true),
(gen_random_uuid(), 'Banana Bread', 'SNK-BAN-001', 'Outlet - Pastry', 'Banana bread homemade', 16000, 9000, NULL, true);

-- Clear and add initial inventory for branches
TRUNCATE public.inventory;

INSERT INTO public.inventory (product_id, branch_id, stock_quantity, min_stock_level, max_stock_level) 
SELECT p.id, b.id, 50, 10, 200
FROM public.products p
CROSS JOIN public.branches b
WHERE p.category LIKE 'Outlet%' AND b.branch_type = 'hub';

INSERT INTO public.inventory (product_id, branch_id, stock_quantity, min_stock_level, max_stock_level)
SELECT p.id, b.id, 100, 20, 500  
FROM public.products p
CROSS JOIN public.branches b
WHERE p.category LIKE 'OTW%' AND b.branch_type = 'otw';