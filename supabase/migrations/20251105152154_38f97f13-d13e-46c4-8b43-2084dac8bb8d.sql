-- Create function to auto-create customer_users when profile with role='customer' is created
CREATE OR REPLACE FUNCTION create_customer_user_on_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Only for customer role
  IF NEW.role = 'customer' THEN
    -- Insert into customer_users if not exists
    INSERT INTO customer_users (user_id, email, name, phone, role, points)
    SELECT 
      NEW.user_id,
      au.email,
      NEW.full_name,
      NEW.phone,
      'customer',
      0
    FROM auth.users au
    WHERE au.id = NEW.user_id
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_create_customer_user ON profiles;
CREATE TRIGGER trigger_create_customer_user
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_customer_user_on_profile();

-- Table for promo banners (poster/carousel in customer app)
CREATE TABLE IF NOT EXISTS public.promo_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  valid_from DATE,
  valid_until DATE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table for loyalty tier configuration
CREATE TABLE IF NOT EXISTS public.loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT NOT NULL UNIQUE,
  min_points INTEGER NOT NULL,
  discount_percentage NUMERIC(5,2) DEFAULT 0,
  benefits JSONB,
  tier_color TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table for loyalty rewards catalog
CREATE TABLE IF NOT EXISTS public.loyalty_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_name TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  reward_type TEXT NOT NULL,
  reward_value JSONB,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  valid_from DATE,
  valid_until DATE,
  stock_quantity INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE promo_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view active promos/rewards
CREATE POLICY "Anyone can view active banners" ON promo_banners
  FOR SELECT USING (is_active = true AND (valid_until IS NULL OR valid_until >= CURRENT_DATE));

CREATE POLICY "Anyone can view loyalty tiers" ON loyalty_tiers
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view active rewards" ON loyalty_rewards
  FOR SELECT USING (is_active = true);

-- Only HO and Branch managers can manage
CREATE POLICY "HO and BM can manage banners" ON promo_banners
  FOR ALL USING (
    has_role('ho_admin'::user_role) OR 
    has_role('branch_manager'::user_role) OR
    has_role('1_HO_Admin'::user_role) OR
    has_role('1_HO_Owner'::user_role) OR
    has_role('2_Hub_Branch_Manager'::user_role)
  );

CREATE POLICY "HO can manage loyalty tiers" ON loyalty_tiers
  FOR ALL USING (
    has_role('ho_admin'::user_role) OR
    has_role('1_HO_Admin'::user_role) OR
    has_role('1_HO_Owner'::user_role)
  );

CREATE POLICY "HO can manage loyalty rewards" ON loyalty_rewards
  FOR ALL USING (
    has_role('ho_admin'::user_role) OR
    has_role('1_HO_Admin'::user_role) OR
    has_role('1_HO_Owner'::user_role)
  );

-- Insert default loyalty tiers
INSERT INTO loyalty_tiers (tier_name, min_points, discount_percentage, tier_color, benefits) VALUES
  ('Bronze', 0, 0, '#CD7F32', '{"description": "Tier awal untuk member baru"}'),
  ('Silver', 500, 5, '#C0C0C0', '{"description": "Diskon 5% untuk semua pembelian", "free_delivery": false}'),
  ('Gold', 1500, 10, '#FFD700', '{"description": "Diskon 10% + Free delivery", "free_delivery": true}'),
  ('Platinum', 5000, 15, '#E5E4E2', '{"description": "Diskon 15% + Free delivery + Birthday bonus", "free_delivery": true, "birthday_bonus": 50000}')
ON CONFLICT (tier_name) DO NOTHING;