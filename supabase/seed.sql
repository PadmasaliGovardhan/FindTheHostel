-- ============================================================
-- KL Hostel Review Platform — Seed Data
-- Run this AFTER schema.sql in Supabase SQL Editor
-- ============================================================

-- Insert sample approved hostels near KL University Vijayawada
INSERT INTO public.hostels (id, name, location, distance_from_klu_km, status, created_at) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-111111111111', 'Sri Sai Boys Hostel', 'Vaddeswaram, near Green Fields Layout', 1.2, 'approved', NOW() - INTERVAL '30 days'),
  ('a1b2c3d4-e5f6-7890-abcd-222222222222', 'Lakshmi Girls Hostel', 'Vaddeswaram Main Road, opposite SBI Bank', 0.8, 'approved', NOW() - INTERVAL '25 days'),
  ('a1b2c3d4-e5f6-7890-abcd-333333333333', 'KLU Premium Stay', 'Green Fields, Vaddeswaram', 1.5, 'approved', NOW() - INTERVAL '20 days'),
  ('a1b2c3d4-e5f6-7890-abcd-444444444444', 'Royal Residency Hostel', 'Mangalagiri Road, near IIIT junction', 3.2, 'approved', NOW() - INTERVAL '18 days'),
  ('a1b2c3d4-e5f6-7890-abcd-555555555555', 'Comfort Zone PG', 'Tadepalli, near Bus Stand', 4.5, 'approved', NOW() - INTERVAL '15 days'),
  ('a1b2c3d4-e5f6-7890-abcd-666666666666', 'Narayana Boys Hostel', 'Vaddeswaram Village, behind KLU Campus', 0.5, 'approved', NOW() - INTERVAL '12 days'),
  ('a1b2c3d4-e5f6-7890-abcd-777777777777', 'Sunshine Ladies PG', 'Near Undavalli Caves Road', 2.8, 'approved', NOW() - INTERVAL '10 days'),
  ('a1b2c3d4-e5f6-7890-abcd-888888888888', 'Campus Edge Hostel', 'Adjacent to KLU East Gate', 0.3, 'approved', NOW() - INTERVAL '8 days');

-- Insert one pending hostel for testing
INSERT INTO public.hostels (id, name, location, distance_from_klu_km, status, created_at) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-999999999999', 'New Star Hostel', 'Mangalagiri, near Bus Depot', 5.0, 'pending', NOW() - INTERVAL '2 days');
