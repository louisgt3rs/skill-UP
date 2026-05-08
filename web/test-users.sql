-- =============================================
-- SkillUp — Joueurs de test pour le chat & duels
-- Colle ce SQL dans : Supabase > SQL Editor > New Query
-- =============================================

-- Étape 1 : créer les comptes auth (nécessaire pour la FK)
INSERT INTO auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES
  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'authenticated', 'authenticated',
    'progamer@test.skillup',
    crypt('Test1234!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"ProGamer"}',
    false, '', '', '', ''
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000002',
    'authenticated', 'authenticated',
    'nightwolf@test.skillup',
    crypt('Test1234!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"NightWolf"}',
    false, '', '', '', ''
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000003',
    'authenticated', 'authenticated',
    'skillking@test.skillup',
    crypt('Test1234!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"SkillKing"}',
    false, '', '', '', ''
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000004',
    'authenticated', 'authenticated',
    'brawlmaster@test.skillup',
    crypt('Test1234!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"BrawlMaster"}',
    false, '', '', '', ''
  )
ON CONFLICT (id) DO NOTHING;

-- Étape 2 : créer les profils SkillUp
INSERT INTO public.profiles (
  id, username, hashtag, credits, wins, losses, win_streak, onboarding_done
) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'ProGamer',    'PRO01', 1500, 24,  6, 7, true),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'NightWolf',   'WOLF2',  800,  8, 14, 0, true),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'SkillKing',   'SKL99', 3200, 41,  9, 5, true),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'BrawlMaster', 'BRAW4',  450,  3, 22, 1, true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- Hashtags pour chercher ces joueurs dans le chat :
--   #PRO01  → ProGamer    (1500 cr, 24 wins)
--   #WOLF2  → NightWolf   (800 cr,  8 wins)
--   #SKL99  → SkillKing   (3200 cr, 41 wins)
--   #BRAW4  → BrawlMaster (450 cr,  3 wins)
-- =============================================
