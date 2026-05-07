const express = require('express');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { supabase } = require('../utils/supabase');

const router = express.Router();

// GET /api/disputes (admin only)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('disputes')
    .select(`
      *,
      matches(id, game, format, entry_cost,
        match_participants(user_id, team, claimed_result,
          users(id, username, avatar_url)
        ),
        proofs(id, user_id, file_url, file_type)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/disputes/:matchId
router.get('/:matchId', authMiddleware, async (req, res) => {
  const { matchId } = req.params;

  // Verify user is admin or participant
  const { data: participant } = await supabase
    .from('match_participants')
    .select('id')
    .eq('match_id', matchId)
    .eq('user_id', req.userId)
    .single();

  const { data: user } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', req.userId)
    .single();

  if (!participant && !user?.is_admin) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { data, error } = await supabase
    .from('disputes')
    .select(`
      *,
      matches(id, game, format, entry_cost,
        match_participants(user_id, team, claimed_result,
          users(id, username, avatar_url)
        ),
        proofs(id, user_id, file_url, file_type)
      )
    `)
    .eq('match_id', matchId)
    .single();

  if (error) return res.status(404).json({ error: 'Dispute not found' });
  res.json(data);
});

// POST /api/disputes/:matchId/resolve (admin only)
router.post('/:matchId/resolve', authMiddleware, adminMiddleware, async (req, res) => {
  const { matchId } = req.params;
  const { winner_team, admin_notes } = req.body;

  if (![1, 2].includes(winner_team)) {
    return res.status(400).json({ error: 'winner_team must be 1 or 2' });
  }

  const { data: dispute } = await supabase
    .from('disputes')
    .select('id, status')
    .eq('match_id', matchId)
    .single();

  if (!dispute) return res.status(404).json({ error: 'Dispute not found' });
  if (dispute.status === 'resolved') return res.status(400).json({ error: 'Dispute already resolved' });

  // Distribute winnings
  const { error: rpcErr } = await supabase.rpc('distribute_winnings', {
    p_match_id: matchId,
    p_winner_team: winner_team,
  });

  if (rpcErr) return res.status(500).json({ error: rpcErr.message });

  // Mark dispute resolved
  await supabase
    .from('disputes')
    .update({
      status: 'resolved',
      winner_team,
      admin_notes: admin_notes || null,
      resolved_at: new Date().toISOString(),
    })
    .eq('match_id', matchId);

  res.json({ message: 'Dispute resolved', winner_team });
});

// POST /api/disputes/:matchId/report (any participant)
router.post('/:matchId/report', authMiddleware, async (req, res) => {
  const { matchId } = req.params;

  const { data: match } = await supabase
    .from('matches')
    .select('status')
    .eq('id', matchId)
    .single();

  if (!match) return res.status(404).json({ error: 'Match not found' });
  if (!['active', 'disputed'].includes(match.status)) {
    return res.status(400).json({ error: 'Can only report active or disputed matches' });
  }

  const { data: participant } = await supabase
    .from('match_participants')
    .select('id')
    .eq('match_id', matchId)
    .eq('user_id', req.userId)
    .single();

  if (!participant) return res.status(403).json({ error: 'Not a participant in this match' });

  await supabase.from('disputes').upsert({ match_id: matchId, status: 'open' });
  await supabase
    .from('matches')
    .update({ status: 'disputed', updated_at: new Date().toISOString() })
    .eq('id', matchId);

  res.json({ message: 'Match reported and marked as disputed' });
});

module.exports = router;
