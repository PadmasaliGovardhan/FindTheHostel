-- ============================================================
-- KL Hostel Review Platform — Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES TABLE
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT 'KL Student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read display_name and id (never email)
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- ============================================================
-- 2. HOSTELS TABLE
-- ============================================================
CREATE TABLE public.hostels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  distance_from_klu_km NUMERIC(4,1) NOT NULL CHECK (distance_from_klu_km >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
  submitted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.hostels ENABLE ROW LEVEL SECURITY;

-- Everyone can see approved hostels
CREATE POLICY "Approved hostels are viewable by everyone"
  ON public.hostels FOR SELECT
  USING (status = 'approved');

-- Logged-in users can also see pending hostels
CREATE POLICY "Logged-in users can see pending hostels"
  ON public.hostels FOR SELECT
  USING (auth.uid() IS NOT NULL AND status = 'pending');

-- Logged-in users can submit new hostels
CREATE POLICY "Logged-in users can insert hostels"
  ON public.hostels FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Only allow status update (for auto-approval trigger)
CREATE POLICY "System can update hostel status"
  ON public.hostels FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 3. HOSTEL CONFIRMATIONS TABLE
-- ============================================================
CREATE TABLE public.hostel_confirmations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hostel_id UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(hostel_id, user_id)
);

ALTER TABLE public.hostel_confirmations ENABLE ROW LEVEL SECURITY;

-- Logged-in users can view confirmations
CREATE POLICY "Logged-in users can view confirmations"
  ON public.hostel_confirmations FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Logged-in users can confirm hostels
CREATE POLICY "Logged-in users can confirm hostels"
  ON public.hostel_confirmations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 4. REVIEWS TABLE
-- ============================================================
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hostel_id UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (char_length(text) >= 10),
  food_rating INTEGER NOT NULL CHECK (food_rating BETWEEN 1 AND 5),
  cleanliness_rating INTEGER NOT NULL CHECK (cleanliness_rating BETWEEN 1 AND 5),
  staff_rating INTEGER NOT NULL CHECK (staff_rating BETWEEN 1 AND 5),
  room_rating INTEGER NOT NULL CHECK (room_rating BETWEEN 1 AND 5),
  facilities_rating INTEGER NOT NULL CHECK (facilities_rating BETWEEN 1 AND 5),
  recommend BOOLEAN NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(hostel_id, user_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Everyone can read reviews
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT
  USING (true);

-- Logged-in users can create reviews
CREATE POLICY "Logged-in users can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 5. REVIEW VOTES TABLE
-- ============================================================
CREATE TABLE public.review_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

-- Everyone can view votes
CREATE POLICY "Votes are viewable by everyone"
  ON public.review_votes FOR SELECT
  USING (true);

-- Logged-in users can vote
CREATE POLICY "Logged-in users can vote"
  ON public.review_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can change their own vote
CREATE POLICY "Users can update own vote"
  ON public.review_votes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can remove their own vote
CREATE POLICY "Users can delete own vote"
  ON public.review_votes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 6. REVIEW REPORTS TABLE
-- ============================================================
CREATE TABLE public.review_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (char_length(reason) >= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;

-- Only the user who reported can see their own reports
CREATE POLICY "Users can view own reports"
  ON public.review_reports FOR SELECT
  USING (auth.uid() = user_id);

-- Logged-in users can report
CREATE POLICY "Logged-in users can report reviews"
  ON public.review_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 7. TRIGGER: Auto-approve hostel when 3 confirmations reached
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_approve_hostel()
RETURNS TRIGGER AS $$
DECLARE
  confirmation_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO confirmation_count
  FROM public.hostel_confirmations
  WHERE hostel_id = NEW.hostel_id;

  IF confirmation_count >= 3 THEN
    UPDATE public.hostels
    SET status = 'approved'
    WHERE id = NEW.hostel_id AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_hostel_confirmation_insert
  AFTER INSERT ON public.hostel_confirmations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_approve_hostel();

-- ============================================================
-- 8. TRIGGER: Create profile on new user signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'KL Student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 9. TRIGGER: Update updated_at on review edit
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_review_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_review_update
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_review_timestamp();

-- ============================================================
-- 10. VIEW: Hostel stats (aggregated ratings)
-- ============================================================
CREATE OR REPLACE VIEW public.hostel_stats AS
SELECT
  h.id AS hostel_id,
  h.name,
  h.location,
  h.distance_from_klu_km,
  h.status,
  COUNT(r.id) AS review_count,
  COALESCE(AVG(r.food_rating), 0) AS avg_food,
  COALESCE(AVG(r.cleanliness_rating), 0) AS avg_cleanliness,
  COALESCE(AVG(r.staff_rating), 0) AS avg_staff,
  COALESCE(AVG(r.room_rating), 0) AS avg_room,
  COALESCE(AVG(r.facilities_rating), 0) AS avg_facilities,
  COALESCE(
    (AVG(r.food_rating) + AVG(r.cleanliness_rating) + AVG(r.staff_rating) + AVG(r.room_rating) + AVG(r.facilities_rating)) / 5.0,
    0
  ) AS avg_overall,
  COALESCE(
    SUM(CASE WHEN r.recommend THEN 1 ELSE 0 END)::FLOAT / NULLIF(COUNT(r.id), 0) * 100,
    0
  ) AS recommend_percentage
FROM public.hostels h
LEFT JOIN public.reviews r ON r.hostel_id = h.id
GROUP BY h.id, h.name, h.location, h.distance_from_klu_km, h.status;

-- ============================================================
-- 11. STORAGE: Create bucket for review photos
-- ============================================================
-- Run this separately in Supabase Dashboard or via API:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('review-photos', 'review-photos', true);

-- Storage policies (run after bucket creation):
-- CREATE POLICY "Anyone can view review photos"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'review-photos');

-- CREATE POLICY "Authenticated users can upload review photos"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'review-photos' AND auth.uid() IS NOT NULL);

-- CREATE POLICY "Users can delete own review photos"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'review-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
