-- SkillUp Gaming Platform - Supabase Schema
-- Run this in your Supabase SQL editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  credits INTEGER NOT NULL DEFAULT 1000,
  reputation INTEGER NOT NULL DEFAULT 0,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('1v1', '2v2', '3v3')),
  rules TEXT,
  entry_cost INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'disputed')),
  creator_id UUID REFERENCES public.users(id) NOT NULL,
  winner_team INTEGER CHECK (winner_team IN (1, 2)),
  max_players INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.match_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  team INTEGER NOT NULL CHECK (team IN (1, 2)),
  result_submitted BOOLEAN DEFAULT FALSE,
  claimed_result TEXT CHECK (claimed_result IN ('win', 'loss')),
  credits_locked BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.proofs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES public.matches(id) UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  winner_team INTEGER CHECK (winner_team IN (1, 2)),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- ============================================================
-- TIMESTAMPS TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER matches_updated_at BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- RPC FUNCTIONS (called from backend with service key)
-- ============================================================

-- Lock credits when joining a match
CREATE OR REPLACE FUNCTION lock_match_credits(
  p_user_id UUID,
  p_match_id UUID,
  p_amount INTEGER
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF (SELECT credits FROM public.users WHERE id = p_user_id) < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
  UPDATE public.users SET credits = credits - p_amount WHERE id = p_user_id;
  UPDATE public.match_participants
    SET credits_locked = TRUE
    WHERE user_id = p_user_id AND match_id = p_match_id;
END;
$$;

-- Distribute winnings to winner team
CREATE OR REPLACE FUNCTION distribute_winnings(
  p_match_id UUID,
  p_winner_team INTEGER
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_entry_cost INTEGER;
  v_total_players INTEGER;
  v_winner_count INTEGER;
  v_per_winner INTEGER;
BEGIN
  SELECT entry_cost INTO v_entry_cost FROM public.matches WHERE id = p_match_id;
  SELECT COUNT(*) INTO v_total_players FROM public.match_participants WHERE match_id = p_match_id;
  SELECT COUNT(*) INTO v_winner_count FROM public.match_participants
    WHERE match_id = p_match_id AND team = p_winner_team;

  v_per_winner := (v_entry_cost * v_total_players) / v_winner_count;

  UPDATE public.users
  SET credits = credits + v_per_winner,
      reputation = reputation + 10
  WHERE id IN (
    SELECT user_id FROM public.match_participants
    WHERE match_id = p_match_id AND team = p_winner_team
  );

  -- Decrease reputation for losers
  UPDATE public.users
  SET reputation = GREATEST(0, reputation - 2)
  WHERE id IN (
    SELECT user_id FROM public.match_participants
    WHERE match_id = p_match_id AND team != p_winner_team
  );

  UPDATE public.matches
  SET status = 'completed', winner_team = p_winner_team, updated_at = NOW()
  WHERE id = p_match_id;
END;
$$;

-- Refund all participants (used in disputes resolved without winner, or admin voids)
CREATE OR REPLACE FUNCTION refund_match(p_match_id UUID) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_entry_cost INTEGER;
BEGIN
  SELECT entry_cost INTO v_entry_cost FROM public.matches WHERE id = p_match_id;
  UPDATE public.users
  SET credits = credits + v_entry_cost
  WHERE id IN (
    SELECT user_id FROM public.match_participants
    WHERE match_id = p_match_id AND credits_locked = TRUE
  );
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- Users
CREATE POLICY "users_public_read" ON public.users FOR SELECT USING (true);
CREATE POLICY "users_own_insert" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_own_update" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Matches
CREATE POLICY "matches_public_read" ON public.matches FOR SELECT USING (true);
CREATE POLICY "matches_auth_insert" ON public.matches FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "matches_creator_update" ON public.matches FOR UPDATE USING (auth.uid() = creator_id);

-- Match participants
CREATE POLICY "participants_public_read" ON public.match_participants FOR SELECT USING (true);
CREATE POLICY "participants_auth_insert" ON public.match_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "participants_own_update" ON public.match_participants FOR UPDATE USING (auth.uid() = user_id);

-- Proofs
CREATE POLICY "proofs_participant_read" ON public.proofs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.match_participants
    WHERE match_id = proofs.match_id AND user_id = auth.uid()
  )
);
CREATE POLICY "proofs_own_insert" ON public.proofs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Disputes
CREATE POLICY "disputes_public_read" ON public.disputes FOR SELECT USING (true);

-- ============================================================
-- STORAGE
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'proofs',
  'proofs',
  false,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']
) ON CONFLICT DO NOTHING;

CREATE POLICY "proofs_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'proofs' AND auth.role() = 'authenticated');

CREATE POLICY "proofs_participant_download" ON storage.objects
  FOR SELECT USING (bucket_id = 'proofs' AND auth.role() = 'authenticated');

-- ============================================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
