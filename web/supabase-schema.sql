-- =============================================
-- SkillUp — Schéma Supabase
-- Colle ce SQL dans : Supabase > SQL Editor > New Query
-- =============================================

-- Profiles
create table if not exists public.profiles (
  id         uuid references auth.users(id) on delete cascade primary key,
  username   text unique not null,
  hashtag    text unique not null,
  credits    integer not null default 1000,
  created_at timestamptz default now()
);

-- Matches
create table if not exists public.matches (
  id                 uuid default gen_random_uuid() primary key,
  game               text not null,
  challenger_id      uuid references public.profiles(id) not null,
  opponent_id        uuid references public.profiles(id) not null,
  wager              integer not null check (wager > 0),
  status             text not null default 'pending'
                       check (status in ('pending','active','finished','completed','disputed')),
  challenger_result  text check (challenger_result in ('win','loss')),
  opponent_result    text check (opponent_result in ('win','loss')),
  winner_id          uuid references public.profiles(id),
  created_at         timestamptz default now()
);

-- Messages
create table if not exists public.messages (
  id         uuid default gen_random_uuid() primary key,
  match_id   uuid references public.matches(id) on delete cascade not null,
  sender_id  uuid references public.profiles(id) not null,
  content    text not null,
  created_at timestamptz default now()
);

-- ── Row Level Security ────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.matches  enable row level security;
alter table public.messages enable row level security;

-- Profiles
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- Matches
create policy "matches_select" on public.matches for select using (
  auth.uid() = challenger_id or auth.uid() = opponent_id
);
create policy "matches_insert" on public.matches for insert with check (auth.uid() = challenger_id);
create policy "matches_update" on public.matches for update using (
  auth.uid() = challenger_id or auth.uid() = opponent_id
);

-- Messages
create policy "messages_select" on public.messages for select using (
  exists (
    select 1 from public.matches m
    where m.id = messages.match_id
      and (m.challenger_id = auth.uid() or m.opponent_id = auth.uid())
  )
);
create policy "messages_insert" on public.messages for insert with check (
  auth.uid() = sender_id and
  exists (
    select 1 from public.matches m
    where m.id = messages.match_id
      and (m.challenger_id = auth.uid() or m.opponent_id = auth.uid())
  )
);

-- ── Realtime ──────────────────────────────────────────────────
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.matches;
