-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  role TEXT CHECK (role IN ('user', 'admin')) DEFAULT 'user',
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT '📦',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  image_url TEXT,
  file_url TEXT,
  stock INTEGER,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- DATA PACKAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS data_packages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  network TEXT CHECK (network IN ('MTN', 'AirtelTigo', 'Telecel')) NOT NULL,
  size_gb NUMERIC(5,2) NOT NULL,
  label TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  validity_days INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT CHECK (status IN ('pending', 'paid', 'failed', 'delivered')) DEFAULT 'pending',
  paystack_ref TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CART TABLE (Optional - server-side cart)
-- ============================================
CREATE TABLE IF NOT EXISTS cart (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ============================================
-- STORE SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS store_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_name TEXT DEFAULT 'TechStore',
  logo_url TEXT,
  contact_email TEXT,
  paystack_public_key TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- RLS POLICIES & HELPER FUNCTIONS
-- ============================================

-- Helper function to check if the current user is an admin without recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete profiles" ON profiles
  FOR DELETE USING (public.is_admin());

-- Categories RLS (Public read, Admin write)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are public readable" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL USING (public.is_admin());

-- Products RLS (Public read, Admin write)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are public readable" ON products
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage products" ON products
  FOR ALL USING (public.is_admin());

-- Data Packages RLS (Public read, Admin write)
ALTER TABLE data_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Data packages are public readable" ON data_packages
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage data packages" ON data_packages
  FOR ALL USING (public.is_admin());

-- Orders RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own orders" ON orders
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own orders" ON orders
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can read all orders" ON orders
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all orders" ON orders
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete orders" ON orders
  FOR DELETE USING (public.is_admin());

-- Cart RLS
ALTER TABLE cart ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cart" ON cart
  FOR ALL USING (user_id = auth.uid());

-- Store Settings RLS
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store settings public readable" ON store_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage store settings" ON store_settings
  FOR ALL USING (public.is_admin());

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, phone, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    NEW.raw_user_meta_data->>'phone',
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- SEED DATA
-- ============================================

-- Insert default categories
INSERT INTO categories (name, slug, icon, is_active) VALUES
  ('Data Bundles', 'data-bundles', '📱', true),
  ('Laptops', 'laptops', '💻', true),
  ('Phones', 'phones', '📲', true),
  ('PSD Files', 'psd-files', '🎨', true),
  ('T-Shirts', 't-shirts', '👕', true)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample data packages
INSERT INTO data_packages (network, size_gb, label, price, validity_days, is_active) VALUES
  ('MTN', 1, '1GB', 5.00, 30, true),
  ('MTN', 2, '2GB', 9.00, 30, true),
  ('MTN', 5, '5GB', 20.00, 30, true),
  ('MTN', 10, '10GB', 35.00, 30, true),
  ('MTN', 20, '20GB', 60.00, 30, true),
  ('MTN', 50, '50GB', 120.00, 30, true),
  ('MTN', 100, '100GB', 200.00, 30, true),
  ('AirtelTigo', 1, '1GB', 4.50, 30, true),
  ('AirtelTigo', 2, '2GB', 8.50, 30, true),
  ('AirtelTigo', 5, '5GB', 18.00, 30, true),
  ('AirtelTigo', 10, '10GB', 32.00, 30, true),
  ('AirtelTigo', 20, '20GB', 55.00, 30, true),
  ('AirtelTigo', 50, '50GB', 110.00, 30, true),
  ('AirtelTigo', 100, '100GB', 180.00, 30, true),
  ('Telecel', 1, '1GB', 4.00, 30, true),
  ('Telecel', 2, '2GB', 8.00, 30, true),
  ('Telecel', 5, '5GB', 17.00, 30, true),
  ('Telecel', 10, '10GB', 30.00, 30, true),
  ('Telecel', 20, '20GB', 50.00, 30, true),
  ('Telecel', 50, '50GB', 100.00, 30, true),
  ('Telecel', 100, '100GB', 170.00, 30, true)
ON CONFLICT DO NOTHING;

-- Insert store settings
INSERT INTO store_settings (store_name, contact_email) VALUES
  ('TechStore', 'support@techstore.com')
ON CONFLICT DO NOTHING;

-- ============================================
-- STORAGE CONFIGURATION
-- ============================================

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('digital-files', 'digital-files', false) -- Private bucket
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product-images (Public read, Authenticated write)
CREATE POLICY "Public Select product-images" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated Manage product-images" ON storage.objects
  FOR ALL TO authenticated USING (bucket_id = 'product-images') WITH CHECK (bucket_id = 'product-images');

-- Storage policies for digital-files (Secure download only if paid, Admin full access)
CREATE POLICY "Admins can manage digital-files" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'digital-files' AND public.is_admin())
  WITH CHECK (bucket_id = 'digital-files');

CREATE POLICY "Select digital-files if paid" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'digital-files' AND
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.user_id = auth.uid()
        AND o.status = 'paid'
        AND EXISTS (
          SELECT 1 FROM jsonb_to_recordset(o.items) AS x(file_url text)
          WHERE x.file_url LIKE '%' || name
        )
    )
  );
