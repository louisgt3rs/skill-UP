-- =============================================
-- SkillUp — Support des images dans le chat
-- Colle dans Supabase > SQL Editor
-- =============================================

-- Supprime la contrainte existante sur 'type' (peu importe son nom auto-généré)
DO $$
DECLARE
  v_constraint text;
BEGIN
  SELECT conname INTO v_constraint
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE t.relname = 'chat_messages'
    AND n.nspname = 'public'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) LIKE '%duel_proposal%';

  IF v_constraint IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.chat_messages DROP CONSTRAINT ' || quote_ident(v_constraint);
    RAISE NOTICE 'Contrainte supprimée : %', v_constraint;
  ELSE
    RAISE NOTICE 'Aucune contrainte à supprimer';
  END IF;
END $$;

-- Recrée la contrainte avec le type 'image' en plus
ALTER TABLE public.chat_messages
  ADD CONSTRAINT chat_messages_type_check
  CHECK (type IN ('text', 'duel_proposal', 'image'));

-- !! Créer aussi le bucket Storage "chat-images" (public) dans :
-- Supabase > Storage > New bucket > Name: chat-images > Public: ON
