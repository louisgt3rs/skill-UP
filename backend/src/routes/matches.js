const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { supabase } = require('../utils/supabase');
const { getMaxPlayers, getPlayersPerTeam } = require('../utils/matchLogic');

const router = express.Router();

// GET /api/matches
router.get('/', async (req, res) => {
  let q = supabase
    .from('matches')
    .select(`
      *,
      creator:users!creator_id(id, username, avatar_url, reputation),
      match_participants(user_id, team, users(id, username, avatar_url))
    `)
    .order('created_at', { ascending: false });

  if (req.query.status) q = q.eq('status', req.query.status);
  if (req.query.game) q = q.eq('game', req.query.game);
  if (req.query.format) q = q.eq('format', req.query.format);

  const { data, error } = await q.limit(50);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/matches/:id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      creator:users!creator_id(id, username, avatar_url, reputation),
      match_participants(user_id, team, result_submitted, claimed_result, joined_at,
        users(id, username, avatar_url, reputation)
      ),
      proofs(id, user_id, file_url, file_type, created_at),
      disputes(id, status, winner_team, admin_notes)
    `)
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Match not found' });
  res.json(data);
});

// POST /api/matches
router.post(
  '/',
  authMiddleware,
  [
    body('game').notEmpty().trim(),
    body('format').isIn(['1v1', '2v2', '3v3']),
    body('rules').optional().trim(),
    body('entry_cost').isInt({ min: 0 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { game, format, rules, entry_cost } = req.body;
    const maxPlayers = getMaxPlayers(format);

    // Check creator has enough credits
    if (entry_cost > 0) {
      const { data: user } = await supabase
        .from('users')
        .select('credits')
        .eq('id', req.userId)
        .single();

      if (!user || user.credits < entry_cost) {
        return res.status(400).json({ error: 'Insufficient credits' });
      }
    }

    // Create match
    const { data: match, error: matchErr } = await supabase
      .from('matches')
      .insert({ game, format, rules, entry_cost, creator_id: req.userId, max_players: maxPlayers })
      .select()
      .single();

    if (matchErr) return res.status(500).json({ error: matchErr.message });

    // Creator joins team 1
    await supabase.from('match_participants').insert({
      match_id: match.id,
      user_id: req.userId,
      team: 1,
    });

    // Lock creator's credits
    if (entry_cost > 0) {
      await supabase.rpc('lock_match_credits', {
        p_user_id: req.userId,
        p_match_id: match.id,
        p_amount: entry_cost,
      });
    } else {
      await supabase
        .from('match_participants')
        .update({ credits_locked: true })
        .eq('match_id', match.id)
        .eq('user_id', req.userId);
    }

    res.status(201).json(match);
  }
);

// POST /api/matches/:id/join
router.post('/:id/join', authMiddleware, async (req, res) => {
  const { id: matchId } = req.params;
  const { team } = req.body;

  if (![1, 2].includes(team)) {
    return res.status(400).json({ error: 'Team must be 1 or 2' });
  }

  const { data: match } = await supabase
    .from('matches')
    .select('*, match_participants(user_id, team)')
    .eq('id', matchId)
    .single();

  if (!match) return res.status(404).json({ error: 'Match not found' });
  if (match.status !== 'pending') return res.status(400).json({ error: 'Match is not open for joining' });

  // Already joined?
  const alreadyJoined = match.match_participants.some(p => p.user_id === req.userId);
  if (alreadyJoined) return res.status(400).json({ error: 'Already joined this match' });

  // Check team capacity
  const perTeam = getPlayersPerTeam(match.format);
  const teamCount = match.match_participants.filter(p => p.team === team).length;
  if (teamCount >= perTeam) return res.status(400).json({ error: `Team ${team} is full` });

  // Check credits
  if (match.entry_cost > 0) {
    const { data: user } = await supabase
      .from('users')
      .select('credits')
      .eq('id', req.userId)
      .single();

    if (!user || user.credits < match.entry_cost) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }
  }

  // Join match
  const { error: joinErr } = await supabase.from('match_participants').insert({
    match_id: matchId,
    user_id: req.userId,
    team,
  });
  if (joinErr) return res.status(500).json({ error: joinErr.message });

  // Lock credits
  if (match.entry_cost > 0) {
    await supabase.rpc('lock_match_credits', {
      p_user_id: req.userId,
      p_match_id: matchId,
      p_amount: match.entry_cost,
    });
  } else {
    await supabase
      .from('match_participants')
      .update({ credits_locked: true })
      .eq('match_id', matchId)
      .eq('user_id', req.userId);
  }

  // Check if match is now full → activate
  const totalParticipants = match.match_participants.length + 1;
  if (totalParticipants >= match.max_players) {
    await supabase
      .from('matches')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', matchId);
  }

  res.json({ message: 'Joined match successfully' });
});

// POST /api/matches/:id/result
router.post('/:id/result', authMiddleware, async (req, res) => {
  const { id: matchId } = req.params;
  const { claimed_result } = req.body;

  if (!['win', 'loss'].includes(claimed_result)) {
    return res.status(400).json({ error: 'claimed_result must be win or loss' });
  }

  // Verify user is a participant
  const { data: participant } = await supabase
    .from('match_participants')
    .select('*')
    .eq('match_id', matchId)
    .eq('user_id', req.userId)
    .single();

  if (!participant) return res.status(403).json({ error: 'Not a participant in this match' });
  if (participant.result_submitted) return res.status(400).json({ error: 'Result already submitted' });

  // Verify match is active
  const { data: match } = await supabase
    .from('matches')
    .select('status')
    .eq('id', matchId)
    .single();

  if (match?.status !== 'active') {
    return res.status(400).json({ error: 'Match is not active' });
  }

  // Verify proof was submitted
  const { data: proof } = await supabase
    .from('proofs')
    .select('id')
    .eq('match_id', matchId)
    .eq('user_id', req.userId)
    .single();

  if (!proof) {
    return res.status(400).json({ error: 'You must upload proof before submitting a result' });
  }

  // Record result
  await supabase
    .from('match_participants')
    .update({ claimed_result, result_submitted: true })
    .eq('match_id', matchId)
    .eq('user_id', req.userId);

  // Try to finalize
  const { checkAndFinalizeMatch } = require('../utils/matchLogic');
  await checkAndFinalizeMatch(matchId);

  res.json({ message: 'Result submitted' });
});

module.exports = router;
