-- =============================================
-- SkillUp — Schéma des litiges et preuves
-- Colle ce SQL dans : Supabase > SQL Editor > New Query
-- =============================================

-- Lien conversation ↔ match (pour le mode duel dans le chat)
alter table public.matches add column if not exists conversation_id uuid references public.conversations(id);

-- ── Preuves de match (screenshots) ───────────────────────
create table if not exists public.match_proofs (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid references public.matches(id) on delete cascade not null,
  user_id    uuid references public.profiles(id) not null,
  proof_url  text not null,
  created_at timestamptz default now()
);

alter table public.match_proofs enable row level security;

drop policy if exists "proofs_select" on public.match_proofs;
drop policy if exists "proofs_insert" on public.match_proofs;

create policy "proofs_select" on public.match_proofs for select using (
  exists (
    select 1 from public.matches m
    where m.id = match_id
      and (m.challenger_id = auth.uid() or m.opponent_id = auth.uid())
  )
  or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

create policy "proofs_insert" on public.match_proofs for insert with check (
  auth.uid() = user_id and
  exists (
    select 1 from public.matches m
    where m.id = match_id
      and (m.challenger_id = auth.uid() or m.opponent_id = auth.uid())
  )
);

-- Admin peut résoudre les litiges (update match)
drop policy if exists "matches_admin_update" on public.matches;
create policy "matches_admin_update" on public.matches for update using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- Admin peut lire toutes les conversations et messages (examen des litiges)
drop policy if exists "conv_admin_select" on public.conversations;
create policy "conv_admin_select" on public.conversations for select using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

drop policy if exists "chatmsg_admin_select" on public.chat_messages;
create policy "chatmsg_admin_select" on public.chat_messages for select using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- Realtime pour les preuves (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'match_proofs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.match_proofs;
  END IF;
END $$;

-- !! Créer aussi le bucket Storage "match-proofs" (public) dans :
-- Supabase > Storage > New bucket > Name: match-proofs > Public: ON
