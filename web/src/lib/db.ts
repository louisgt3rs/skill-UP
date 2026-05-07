import { supabase } from './supabase';
import { Profile, Match, Message } from '../types';

function genHashtag(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let tag = '';
  for (let i = 0; i < 6; i++) tag += chars[Math.floor(Math.random() * chars.length)];
  return tag;
}

// ── Profiles ──────────────────────────────────────────────

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

export async function ensureProfile(userId: string, username: string): Promise<Profile> {
  const existing = await getProfile(userId);
  if (existing) return existing;

  for (let i = 0; i < 5; i++) {
    const { data, error } = await supabase
      .from('profiles')
      .insert({ id: userId, username, hashtag: genHashtag(), credits: 1000 })
      .select()
      .single();
    if (!error && data) return data;
  }
  throw new Error('Impossible de créer le profil');
}

export async function findByHashtag(hashtag: string): Promise<Profile | null> {
  const clean = hashtag.replace(/^#/, '').toUpperCase();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('hashtag', clean)
    .single();
  return data;
}

export async function updateCredits(userId: string, delta: number): Promise<void> {
  const profile = await getProfile(userId);
  if (!profile) return;
  await supabase
    .from('profiles')
    .update({ credits: profile.credits + delta })
    .eq('id', userId);
}

// ── Matches ───────────────────────────────────────────────

export async function createMatch(
  challengerId: string,
  opponentId: string,
  game: string,
  wager: number
): Promise<Match> {
  const { data, error } = await supabase
    .from('matches')
    .insert({ game, challenger_id: challengerId, opponent_id: opponentId, wager, status: 'pending' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getMatch(matchId: string): Promise<Match | null> {
  const { data } = await supabase
    .from('matches')
    .select('*, challenger:profiles!challenger_id(*), opponent:profiles!opponent_id(*)')
    .eq('id', matchId)
    .single();
  return data;
}

export async function getMyMatches(userId: string): Promise<Match[]> {
  const { data } = await supabase
    .from('matches')
    .select('*, challenger:profiles!challenger_id(*), opponent:profiles!opponent_id(*)')
    .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
    .order('created_at', { ascending: false });
  return data || [];
}

export async function acceptMatch(match: Match): Promise<void> {
  // Deduct wager from both players
  await updateCredits(match.challenger_id, -match.wager);
  await updateCredits(match.opponent_id, -match.wager);
  await supabase.from('matches').update({ status: 'active' }).eq('id', match.id);
}

export async function declineMatch(matchId: string): Promise<void> {
  await supabase.from('matches').update({ status: 'completed' }).eq('id', matchId);
}

export async function submitResult(
  match: Match,
  userId: string,
  result: 'win' | 'loss'
): Promise<void> {
  const isChallenger = userId === match.challenger_id;
  const field = isChallenger ? 'challenger_result' : 'opponent_result';
  const otherResult = isChallenger ? match.opponent_result : match.challenger_result;

  const updates: Record<string, unknown> = { [field]: result };

  // Both submitted — resolve
  if (otherResult) {
    const iWin = result === 'win';
    const theyWin = otherResult === 'win';

    if (iWin && !theyWin) {
      // I win, they say loss → clean win
      updates.status = 'completed';
      updates.winner_id = userId;
      await updateCredits(userId, match.wager * 2);
    } else if (!iWin && theyWin) {
      // I lose, they say win → clean win for them
      const winnerId = isChallenger ? match.opponent_id : match.challenger_id;
      updates.status = 'completed';
      updates.winner_id = winnerId;
      await updateCredits(winnerId, match.wager * 2);
    } else {
      // Both claim win or both claim loss → dispute
      updates.status = 'disputed';
    }
  } else {
    updates.status = 'finished';
  }

  await supabase.from('matches').update(updates).eq('id', match.id);
}

// ── Messages ──────────────────────────────────────────────

export async function getMessages(matchId: string): Promise<Message[]> {
  const { data } = await supabase
    .from('messages')
    .select('*, sender:profiles!sender_id(*)')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true });
  return data || [];
}

export async function sendMessage(
  matchId: string,
  senderId: string,
  content: string
): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .insert({ match_id: matchId, sender_id: senderId, content });
  if (error) throw error;
}
