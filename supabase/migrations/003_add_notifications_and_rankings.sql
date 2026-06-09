-- ============================================
-- 1. CREATE NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'general',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to update their own notifications (e.g., mark as read)
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Allow anyone/system to insert notifications
CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Allow users to delete their own notifications
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 2. CREATE TRIGGER FOR ORDER STATUS CHANGES
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If order status transitions to 'processing' (meaning payment was approved)
  IF (NEW.status = 'processing' AND (OLD.status IS NULL OR OLD.status != 'processing')) THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.user_id,
      'Payment Approved 🎉',
      'Your payment of GHS ' || NEW.total::TEXT || ' has been approved. Your data bundle is now being processed.',
      'payment_approved'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it already exists
DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;

-- Create trigger on orders table
CREATE TRIGGER on_order_status_change
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_order_status_change();

-- ============================================
-- 3. CREATE SECURE USER RANKINGS FUNCTION (RPC)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_rankings(current_user_id UUID)
RETURNS TABLE (
  rank INTEGER,
  user_id UUID,
  display_name TEXT,
  total_spent NUMERIC,
  is_current_user BOOLEAN
) AS $$
DECLARE
  is_admin_user BOOLEAN;
BEGIN
  -- Determine if the calling user is an admin
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = current_user_id AND role = 'admin'
  ) INTO is_admin_user;

  RETURN QUERY
  WITH user_spend AS (
    SELECT
      p.id AS uid,
      p.full_name AS fname,
      p.email AS femail,
      COALESCE(SUM(o.total), 0) AS spend
    FROM public.profiles p
    LEFT JOIN public.orders o ON o.user_id = p.id AND o.status IN ('processing', 'done', 'paid', 'delivered')
    GROUP BY p.id, p.full_name, p.email
  ),
  ranked_users AS (
    SELECT
      DENSE_RANK() OVER (ORDER BY spend DESC, uid ASC)::INTEGER AS rnk,
      uid,
      fname,
      femail,
      spend
    FROM user_spend
  )
  SELECT
    rnk,
    uid,
    CASE
      -- Admin sees full names
      WHEN is_admin_user THEN COALESCE(fname, femail, 'User ' || uid::TEXT)
      -- The user themselves sees their own name
      WHEN uid = current_user_id THEN COALESCE(fname, femail, 'You')
      -- Top Performer (Rank #1) is anonymized for others
      WHEN rnk = 1 THEN 'Top Performer 🏆'
      -- Hide other users' names
      ELSE 'User #' || rnk::TEXT
    END AS display_name,
    CASE
      -- Show total spent only to admin or the user themselves
      WHEN is_admin_user OR uid = current_user_id THEN spend
      ELSE NULL::NUMERIC
    END AS total_spent,
    (uid = current_user_id) AS is_current_user
  FROM ranked_users
  ORDER BY rnk ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. ENABLE REAL-TIME FOR NOTIFICATIONS
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;
