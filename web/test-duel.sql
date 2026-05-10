-- =============================================
-- SkillUp — Simulation d'un duel actif en chat
-- Lance ça dans Supabase > SQL Editor
-- =============================================

DO $$
DECLARE
  v_me   UUID;
  v_pro  UUID := 'aaaaaaaa-0000-0000-0000-000000000001'; -- ProGamer #PRO01
  v_conv UUID;
  v_match UUID;
BEGIN
  -- Récupère ton profil
  SELECT id INTO v_me FROM public.profiles WHERE hashtag = 'BOSS1';
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Profil BOSS1 introuvable';
  END IF;

  -- Récupère la conversation avec ProGamer
  SELECT id INTO v_conv FROM public.conversations WHERE
    user1_id = least(v_me::text, v_pro::text)::UUID
    AND user2_id = greatest(v_me::text, v_pro::text)::UUID;
  IF v_conv IS NULL THEN
    RAISE EXCEPTION 'Conversation avec ProGamer introuvable — lance test-users.sql d abord';
  END IF;

  -- Crée le match actif lié à la conversation
  INSERT INTO public.matches (
    game, challenger_id, opponent_id, wager, status, conversation_id
  ) VALUES (
    'Brawl Stars', v_pro, v_me, 200, 'active', v_conv
  ) RETURNING id INTO v_match;

  -- Ajoute le message de proposition acceptée dans le chat
  INSERT INTO public.chat_messages (
    conversation_id, sender_id, content, type, metadata, created_at
  ) VALUES (
    v_conv, v_pro,
    'Proposition de duel — Brawl Stars — 200 cr',
    'duel_proposal',
    jsonb_build_object(
      'game', 'Brawl Stars',
      'wager', 200,
      'status', 'accepted',
      'match_id', v_match::text
    ),
    NOW() - interval '30 seconds'
  );

  RAISE NOTICE 'Match créé : % | Conv : %', v_match, v_conv;
END $$;
