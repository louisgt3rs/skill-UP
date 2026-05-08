-- =============================================
-- SkillUp — Schéma Supabase complet
-- Colle ce SQL dans : Supabase > SQL Editor > New Query
-- =============================================

-- ── Nettoyage de l'ancien schéma (si nécessaire) ─────────
-- Supprime les tables de l'ancien supabase/schema.sql pour éviter
-- les conflits de colonnes (creator_id vs challenger_id, etc.)
drop table if exists public.match_participants cascade;
drop table if exists public.proofs             cascade;
drop table if exists public.disputes           cascade;
drop table if exists public.matches            cascade;
drop table if exists public.users              cascade;

-- ── Profiles ──────────────────────────────────────────────
create table if not exists public.profiles (
  id                  uuid references auth.users(id) on delete cascade primary key,
  username            text unique not null,
  hashtag             text unique not null,
  credits             integer not null default 100,
  is_admin            boolean not null default false,
  wins                integer not null default 0,
  losses              integer not null default 0,
  win_streak          integer not null default 0,
  discord_id          text unique,
  discord_username    text,
  discord_avatar      text,
  discord_linked_at   timestamptz,
  onboarding_done     boolean not null default false,
  created_at          timestamptz default now()
);

-- ── Games ─────────────────────────────────────────────────
create table if not exists public.games (
  id          uuid default gen_random_uuid() primary key,
  slug        text unique not null,
  name        text not null,
  emoji       text not null default '🎮',
  description text not null default '',
  rules       text not null default '',
  platform    text not null default 'Mobile',
  available   boolean not null default false,
  color       text not null default '#7C3AED',
  bg          text not null default '#0D0A1F',
  image_url   text,
  sort_order  integer not null default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Seed games (idempotent)
insert into public.games (slug, name, emoji, description, rules, platform, available, color, bg, sort_order) values
(
  'brawl-stars', 'Brawl Stars', '🌟',
  'Duels 1v1 en mode Showdown ou Duel. Le jeu de baston mobile le plus populaire.',
  'Mode : Showdown 1v1 ou Duel
• Chaque joueur choisit son Brawler librement
• Format : meilleur sur 3 manches (First to 2)
• Screenshot du résultat final obligatoire après chaque manche
• En cas de déconnexion involontaire : la manche est rejouée
• Utilisation de bugs / glitchs = défaite immédiate',
  'Mobile', true, '#FFDE59', '#1A1200', 1
),
(
  'clash-royale', 'Clash Royale',  '👑',
  'Batailles de cartes stratégiques en 1v1. Détruisez la tour adverse.',
  'Format : Best of 3 (premier à 2 victoires)
• Deck libre — aucune restriction de cartes
• Les 2 joueurs s''échangent leur tag in-game pour l''invitation
• Screenshot du score final (couronnes + temps) obligatoire
• Abandon = défaite',
  'Mobile', false, '#60A5FA', '#0A1520', 2
),
(
  'fc-mobile', 'FC Mobile', '⚽',
  'Football 1v1 sur mobile. Montrez votre niveau tactique.',
  'Format : 1 match complet
• Paramètres : durée 6 min, difficulté Légendaire
• Les deux joueurs s''envoient une demande d''ami avant le match
• Screenshot du score final obligatoire
• Prolongations et tirs au but si égalité à la fin du temps réglementaire',
  'Mobile', false, '#34D399', '#001A0A', 3
),
(
  'fortnite', 'Fortnite', '🎯',
  'Battle Royale — kills et placement. Prouvez que vous êtes le meilleur.',
  'Format : 1 partie en solo ou 1v1 box fight (à définir lors du défi)
• Mode Box Fight 1v1 : le joueur avec le plus d''éliminations gagne
• Mode BR Solo : kills comptés, en cas d''égalité le mieux classé l''emporte
• Stream ou enregistrement vidéo fortement recommandé comme preuve',
  'PC / Console', false, '#A78BFA', '#0D0A1F', 4
),
(
  'rocket-league', 'Rocket League', '🚀',
  'Football avec des voitures en 1v1. Précision et réflexes au rendez-vous.',
  'Format : 1 match (5 minutes) en mode 1v1
• Paramètres par défaut Rocket League ranked
• Les deux joueurs jouent via le système de défi privé in-game
• Screenshot du score final avec pseudo visible obligatoire
• Prolongation si égalité (règle standard)',
  'PC / Console', false, '#F97316', '#1A0800', 5
),
(
  'ea-fc', 'EA FC 25', '🏟️',
  'Football sur PC / Console. Ultimate Team en 1v1.',
  'Format : 1 match Ultimate Team complet
• Paramètres : durée 6 min, accélération de sprint normale
• Invitation via EA ID (partagez votre EA ID dans le chat du duel)
• Screenshot du score final obligatoire
• Pas de restrictions de notation d''équipe sauf accord préalable',
  'PC / Console', false, '#22D3EE', '#001520', 6
)
on conflict (slug) do nothing;

-- ── Matches ───────────────────────────────────────────────
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

-- ── Messages ──────────────────────────────────────────────
create table if not exists public.messages (
  id         uuid default gen_random_uuid() primary key,
  match_id   uuid references public.matches(id) on delete cascade not null,
  sender_id  uuid references public.profiles(id) not null,
  content    text not null,
  created_at timestamptz default now()
);

-- ── Transactions ──────────────────────────────────────────
create table if not exists public.transactions (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  type        text not null check (type in ('deposit','withdrawal','match_wager','match_win','match_loss','refund')),
  amount      integer not null,
  description text,
  status      text not null default 'completed' check (status in ('pending','completed','failed')),
  created_at  timestamptz default now()
);

-- ── Withdrawal requests ───────────────────────────────────
create table if not exists public.withdrawal_requests (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references public.profiles(id) on delete cascade not null,
  amount_credits  integer not null check (amount_credits > 0),
  amount_eur      numeric(10,2) not null,
  full_name       text not null,
  iban            text,
  method          text not null default 'bank_transfer',
  status          text not null default 'pending' check (status in ('pending','approved','rejected')),
  admin_note      text,
  created_at      timestamptz default now()
);

-- ── Trigger : auto-créer un profil au signup ─────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  v_tag text;
  v_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int;
begin
  -- génère un hashtag unique de 5 chars
  loop
    v_tag := '';
    for i in 1..5 loop
      v_tag := v_tag || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
    end loop;
    exit when not exists (select 1 from public.profiles where hashtag = v_tag);
  end loop;

  insert into public.profiles (id, username, hashtag, credits, wins, losses, win_streak, onboarding_done)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    v_tag,
    100, 0, 0, 0, false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Row Level Security ────────────────────────────────────

alter table public.profiles            enable row level security;
alter table public.games               enable row level security;
alter table public.matches             enable row level security;
alter table public.messages            enable row level security;
alter table public.transactions        enable row level security;
alter table public.withdrawal_requests enable row level security;

-- Profiles
drop policy if exists "profiles_select"        on public.profiles;
drop policy if exists "profiles_insert"        on public.profiles;
drop policy if exists "profiles_update"        on public.profiles;
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

-- Games (public read, admin write)
drop policy if exists "games_select"        on public.games;
drop policy if exists "games_admin_insert"  on public.games;
drop policy if exists "games_admin_update"  on public.games;
create policy "games_select" on public.games for select using (true);
create policy "games_admin_insert" on public.games for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "games_admin_update" on public.games for update using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- Matches
drop policy if exists "matches_select"        on public.matches;
drop policy if exists "matches_admin_select"  on public.matches;
drop policy if exists "matches_insert"        on public.matches;
drop policy if exists "matches_update"        on public.matches;
create policy "matches_select" on public.matches for select using (
  auth.uid() = challenger_id or auth.uid() = opponent_id
);
create policy "matches_admin_select" on public.matches for select using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "matches_insert" on public.matches for insert with check (auth.uid() = challenger_id);
create policy "matches_update" on public.matches for update using (
  auth.uid() = challenger_id or auth.uid() = opponent_id
);

-- Messages
drop policy if exists "messages_select" on public.messages;
drop policy if exists "messages_insert" on public.messages;
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

-- Transactions
drop policy if exists "transactions_select"         on public.transactions;
drop policy if exists "transactions_admin_select"   on public.transactions;
drop policy if exists "transactions_insert"         on public.transactions;
create policy "transactions_select" on public.transactions for select using (auth.uid() = user_id);
create policy "transactions_admin_select" on public.transactions for select using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "transactions_insert" on public.transactions for insert with check (auth.uid() = user_id);

-- Withdrawal requests
drop policy if exists "withdrawals_select"        on public.withdrawal_requests;
drop policy if exists "withdrawals_admin_select"  on public.withdrawal_requests;
drop policy if exists "withdrawals_insert"        on public.withdrawal_requests;
drop policy if exists "withdrawals_admin_update"  on public.withdrawal_requests;
create policy "withdrawals_select" on public.withdrawal_requests for select using (auth.uid() = user_id);
create policy "withdrawals_admin_select" on public.withdrawal_requests for select using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "withdrawals_insert" on public.withdrawal_requests for insert with check (auth.uid() = user_id);
create policy "withdrawals_admin_update" on public.withdrawal_requests for update using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- ── Conversations & Chat ─────────────────────────────────
create table if not exists public.conversations (
  id               uuid primary key default gen_random_uuid(),
  user1_id         uuid references public.profiles(id) on delete cascade not null,
  user2_id         uuid references public.profiles(id) on delete cascade not null,
  last_message_at  timestamptz default now(),
  created_at       timestamptz default now() not null
);

-- Ensures only one conversation per pair (smaller UUID first)
create unique index if not exists conversations_pair_idx
  on public.conversations (
    least(user1_id::text, user2_id::text),
    greatest(user1_id::text, user2_id::text)
  );

create table if not exists public.chat_messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid references public.conversations(id) on delete cascade not null,
  sender_id        uuid references public.profiles(id) on delete cascade not null,
  content          text not null,
  type             text default 'text' check (type in ('text', 'duel_proposal')),
  metadata         jsonb,
  read_at          timestamptz,
  created_at       timestamptz default now() not null
);

-- RLS for conversations
alter table public.conversations enable row level security;
drop policy if exists "conv_select" on public.conversations;
drop policy if exists "conv_insert" on public.conversations;
create policy "conv_select" on public.conversations for select using (
  auth.uid() = user1_id or auth.uid() = user2_id
);
create policy "conv_insert" on public.conversations for insert with check (
  auth.uid() = user1_id or auth.uid() = user2_id
);

-- RLS for chat_messages
alter table public.chat_messages enable row level security;
drop policy if exists "chatmsg_select" on public.chat_messages;
drop policy if exists "chatmsg_insert" on public.chat_messages;
drop policy if exists "chatmsg_update" on public.chat_messages;
create policy "chatmsg_select" on public.chat_messages for select using (
  exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (c.user1_id = auth.uid() or c.user2_id = auth.uid())
  )
);
create policy "chatmsg_insert" on public.chat_messages for insert with check (
  auth.uid() = sender_id and
  exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (c.user1_id = auth.uid() or c.user2_id = auth.uid())
  )
);
create policy "chatmsg_update" on public.chat_messages for update using (
  exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (c.user1_id = auth.uid() or c.user2_id = auth.uid())
  )
);

-- ── Migration : ajoute onboarding_done si la table existe déjà ───
alter table public.profiles add column if not exists onboarding_done boolean not null default false;

-- ── Realtime ──────────────────────────────────────────────
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.conversations;

-- ── Pour te donner les droits admin ───────────────────────
-- Remplace TONHASHTAG par ton hashtag (sans le #) et exécute :
-- update public.profiles set is_admin = true where hashtag = 'TONHASHTAG';

-- ── Supabase Storage ──────────────────────────────────────
-- Crée un bucket public nommé "game-images" dans :
-- Supabase > Storage > New bucket > Name: game-images > Public: ON
