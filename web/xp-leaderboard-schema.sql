-- XP + Level system
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- Indexes for leaderboard queries
CREATE INDEX IF NOT EXISTS profiles_xp_idx ON public.profiles (xp DESC);
CREATE INDEX IF NOT EXISTS profiles_wins_idx ON public.profiles (wins DESC);
