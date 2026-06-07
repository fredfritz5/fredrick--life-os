-- ============================================================
-- FREDRICK LIFE OS – SUPABASE SCHEMA
-- Run this entire file in the Supabase SQL editor.
-- ============================================================

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT DEFAULT 'Fredrick Ochieng',
  current_focus TEXT DEFAULT 'Building the future of AI in Africa',
  bio         TEXT,
  profile_photo_url TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sectors (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name                  TEXT NOT NULL,
  icon                  TEXT NOT NULL DEFAULT 'circle',
  color                 TEXT NOT NULL DEFAULT '#6366f1',
  description           TEXT,
  verification_criteria TEXT,
  vision_required       BOOLEAN DEFAULT true,
  "order"               INTEGER DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.yearly_goals (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sector_id UUID REFERENCES public.sectors(id) ON DELETE CASCADE NOT NULL,
  year      INTEGER NOT NULL,
  text      TEXT NOT NULL,
  status    TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.monthly_goals (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  yearly_goal_id UUID REFERENCES public.yearly_goals(id) ON DELETE CASCADE NOT NULL,
  year           INTEGER NOT NULL,
  month          INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  text           TEXT NOT NULL,
  status         TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.weekly_goals (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  monthly_goal_id UUID REFERENCES public.monthly_goals(id) ON DELETE CASCADE NOT NULL,
  year            INTEGER NOT NULL,
  week_number     INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 53),
  text            TEXT NOT NULL,
  status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.daily_goals (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                 UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  weekly_goal_id          UUID REFERENCES public.weekly_goals(id) ON DELETE CASCADE NOT NULL,
  date                    DATE NOT NULL,
  text                    TEXT NOT NULL,
  status                  TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
  proof_image_url         TEXT,
  verification_result_json JSONB,
  manual_override_reason  TEXT,
  completed_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.accountability_commitments (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sector_id   UUID REFERENCES public.sectors(id) ON DELETE SET NULL,
  text        TEXT NOT NULL,
  date_made   DATE NOT NULL DEFAULT CURRENT_DATE,
  status      TEXT DEFAULT 'active' CHECK (status IN ('active', 'honored', 'broken')),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sector_notes (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sector_id UUID REFERENCES public.sectors(id) ON DELETE CASCADE NOT NULL,
  date      DATE NOT NULL DEFAULT CURRENT_DATE,
  text      TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.personal_facts (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  fact_type TEXT NOT NULL,
  content   TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.achievements (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  title       TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.alert_settings (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  sound_muted_global  BOOLEAN DEFAULT false,
  evening_alert_time  TIME DEFAULT '21:00:00',
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.user_profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sectors                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yearly_goals             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_goals            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_goals             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_goals              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accountability_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sector_notes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_facts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_settings           ENABLE ROW LEVEL SECURITY;

-- user_profiles
CREATE POLICY "user_profiles_select" ON public.user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_profiles_insert" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_profiles_update" ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id);

-- sectors
CREATE POLICY "sectors_select" ON public.sectors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sectors_insert" ON public.sectors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sectors_update" ON public.sectors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "sectors_delete" ON public.sectors FOR DELETE USING (auth.uid() = user_id);

-- yearly_goals
CREATE POLICY "yearly_goals_select" ON public.yearly_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "yearly_goals_insert" ON public.yearly_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "yearly_goals_update" ON public.yearly_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "yearly_goals_delete" ON public.yearly_goals FOR DELETE USING (auth.uid() = user_id);

-- monthly_goals
CREATE POLICY "monthly_goals_select" ON public.monthly_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "monthly_goals_insert" ON public.monthly_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "monthly_goals_update" ON public.monthly_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "monthly_goals_delete" ON public.monthly_goals FOR DELETE USING (auth.uid() = user_id);

-- weekly_goals
CREATE POLICY "weekly_goals_select" ON public.weekly_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "weekly_goals_insert" ON public.weekly_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "weekly_goals_update" ON public.weekly_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "weekly_goals_delete" ON public.weekly_goals FOR DELETE USING (auth.uid() = user_id);

-- daily_goals
CREATE POLICY "daily_goals_select" ON public.daily_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "daily_goals_insert" ON public.daily_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "daily_goals_update" ON public.daily_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "daily_goals_delete" ON public.daily_goals FOR DELETE USING (auth.uid() = user_id);

-- accountability_commitments
CREATE POLICY "commitments_select" ON public.accountability_commitments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "commitments_insert" ON public.accountability_commitments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "commitments_update" ON public.accountability_commitments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "commitments_delete" ON public.accountability_commitments FOR DELETE USING (auth.uid() = user_id);

-- sector_notes
CREATE POLICY "notes_select" ON public.sector_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notes_insert" ON public.sector_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notes_update" ON public.sector_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notes_delete" ON public.sector_notes FOR DELETE USING (auth.uid() = user_id);

-- personal_facts
CREATE POLICY "facts_select" ON public.personal_facts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "facts_insert" ON public.personal_facts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "facts_update" ON public.personal_facts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "facts_delete" ON public.personal_facts FOR DELETE USING (auth.uid() = user_id);

-- achievements
CREATE POLICY "achievements_select" ON public.achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "achievements_insert" ON public.achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "achievements_update" ON public.achievements FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "achievements_delete" ON public.achievements FOR DELETE USING (auth.uid() = user_id);

-- alert_settings
CREATE POLICY "alert_settings_select" ON public.alert_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "alert_settings_insert" ON public.alert_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "alert_settings_update" ON public.alert_settings FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- STORAGE BUCKET for proof images
-- ============================================================
-- Run this in Supabase Dashboard > Storage, or via SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('proof-images', 'proof-images', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: authenticated users can manage their own folder
CREATE POLICY "proof_images_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'proof-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "proof_images_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'proof-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "proof_images_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'proof-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
