-- =============================================
-- SkillUp — Joueurs de test pour le chat & duels
-- Colle ce SQL dans : Supabase > SQL Editor > New Query
-- =============================================

-- Étape 1 : créer les comptes auth (nécessaire pour la FK)
INSERT INTO auth.users (
  id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, confirmation_token, email_change,
  email_change_token_new, recovery_token
) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001','authenticated','authenticated',
   'progamer@test.skillup', crypt('Test1234!', gen_salt('bf')),
   NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}','{"username":"ProGamer"}',
   false,'','','',''),
  ('aaaaaaaa-0000-0000-0000-000000000002','authenticated','authenticated',
   'nightwolf@test.skillup', crypt('Test1234!', gen_salt('bf')),
   NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}','{"username":"NightWolf"}',
   false,'','','',''),
  ('aaaaaaaa-0000-0000-0000-000000000003','authenticated','authenticated',
   'skillking@test.skillup', crypt('Test1234!', gen_salt('bf')),
   NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}','{"username":"SkillKing"}',
   false,'','','',''),
  ('aaaaaaaa-0000-0000-0000-000000000004','authenticated','authenticated',
   'brawlmaster@test.skillup', crypt('Test1234!', gen_salt('bf')),
   NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}','{"username":"BrawlMaster"}',
   false,'','','','')
ON CONFLICT (id) DO NOTHING;

-- Étape 2 : créer les profils SkillUp
INSERT INTO public.profiles (id, username, hashtag, credits, wins, losses, win_streak, onboarding_done)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001','ProGamer',   'PRO01',1500,24, 6,7,true),
  ('aaaaaaaa-0000-0000-0000-000000000002','NightWolf',  'WOLF2', 800, 8,14,0,true),
  ('aaaaaaaa-0000-0000-0000-000000000003','SkillKing',  'SKL99',3200,41, 9,5,true),
  ('aaaaaaaa-0000-0000-0000-000000000004','BrawlMaster','BRAW4', 450, 3,22,1,true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- Étape 3 : conversations + messages de test
-- !! Remplace TONHASHTAG par ton hashtag (sans le #) !!
-- =============================================
DO $$
DECLARE
  v_me UUID;
  v_p1 UUID := 'aaaaaaaa-0000-0000-0000-000000000001';
  v_p2 UUID := 'aaaaaaaa-0000-0000-0000-000000000002';
  v_p3 UUID := 'aaaaaaaa-0000-0000-0000-000000000003';
  v_p4 UUID := 'aaaaaaaa-0000-0000-0000-000000000004';
  v_c1 UUID; v_c2 UUID; v_c3 UUID; v_c4 UUID;
BEGIN
  SELECT id INTO v_me FROM public.profiles WHERE hashtag = 'BOSS1';
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Hashtag BOSS1 introuvable';
  END IF;

  -- Conversations (user1_id < user2_id en comparaison texte pour unicité)
  INSERT INTO public.conversations (user1_id, user2_id, last_message_at) VALUES
    (least(v_me::text, v_p1::text)::UUID, greatest(v_me::text, v_p1::text)::UUID, NOW() - interval '2 minutes'),
    (least(v_me::text, v_p2::text)::UUID, greatest(v_me::text, v_p2::text)::UUID, NOW() - interval '1 hour'),
    (least(v_me::text, v_p3::text)::UUID, greatest(v_me::text, v_p3::text)::UUID, NOW() - interval '3 hours'),
    (least(v_me::text, v_p4::text)::UUID, greatest(v_me::text, v_p4::text)::UUID, NOW() - interval '1 day')
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_c1 FROM public.conversations WHERE
    user1_id = least(v_me::text, v_p1::text)::UUID AND user2_id = greatest(v_me::text, v_p1::text)::UUID;
  SELECT id INTO v_c2 FROM public.conversations WHERE
    user1_id = least(v_me::text, v_p2::text)::UUID AND user2_id = greatest(v_me::text, v_p2::text)::UUID;
  SELECT id INTO v_c3 FROM public.conversations WHERE
    user1_id = least(v_me::text, v_p3::text)::UUID AND user2_id = greatest(v_me::text, v_p3::text)::UUID;
  SELECT id INTO v_c4 FROM public.conversations WHERE
    user1_id = least(v_me::text, v_p4::text)::UUID AND user2_id = greatest(v_me::text, v_p4::text)::UUID;

  -- Conv 1 : ProGamer (active, en attente d'un duel)
  INSERT INTO public.chat_messages (conversation_id, sender_id, content, type, created_at) VALUES
    (v_c1, v_p1, 'Yo, t''es là ? On fait un duel Brawl Stars ?', 'text', NOW() - interval '5 minutes'),
    (v_c1, v_me, 'Ouais, je suis dispo ! Quelle mise ?',          'text', NOW() - interval '4 minutes'),
    (v_c1, v_p1, 'On part sur 100 crédits, ça te va ?',           'text', NOW() - interval '3 minutes'),
    (v_c1, v_me, 'C''est bon pour moi, envoie la proposition !',  'text', NOW() - interval '2 minutes');

  -- Conv 2 : NightWolf
  INSERT INTO public.chat_messages (conversation_id, sender_id, content, type, created_at) VALUES
    (v_c2, v_p2, 'GG la dernière partie, t''étais chaud 🔥',       'text', NOW() - interval '2 hours'),
    (v_c2, v_me, 'Merci ! On remet ça bientôt ?',                  'text', NOW() - interval '1 hour 50 minutes'),
    (v_c2, v_p2, 'Avec plaisir, je te challenge cette semaine 👊', 'text', NOW() - interval '1 hour');

  -- Conv 3 : SkillKing
  INSERT INTO public.chat_messages (conversation_id, sender_id, content, type, created_at) VALUES
    (v_c3, v_p3, 'Salut ! Tu joues à Brawl Stars ?',               'text', NOW() - interval '4 hours'),
    (v_c3, v_me, 'Ouais souvent. T''es comment niveau ?',          'text', NOW() - interval '3 hours 30 minutes'),
    (v_c3, v_p3, '41 wins ici, prêt à défier n''importe qui 😎',   'text', NOW() - interval '3 hours');

  -- Conv 4 : BrawlMaster
  INSERT INTO public.chat_messages (conversation_id, sender_id, content, type, created_at) VALUES
    (v_c4, v_me, 'Bienvenue sur SkillUp !',                         'text', NOW() - interval '2 days'),
    (v_c4, v_p4, 'Merci, je suis encore nouveau ici 🙏',            'text', NOW() - interval '1 day 23 hours'),
    (v_c4, v_me, 'On se fait un match quand tu veux',               'text', NOW() - interval '1 day');

END $$;

-- =============================================
-- Résumé des hashtags :
--   #PRO01  → ProGamer    (1 500 cr · 24 wins) — conv active
--   #WOLF2  → NightWolf   (  800 cr ·  8 wins)
--   #SKL99  → SkillKing   (3 200 cr · 41 wins)
--   #BRAW4  → BrawlMaster (  450 cr ·  3 wins)
-- =============================================
