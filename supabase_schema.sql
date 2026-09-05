-- ==========================================================================
-- CULTURA FIESTA 1.0 — Complete Supabase Database Schema
-- MPSC Cultural Club
-- Instructions: Copy and run this entire script in Supabase -> SQL Editor
-- ==========================================================================

-- 1. Create Segments Table
CREATE TABLE IF NOT EXISTS public.segments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  tag TEXT,
  icon TEXT,
  description TEXT,
  day_info TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Segment Events Table
CREATE TABLE IF NOT EXISTS public.segment_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  segment_id UUID REFERENCES public.segments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  time TEXT,
  venue TEXT,
  price TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Event Groups (Categories) Table
CREATE TABLE IF NOT EXISTS public.event_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.segment_events(id) ON DELETE CASCADE,
  group_name TEXT NOT NULL,
  age_limit TEXT,
  rules TEXT,
  description TEXT,
  price TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Schedule Events Table (Festival Timeline)
CREATE TABLE IF NOT EXISTS public.schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day TEXT NOT NULL,
  time TEXT NOT NULL,
  title TEXT NOT NULL,
  venue TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Executive Committee Members Table
CREATE TABLE IF NOT EXISTS public.ec_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  wing TEXT DEFAULT 'BVB',
  batch TEXT DEFAULT 'BVB',
  image_url TEXT DEFAULT 'logo.png',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.segment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ec_members ENABLE ROW LEVEL SECURITY;

-- Allow Public Access Policies (SELECT, INSERT, UPDATE, DELETE)
DO $$
BEGIN
  -- Segments Policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access on segments') THEN
    CREATE POLICY "Allow public access on segments" ON public.segments FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Segment Events Policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access on segment_events') THEN
    CREATE POLICY "Allow public access on segment_events" ON public.segment_events FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Event Groups Policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access on event_groups') THEN
    CREATE POLICY "Allow public access on event_groups" ON public.event_groups FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Schedule Policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access on schedule') THEN
    CREATE POLICY "Allow public access on schedule" ON public.schedule FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- EC Members Policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access on ec_members') THEN
    CREATE POLICY "Allow public access on ec_members" ON public.ec_members FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
