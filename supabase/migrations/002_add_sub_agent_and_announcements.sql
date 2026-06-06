-- ============================================
-- 1. UPDATE PROFILE ROLE CONSTRAINT
-- ============================================
-- Drop existing check constraint if it exists (inline constraints are usually named profiles_role_check)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new check constraint allowing 'sub_agent'
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin', 'sub_agent'));

-- ============================================
-- 2. ADD SUB-AGENT PRICING TO DATA PACKAGES
-- ============================================
ALTER TABLE public.data_packages ADD COLUMN IF NOT EXISTS sub_agent_price NUMERIC(10,2) DEFAULT NULL;

-- ============================================
-- 3. CREATE ANNOUNCEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT DEFAULT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to read active announcements
CREATE POLICY "Announcements are public readable" ON public.announcements
  FOR SELECT USING (true);

-- Policy to allow admins to manage announcements
CREATE POLICY "Admins can manage announcements" ON public.announcements
  FOR ALL USING (public.is_admin());
