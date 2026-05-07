import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { Profile } from '../types';
import { ensureProfile, getProfile } from '../lib/db';

export function useProfile(session: Session | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) { setProfile(null); setLoading(false); return; }

    const username =
      session.user.user_metadata?.username ||
      session.user.email?.split('@')[0] ||
      'Player';

    ensureProfile(session.user.id, username)
      .then(setProfile)
      .catch(() => getProfile(session.user.id).then(setProfile))
      .finally(() => setLoading(false));
  }, [session?.user.id]);

  const refresh = () => {
    if (!session) return;
    getProfile(session.user.id).then(setProfile);
  };

  return { profile, loading, refresh };
}
