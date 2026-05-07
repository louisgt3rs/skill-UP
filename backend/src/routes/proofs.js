const express = require('express');
const multer = require('multer');
const { authMiddleware } = require('../middleware/auth');
const { supabase } = require('../utils/supabase');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type'));
  },
});

// POST /api/proofs/upload
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { match_id } = req.body;
  if (!match_id) return res.status(400).json({ error: 'match_id is required' });

  // Verify user is a participant
  const { data: participant } = await supabase
    .from('match_participants')
    .select('id')
    .eq('match_id', match_id)
    .eq('user_id', req.userId)
    .single();

  if (!participant) return res.status(403).json({ error: 'Not a participant in this match' });

  // Verify match is active
  const { data: match } = await supabase
    .from('matches')
    .select('status')
    .eq('id', match_id)
    .single();

  if (match?.status !== 'active') {
    return res.status(400).json({ error: 'Match is not active' });
  }

  const ext = req.file.mimetype.split('/')[1];
  const path = `${match_id}/${req.userId}_${Date.now()}.${ext}`;
  const fileType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';

  const { error: uploadErr } = await supabase.storage
    .from('proofs')
    .upload(path, req.file.buffer, { contentType: req.file.mimetype, upsert: true });

  if (uploadErr) return res.status(500).json({ error: uploadErr.message });

  const { data: { publicUrl } } = supabase.storage.from('proofs').getPublicUrl(path);

  // Get signed URL instead (bucket is private)
  const { data: signedData } = await supabase.storage
    .from('proofs')
    .createSignedUrl(path, 60 * 60 * 24 * 7); // 7 days

  const fileUrl = signedData?.signedUrl || path;

  // Upsert proof record
  const { data: proof, error: proofErr } = await supabase
    .from('proofs')
    .upsert({ match_id, user_id: req.userId, file_url: path, file_type: fileType })
    .select()
    .single();

  if (proofErr) return res.status(500).json({ error: proofErr.message });

  res.json({ ...proof, signed_url: fileUrl });
});

// GET /api/proofs/signed-url
router.get('/signed-url', authMiddleware, async (req, res) => {
  const { path: filePath } = req.query;
  if (!filePath) return res.status(400).json({ error: 'path is required' });

  // Extract match_id from path (format: match_id/user_id_timestamp.ext)
  const matchId = filePath.split('/')[0];

  // Verify user is a participant
  const { data: participant } = await supabase
    .from('match_participants')
    .select('id')
    .eq('match_id', matchId)
    .eq('user_id', req.userId)
    .single();

  if (!participant) return res.status(403).json({ error: 'Access denied' });

  const { data, error } = await supabase.storage
    .from('proofs')
    .createSignedUrl(filePath, 60 * 60); // 1 hour

  if (error) return res.status(500).json({ error: error.message });
  res.json({ signed_url: data.signedUrl });
});

module.exports = router;
