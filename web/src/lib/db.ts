import { supabase } from './supabase';
import { Profile, Match, Message, Transaction, WithdrawalRequest } from '../types';

function genHashtag(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let tag = '';
  for (let i = 0; i < 6; i++) tag += chars[Math.floor(Math.random() * chars.length)];
  return tag;
}

// ── Profiles ──────────────────────────────────────────────

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
  return data;
}

export async function ensureProfile(userId: string, username: string): Promise<Profile> {
  const existing = await getProfile(userId);
  if (existing) return existing;
  for (let i = 0; i < 5; i++) {
    const { data, error } = await supabase
      .from('profiles')
      .insert({ id: userId, username, hashtag: genHashtag(), credits: 100, wins: 0, losses: 0, win_streak: 0 })
      .select().single();
    if (!error && data) return data;
  }
  throw new Error('Impossible de créer le profil');
}

export async function findByHashtag(hashtag: string): Promise<Profile | null> {
  const clean = hashtag.replace(/^#/, '').toUpperCase();
  const { data } = await supabase.from('profiles').select('*').eq('hashtag', clean).single();
  return data;
}

export async function updateCredits(userId: string, delta: number): Promise<void> {
  const profile = await getProfile(userId);
  if (!profile) return;
  await supabase.from('profiles').update({ credits: Math.max(0, profile.credits + delta) }).eq('id', userId);
}

// ── Matches ───────────────────────────────────────────────

export async function createMatch(
  challengerId: string, opponentId: string, game: string, wager: number
): Promise<Match> {
  const { data, error } = await supabase
    .from('matches')
    .insert({ game, challenger_id: challengerId, opponent_id: opponentId, wager, status: 'pending' })
    .select().single();
  if (error) throw error;
  return data;
}

export async function getMatch(matchId: string): Promise<Match | null> {
  const { data } = await supabase
    .from('matches')
    .select('*, challenger:profiles!challenger_id(*), opponent:profiles!opponent_id(*)')
    .eq('id', matchId).single();
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
  await updateCredits(match.challenger_id, -match.wager);
  await updateCredits(match.opponent_id, -match.wager);
  await supabase.from('matches').update({ status: 'active' }).eq('id', match.id);
  await addTransaction(match.challenger_id, 'match_wager', -match.wager, `Mise bloquée — ${match.game}`);
  await addTransaction(match.opponent_id, 'match_wager', -match.wager, `Mise bloquée — ${match.game}`);
}

export async function declineMatch(matchId: string): Promise<void> {
  await supabase.from('matches').update({ status: 'completed' }).eq('id', matchId);
}

export async function submitResult(match: Match, userId: string, result: 'win' | 'loss'): Promise<void> {
  const isChallenger = userId === match.challenger_id;
  const field = isChallenger ? 'challenger_result' : 'opponent_result';
  const otherResult = isChallenger ? match.opponent_result : match.challenger_result;
  const updates: Record<string, unknown> = { [field]: result };

  if (otherResult) {
    const iWin = result === 'win';
    const theyWin = otherResult === 'win';
    if (iWin && !theyWin) {
      const winnerId = userId;
      const loserId = isChallenger ? match.opponent_id : match.challenger_id;
      updates.status = 'completed';
      updates.winner_id = winnerId;
      await updateCredits(winnerId, match.wager * 2);
      await addTransaction(winnerId, 'match_win', match.wager * 2, `Victoire — ${match.game}`);
      await addTransaction(loserId, 'match_loss', 0, `Défaite — ${match.game}`);
    } else if (!iWin && theyWin) {
      const winnerId = isChallenger ? match.opponent_id : match.challenger_id;
      updates.status = 'completed';
      updates.winner_id = winnerId;
      await updateCredits(winnerId, match.wager * 2);
      await addTransaction(winnerId, 'match_win', match.wager * 2, `Victoire — ${match.game}`);
      await addTransaction(userId, 'match_loss', 0, `Défaite — ${match.game}`);
    } else {
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

export async function sendMessage(matchId: string, senderId: string, content: string): Promise<void> {
  const { error } = await supabase.from('messages').insert({ match_id: matchId, sender_id: senderId, content });
  if (error) throw error;
}

// ── Transactions ──────────────────────────────────────────

export async function addTransaction(
  userId: string,
  type: Transaction['type'],
  amount: number,
  description: string,
  status: Transaction['status'] = 'completed'
): Promise<void> {
  await supabase.from('transactions').insert({ user_id: userId, type, amount, description, status });
}

export async function getTransactions(userId: string): Promise<Transaction[]> {
  const { data } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  return data || [];
}

// ── Withdrawal ────────────────────────────────────────────

export async function requestWithdrawal(
  userId: string,
  amountCredits: number,
  fullName: string,
  iban: string,
  method: string = 'bank_transfer'
): Promise<void> {
  const profile = await getProfile(userId);
  if (!profile || profile.credits < amountCredits) throw new Error('Crédits insuffisants');
  const amountEur = amountCredits / 100;

  await updateCredits(userId, -amountCredits);
  await supabase.from('withdrawal_requests').insert({
    user_id: userId,
    amount_credits: amountCredits,
    amount_eur: amountEur,
    full_name: fullName,
    iban,
    method,
    status: 'pending',
  });
  await addTransaction(userId, 'withdrawal', -amountCredits, `Demande de retrait — ${amountEur.toFixed(2)} €`, 'pending');
}

export async function getWithdrawalRequests(userId: string): Promise<WithdrawalRequest[]> {
  const { data } = await supabase
    .from('withdrawal_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return data || [];
}

// ── Discord ───────────────────────────────────────────────

export async function linkDiscord(
  userId: string,
  discordId: string,
  discordUsername: string,
  discordAvatar: string | null
): Promise<void> {
  await supabase.from('profiles').update({
    discord_id: discordId,
    discord_username: discordUsername,
    discord_avatar: discordAvatar,
    discord_linked_at: new Date().toISOString(),
  }).eq('id', userId);
}

export async function unlinkDiscord(userId: string): Promise<void> {
  await supabase.from('profiles').update({
    discord_id: null, discord_username: null,
    discord_avatar: null, discord_linked_at: null,
  }).eq('id', userId);
}
