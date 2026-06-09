-- ============================================
-- 1. ADD MASHUP COLUMN TO DATA PACKAGES
-- ============================================
ALTER TABLE public.data_packages ADD COLUMN IF NOT EXISTS is_mashup BOOLEAN DEFAULT false;

-- ============================================
-- 2. ADD MAINTENANCE MODE TO STORE SETTINGS
-- ============================================
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS is_maintenance BOOLEAN DEFAULT false;
