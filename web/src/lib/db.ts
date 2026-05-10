import { supabase } from './supabase';
import { Profile, Match, MatchProof, Message, Transaction, WithdrawalRequest, GameDef, GAMES, Conversation, ChatMessage } from '../types';

function genHashtag(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let tag = '';
  for (let i = 0; i < 5; i++) tag += chars[Math.floor(Math.random() * chars.length)];
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

export async function isHashtagAvailable(hashtag: string, excludeUserId?: string): Promise<boolean> {
  const clean = hashtag.toUpperCase();
  let query = supabase.from('profiles').select('id').eq('hashtag', clean);
  if (excludeUserId) query = query.neq('id', excludeUserId);
  const { data } = await query.maybeSingle();
  return !data;
}

export async function completeOnboarding(userId: string, hashtag: string, username: string): Promise<void> {
  const clean = hashtag.toUpperCase();
  await supabase.from('profiles').update({ hashtag: clean, username, onboarding_done: true }).eq('id', userId);
}

export async function updateHashtag(userId: string, hashtag: string): Promise<void> {
  const clean = hashtag.toUpperCase();
  const { error } = await supabase
    .from('profiles')
    .update({ hashtag: clean })
    .eq('id', userId);
  if (error) throw error;
}

export async function updateCredits(userId: string, delta: number): Promise<void> {
  const profile = await getProfile(userId);
  if (!profile) return;
  await supabase.from('profiles').update({ credits: Math.max(0, profile.credits + delta) }).eq('id', userId);
}

// ── Matches ───────────────────────────────────────────────

export async function createMatch(
  challengerId: string, opponentId: string, game: string, wager: number, conversationId?: string
): Promise<Match> {
  const { data, error } = await supabase
    .from('matches')
    .insert({
      game, challenger_id: challengerId, opponent_id: opponentId, wager, status: 'pending',
      ...(conversationId ? { conversation_id: conversationId } : {}),
    })
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
      await updateMatchStats(winnerId, loserId);
    } else if (!iWin && theyWin) {
      const winnerId = isChallenger ? match.opponent_id : match.challenger_id;
      const loserId = userId;
      updates.status = 'completed';
      updates.winner_id = winnerId;
      await updateCredits(winnerId, match.wager * 2);
      await addTransaction(winnerId, 'match_win', match.wager * 2, `Victoire — ${match.game}`);
      await addTransaction(loserId, 'match_loss', 0, `Défaite — ${match.game}`);
      await updateMatchStats(winnerId, loserId);
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

// ── Games (admin-managed) ─────────────────────────────────

export async function getGames(): Promise<GameDef[]> {
  const { data, error } = await supabase
    .from('games').select('*').order('sort_order', { ascending: true });
  if (error || !data || data.length === 0) return GAMES;
  return data;
}

export async function getGameBySlug(slug: string): Promise<GameDef | null> {
  const { data } = await supabase.from('games').select('*').eq('slug', slug).single();
  if (!data) return GAMES.find(g => g.slug === slug) ?? null;
  return data;
}

export async function updateGame(gameId: string, updates: Partial<GameDef>): Promise<void> {
  const { id: _id, ...rest } = updates as GameDef;
  await supabase.from('games').update({ ...rest, updated_at: new Date().toISOString() }).eq('id', gameId);
}

export async function uploadGameImage(slug: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${slug}.${ext}`;
  await supabase.storage.from('game-images').upload(path, file, { upsert: true });
  const { data } = supabase.storage.from('game-images').getPublicUrl(path);
  return data.publicUrl;
}

// ── Admin ─────────────────────────────────────────────────

export async function getAdminStats(): Promise<{ totalUsers: number; activeMatches: number; pendingWithdrawals: number }> {
  const [usersRes, matchesRes, withdrawalsRes] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('matches').select('id', { count: 'exact', head: true }).in('status', ['active', 'finished']),
    supabase.from('withdrawal_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);
  return {
    totalUsers: usersRes.count ?? 0,
    activeMatches: matchesRes.count ?? 0,
    pendingWithdrawals: withdrawalsRes.count ?? 0,
  };
}

export async function getAllWithdrawalRequests(): Promise<(WithdrawalRequest & { profile?: Profile })[]> {
  const { data } = await supabase
    .from('withdrawal_requests')
    .select('*, profile:profiles(*)')
    .order('created_at', { ascending: false })
    .limit(100);
  return data ?? [];
}

export async function updateWithdrawalStatus(
  id: string, status: 'approved' | 'rejected', note?: string
): Promise<void> {
  await supabase.from('withdrawal_requests').update({ status, admin_note: note ?? null }).eq('id', id);
}

// ── Chat ──────────────────────────────────────────────────

export async function getOrCreateConversation(userId: string, otherId: string): Promise<string> {
  const [u1, u2] = [userId, otherId].sort();
  const { data: existing } = await supabase
    .from('conversations').select('id').eq('user1_id', u1).eq('user2_id', u2).maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await supabase
    .from('conversations').insert({ user1_id: u1, user2_id: u2 }).select('id').single();
  if (error) throw error;
  return data.id;
}

export async function getMyConversations(userId: string): Promise<Conversation[]> {
  const { data } = await supabase
    .from('conversations')
    .select(`
      *,
      user1:profiles!user1_id(*),
      user2:profiles!user2_id(*)
    `)
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order('last_message_at', { ascending: false });

  if (!data) return [];
  return data.map((c: any) => ({
    ...c,
    other_user: c.user1_id === userId ? c.user2 : c.user1,
  }));
}

export async function getChatMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data } = await supabase
    .from('chat_messages')
    .select('*, sender:profiles!sender_id(*)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  return data || [];
}

export async function sendChatMessage(
  conversationId: string, senderId: string, content: string
): Promise<void> {
  const now = new Date().toISOString();
  await supabase.from('chat_messages').insert({
    conversation_id: conversationId, sender_id: senderId, content, type: 'text',
  });
  await supabase.from('conversations').update({ last_message_at: now }).eq('id', conversationId);
}

export async function uploadChatImage(
  conversationId: string, senderId: string, file: File
): Promise<void> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${conversationId}/${senderId}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('chat-images').upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('chat-images').getPublicUrl(path);
  const now = new Date().toISOString();
  await supabase.from('chat_messages').insert({
    conversation_id: conversationId, sender_id: senderId,
    content: data.publicUrl, type: 'image',
  });
  await supabase.from('conversations').update({ last_message_at: now }).eq('id', conversationId);
}

export async function sendDuelProposal(
  conversationId: string, senderId: string, game: string, wager: number
): Promise<void> {
  const now = new Date().toISOString();
  await supabase.from('chat_messages').insert({
    conversation_id: conversationId,
    sender_id: senderId,
    content: `Proposition de duel — ${game} — ${wager} cr`,
    type: 'duel_proposal',
    metadata: { game, wager, status: 'pending' },
  });
  await supabase.from('conversations').update({ last_message_at: now }).eq('id', conversationId);
}

export async function updateDuelProposalStatus(
  messageId: string,
  status: 'accepted' | 'declined',
  matchId?: string
): Promise<void> {
  const current = await supabase
    .from('chat_messages').select('metadata').eq('id', messageId).single();
  const meta = current.data?.metadata ?? {};
  await supabase.from('chat_messages').update({
    metadata: { ...meta, status, ...(matchId ? { match_id: matchId } : {}) },
  }).eq('id', messageId);
}

// ── Match (dispute flow) ──────────────────────────────────

async function updateMatchStats(winnerId: string, loserId: string): Promise<void> {
  const [w, l] = await Promise.all([getProfile(winnerId), getProfile(loserId)]);
  await Promise.all([
    supabase.from('profiles').update({
      wins: (w?.wins ?? 0) + 1,
      win_streak: (w?.win_streak ?? 0) + 1,
    }).eq('id', winnerId),
    supabase.from('profiles').update({
      losses: (l?.losses ?? 0) + 1,
      win_streak: 0,
    }).eq('id', loserId),
  ]);
}

export async function getActiveMatchForConversation(conversationId: string): Promise<Match | null> {
  const { data } = await supabase
    .from('matches')
    .select('*, challenger:profiles!challenger_id(*), opponent:profiles!opponent_id(*)')
    .eq('conversation_id', conversationId)
    .in('status', ['active', 'finished', 'disputed', 'completed'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function uploadMatchProof(matchId: string, userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'png';
  const path = `${matchId}/${userId}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('match-proofs').upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('match-proofs').getPublicUrl(path);
  await supabase.from('match_proofs').insert({ match_id: matchId, user_id: userId, proof_url: data.publicUrl });
  return data.publicUrl;
}

export async function getMatchProofs(matchId: string): Promise<MatchProof[]> {
  const { data } = await supabase
    .from('match_proofs')
    .select('*, uploader:profiles!user_id(*)')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true });
  return data || [];
}

export async function getDisputedMatches(): Promise<Match[]> {
  const { data } = await supabase
    .from('matches')
    .select('*, challenger:profiles!challenger_id(*), opponent:profiles!opponent_id(*)')
    .eq('status', 'disputed')
    .order('created_at', { ascending: false });
  return data || [];
}

export async function resolveDispute(
  match: Match,
  decision: string,
): Promise<void> {
  if (decision === 'refund') {
    await Promise.all([
      updateCredits(match.challenger_id, match.wager),
      updateCredits(match.opponent_id, match.wager),
      addTransaction(match.challenger_id, 'refund', match.wager, `Remboursement litige — ${match.game}`),
      addTransaction(match.opponent_id, 'refund', match.wager, `Remboursement litige — ${match.game}`),
    ]);
    await supabase.from('matches').update({ status: 'completed', winner_id: null }).eq('id', match.id);
  } else {
    const winnerId = decision;
    const loserId = winnerId === match.challenger_id ? match.opponent_id : match.challenger_id;
    await updateCredits(winnerId, match.wager * 2);
    await Promise.all([
      addTransaction(winnerId, 'match_win', match.wager * 2, `Victoire (litige) — ${match.game}`),
      addTransaction(loserId, 'match_loss', 0, `Défaite (litige) — ${match.game}`),
    ]);
    await updateMatchStats(winnerId, loserId);
    await supabase.from('matches').update({ status: 'completed', winner_id: winnerId }).eq('id', match.id);
  }
}
