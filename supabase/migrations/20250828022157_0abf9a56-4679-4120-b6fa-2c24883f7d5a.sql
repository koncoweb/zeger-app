-- Reset products and insert new menu items
DELETE FROM products;

-- Insert new menu items from the provided list
INSERT INTO products (name, category, price, cost_price, description, code, is_active) VALUES
('Americano', 'Espresso Based', 8000, 3600, 'Espresso dengan air dingin (Tanpa Pemanis)', 'AME001', true),
('Sunrise Americano', 'Espresso Based', 12000, 5400, 'Espresso dengan air dingin dan rasa buah Tropical', 'SUN001', true),
('Citrus Coffee', 'Espresso Based', 12000, 5400, 'Perpaduan Espresso dengan air dingin dan lemon segar', 'CIT001', true),
('Classic Latte', 'Espresso Based', 8000, 3600, 'Espresso dengan susu creamy (Tanpa Pemanis)', 'CLA001', true),
('Dolce Latte', 'Espresso Based', 10000, 4500, 'Espresso dengan susu creamy dan SKM', 'DOL001', true),
('Aren Creamy Latte', 'Espresso Based', 13000, 5850, 'Espresso dengan Susu Creamy dan Aren khas', 'ARE001', true),
('Caramel Creamy Latte', 'Espresso Based', 13000, 5850, 'Espresso dengan susu creamy dan syrup baileys', 'CAR001', true),
('Bailey''s Creamy Latte', 'Espresso Based', 15000, 6750, 'Espresso dengan susu creamy dan syrup caramel', 'BAI001', true),
('Butterscotch Creamy Latte', 'Espresso Based', 15000, 6750, 'Creamy latte rasa butterscotch, manis gurih memanjakan.', 'BUT001', true),
('Caramel Mocha', 'Espresso Based', 15000, 6750, 'Espresso dengan susu Creamy, Mocha, dan Caramel', 'CAM001', true),
('Zepresso', 'Espresso Based', 10000, 4500, 'Espresso shot dalam chocholat, praktis dibawa ke mana aja.', 'ZEP001', true),
('Lychee Tea', 'Refresher', 8000, 3600, 'Teh wangi dengan rasa leci manis menyegarkan.', 'LYC001', true),
('Lemonade', 'Refresher', 8000, 3600, 'Minuman lemon segar, asam manis yang bikin fresh.', 'LEM001', true),
('Cookies n Cream', 'Milk Based', 12000, 5400, 'Susu Creamy dengan cookies crumb', 'COO001', true),
('Choco Malt', 'Milk Based', 10000, 4500, 'Chocolate dengan susu creamy', 'CHO001', true),
('Matcha Latte', 'Milk Based', 13000, 5850, 'Teh Hijau Jepang dengan susu, pahit lembut & creamy.', 'MAT001', true);

-- Delete riders that are not in the specified list
-- First get the user_ids of riders to keep
WITH riders_to_keep AS (
  SELECT user_id FROM auth.users 
  WHERE email IN (
    'zegerotw11@gmail.com',
    'fajarkurniawijaya@gmail.com', 
    'flagbastardlimited@gmail.com',
    'trikukuh6@gmail.com'
  )
),
riders_to_delete AS (
  SELECT p.user_id FROM profiles p
  WHERE p.role = 'rider' 
  AND p.user_id NOT IN (SELECT user_id FROM riders_to_keep)
  AND p.user_id NOT IN (
    SELECT user_id FROM auth.users 
    WHERE email IN ('niekayu@gmail.com', 'zeger.indonesia@gmail.com')
  )
)
DELETE FROM profiles WHERE user_id IN (SELECT user_id FROM riders_to_delete);