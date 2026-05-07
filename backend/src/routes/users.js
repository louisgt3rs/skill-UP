const express = require('express');
const { body, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { supabase } = require('../utils/supabase');

const router = express.Router();

// GET /api/users/me
router.get('/me', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.userId)
    .single();

  if (error) return res.status(404).json({ error: 'User not found' });
  res.json(data);
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, avatar_url, credits, reputation, created_at')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'User not found' });
  res.json(data);
});

// PUT /api/users/me
router.put(
  '/me',
  authMiddleware,
  [body('username').optional().isLength({ min: 3, max: 30 }).trim()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, avatar_url } = req.body;
    const updates = {};
    if (username) updates.username = username;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.userId)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return res.status(400).json({ error: 'Username already taken' });
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  }
);

// GET /api/users/me/matches - match history
router.get('/me/matches', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('match_participants')
    .select(`
      team, result_submitted, claimed_result, joined_at,
      matches (id, game, format, entry_cost, status, winner_team, created_at)
    `)
    .eq('user_id', req.userId)
    .order('joined_at', { ascending: false })
    .limit(20);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
