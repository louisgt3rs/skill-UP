require('dotenv').config();
const express = require('express');
const cors = require('cors');

const matchRoutes = require('./src/routes/matches');
const proofRoutes = require('./src/routes/proofs');
const disputeRoutes = require('./src/routes/disputes');
const userRoutes = require('./src/routes/users');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/matches', matchRoutes);
app.use('/api/proofs', proofRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/users', userRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`SkillUp API running on port ${PORT}`);
});
