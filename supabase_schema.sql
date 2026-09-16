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
    is_team BOOLEAN DEFAULT FALSE,
    max_team_members INT DEFAULT 1,
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
    is_team BOOLEAN DEFAULT FALSE,
    max_team_members INT DEFAULT 1,
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

  -- 6. Create Registrations Table
  CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    class_name TEXT NOT NULL,
    institute TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    segment_title TEXT NOT NULL,
    event_title TEXT NOT NULL,
    category_name TEXT DEFAULT '',
    amount TEXT DEFAULT '0',
    sender_bkash TEXT NOT NULL,
    trx_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    team_name TEXT DEFAULT '',
    team_members TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- 7. Create Campus Ambassador Applications Table
  CREATE TABLE IF NOT EXISTS public.ca_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    institute TEXT NOT NULL,
    class_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    fb_link TEXT DEFAULT '',
    insta_link TEXT DEFAULT '',
    photo_url TEXT DEFAULT 'logo.png',
    reason TEXT DEFAULT '',
    experience TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- 8. Create App Settings Table (For toggles like CA Portal On/Off)
  CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Backward-Compatibility Migrations (Adds team & CA columns if tables already exist)
  ALTER TABLE public.segment_events ADD COLUMN IF NOT EXISTS is_team BOOLEAN DEFAULT FALSE;
  ALTER TABLE public.segment_events ADD COLUMN IF NOT EXISTS max_team_members INT DEFAULT 1;
  ALTER TABLE public.event_groups ADD COLUMN IF NOT EXISTS is_team BOOLEAN DEFAULT FALSE;
  ALTER TABLE public.event_groups ADD COLUMN IF NOT EXISTS max_team_members INT DEFAULT 1;
  ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS team_name TEXT DEFAULT '';
  ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS team_members TEXT DEFAULT '';
  ALTER TABLE public.ca_applications ADD COLUMN IF NOT EXISTS insta_link TEXT DEFAULT '';

  -- Enable Row Level Security (RLS)
  ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.segment_events ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.event_groups ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.ec_members ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.ca_applications ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

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

    -- Registrations Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access on registrations') THEN
      CREATE POLICY "Allow public access on registrations" ON public.registrations FOR ALL USING (true) WITH CHECK (true);
    END IF;

    -- CA Applications Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access on ca_applications') THEN
      CREATE POLICY "Allow public access on ca_applications" ON public.ca_applications FOR ALL USING (true) WITH CHECK (true);
    END IF;

    -- App Settings Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access on app_settings') THEN
      CREATE POLICY "Allow public access on app_settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);
    END IF;
  END $$;
